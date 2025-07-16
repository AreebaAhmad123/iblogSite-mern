import mongoose, { Schema } from "mongoose";

const notificationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["like", "comment", "reply", "new_user", "newsletter", "admin_status_change_request"],
        required: true
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blogs',
        required: false,
        validate: {
            validator: function (value) {
                // For like, comment, reply, blog is required
                if (["like", "comment", "reply"].includes(this.type)) {
                    return !!value;
                }
                // For new_user, blog is not required
                return true;
            },
            message: 'blog is required for this notification type.'
        }
    },
    notification_for: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: function() {
            // Only require user for non-newsletter notifications
            return this.type !== 'newsletter';
        }
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'comments'
    },
    reply: {
        type: Schema.Types.ObjectId,
        ref: 'comments'
    }, 
    replied_on_comment:{
        type: Schema.Types.ObjectId,
        ref: 'comments'
    },
    seen: {
        type: Boolean,
        default: false
    },
    for_role: {
        type: String
    },
    // --- ADDED FOR ADMIN STATUS CHANGE REQUEST NOTIFICATIONS ---
    targetUser: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: false
    },
    action: {
        type: String,
        enum: ['promote', 'demote'],
        required: false
    },
    statusChangeRequest: {
        type: Schema.Types.ObjectId,
        ref: 'AdminStatusChangeRequest',
        required: false
    }
},
{
    timestamps: true
}
)

export default mongoose.model("notification", notificationSchema)