import mongoose from "mongoose";
const { Schema } = mongoose;
import { nanoid } from 'nanoid';

const blogSchema = mongoose.Schema({

    blog_id: {
        type: String,
        unique: true,
        validate: {
            validator: function(v) {
                // Blog ID should be alphanumeric with hyphens, 3-100 characters
                const blogIdRegex = /^[a-z0-9-]+$/;
                return blogIdRegex.test(v) && v.length >= 3 && v.length <= 100;
            },
            message: props => `${props.value} is not a valid blog ID! Blog ID must be 3-100 characters long and contain only lowercase letters, numbers, and hyphens.`
        }
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Title cannot be empty'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    banner: {
        type: String,
        trim: true,
        // required: true, // Only required for published blogs
    },
    des: {
        type: String,
        maxlength: 200,
        trim: true,
        // required: true // Only required for published blogs
    },
    content: {
        type: [{
            time: {
                type: Number,
                default: Date.now
            },
            blocks: {
                type: Array,
                default: []
            },
            version: {
                type: String,
                default: '2.27.2'
            }
        }],
        default: [{ time: Date.now(), blocks: [], version: '2.27.2' }],
        validate: {
            validator: function(v) {
                if (!Array.isArray(v)) return false;
                return v.every(item => 
                    item && 
                    typeof item === 'object' && 
                    Array.isArray(item.blocks)
                );
            },
            message: 'Invalid content structure'
        }
    },
    tags: {
        type: [String],
        validate: {
            validator: function(v) {
                if (!Array.isArray(v)) return false;
                // For drafts, allow empty tags array
                if (this.draft && v.length === 0) return true;
                // For published blogs, require at least one non-empty tag
                return v.length > 0 && v.every(tag => typeof tag === 'string' && tag.trim().length > 0);
            },
            message: 'Tags must be an array of non-empty strings for published blogs'
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    activity: {
        total_likes: {
            type: Number,
            default: 0,
            min: 0
        },
        total_comments: {
            type: Number,
            default: 0,
            min: 0
        },
        total_reads: {
            type: Number,
            default: 0,
            min: 0
        },
        total_parent_comments: {
            type: Number,
            default: 0,
            min: 0
        },
    },
    comments: {
        type: [Schema.Types.ObjectId],
        ref: 'comments'
    },
    draft: {
        type: Boolean,
        default: false
    }

}, 
{ 
    timestamps: {
        createdAt: 'publishedAt'
    } 

})

// Pre-save hook to ensure blog_id is always set and valid
blogSchema.pre('save', async function(next) {
    try {
        if (!this.blog_id || this.blog_id.trim() === '') {
            // Use title or fallback to nanoid
            const base = this.title ? 
                this.title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                    .trim()
                    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
                : 'blog';
            
            // Ensure base is not empty
            const safeBase = base.length > 0 ? base : 'blog';
            
            // Generate unique blog_id
            let blogId = safeBase + '-' + nanoid(8);
            let counter = 0;
            const maxAttempts = 10;
            
            // Check for duplicates and regenerate if needed
            while (counter < maxAttempts) {
                const existing = await this.constructor.findOne({ blog_id: blogId });
                if (!existing) {
                    break;
                }
                blogId = safeBase + '-' + nanoid(8);
                counter++;
            }
            
            // If we still have duplicates after max attempts, use timestamp
            if (counter >= maxAttempts) {
                blogId = safeBase + '-' + Date.now() + '-' + nanoid(4);
            }
            
            this.blog_id = blogId.toLowerCase();
        } else {
            // Ensure blog_id is lowercase
            this.blog_id = this.blog_id.toLowerCase();
        }
        
        next();
    } catch (error) {
        console.error('Error in blog pre-save hook:', error);
        // Generate a fallback blog_id if something goes wrong
        this.blog_id = 'blog-' + Date.now() + '-' + nanoid(4);
        next();
    }
});

// Index for better query performance
blogSchema.index({ blog_id: 1 });
blogSchema.index({ author: 1, draft: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ publishedAt: -1 });

// Virtual for checking if blog is published
blogSchema.virtual('isPublished').get(function() {
    return !this.draft;
});

// Method to validate blog for publishing
blogSchema.methods.validateForPublishing = function() {
    const errors = [];
    
    if (!this.title || this.title.trim().length === 0) {
        errors.push('Title is required');
    }
    
    if (!this.des || this.des.trim().length === 0) {
        errors.push('Description is required');
    }
    
    if (this.des && this.des.length > 200) {
        errors.push('Description cannot exceed 200 characters');
    }
    
    if (!this.banner || this.banner.trim().length === 0) {
        errors.push('Banner image is required');
    }
    
    if (!this.content || !Array.isArray(this.content) || this.content.length === 0) {
        errors.push('Content is required');
    } else {
        const blocks = this.content[0]?.blocks;
        if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
            errors.push('Blog content is required');
        }
    }
    
    if (!this.tags || !Array.isArray(this.tags) || this.tags.length === 0) {
        errors.push('At least one tag is required');
    }
    
    if (this.tags && this.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
    }
    
    return errors;
};

// Static method to generate unique blog ID
blogSchema.statics.generateUniqueBlogId = async function(title) {
    const base = title ? 
        title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .replace(/^-+|-+$/g, '')
        : 'blog';
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const blogId = base + '-' + nanoid(8);
        const existingBlog = await this.findOne({ blog_id: blogId });
        
        if (!existingBlog) {
            return blogId;
        }
        
        attempts++;
    }
    
    throw new Error('Failed to generate unique blog ID');
};

export default mongoose.model("blogs", blogSchema);