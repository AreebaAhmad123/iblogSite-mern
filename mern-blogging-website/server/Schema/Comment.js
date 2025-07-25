import mongoose, { Schema } from "mongoose";

const commentSchema = mongoose.Schema({
    
    blog_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'blogs'
    },
    blog_author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users',
    },
    comment: {
        type: String,
        required: true
    },
    children: {
        type: [Schema.Types.ObjectId],
        ref: 'comments'
    },
    commented_by: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    isReply: {
        type: Boolean,
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'comments'
    },
    isSpam: {
        type: Boolean,
        default: false
    }

},
{
    timestamps: {
        createdAt: 'commentedAt'
    }
})

export default mongoose.model("comments", commentSchema)