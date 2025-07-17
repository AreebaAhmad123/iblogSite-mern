import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";
import getDay from "../common/date";
import { Toaster, toast } from "react-hot-toast";
import userProfile from "../imgs/user profile.png";

const CommentCard = ({ commentData, index, leftVal }) => {
    console.log('CommentCard received commentData:', commentData);
    if (!commentData || !commentData._id) return null;

    const [isDeleting, setIsDeleting] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyComment, setReplyComment] = useState("");
    const [showReplies, setShowReplies] = useState(false);
    const [showAllReplies, setShowAllReplies] = useState(false);
    const { userAuth } = useContext(UserContext);
    const { blog, setBlog, fetchBlog } = useContext(BlogContext);

    const { _id, comment, commented_by, commentedAt, children } = commentData;

    // Allow comment author or admins to delete comments
    const canDelete = userAuth && commented_by && (
        commented_by._id === userAuth._id || 
        commented_by.toString() === userAuth._id
    );

    // Debug log for troubleshooting
    console.log('userAuth:', userAuth);
    console.log('canDelete:', canDelete);

    const handleDelete = async () => {
        if (!canDelete || !blog?.blog_id) return;
        
        if (window.confirm('Are you sure you want to delete this comment?')) {
            setIsDeleting(true);
            try {
                const { data } = await axios.post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/api/delete-comment",
                    { comment_id: _id, blog_id: blog.blog_id || blog._id },
                    {
                        headers: {
                            'Authorization': `Bearer ${userAuth.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (data.success) {
                    // Refresh the blog data to update comment count
                    if (typeof fetchBlog === 'function') {
                        await fetchBlog();
                    }
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                if (error.response?.data?.error) {
                    toast.error('Error deleting comment: ' + error.response.data.error);
                } else {
                    toast.error('Failed to delete comment. Please try again.');
                }
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleReply = async () => {
        if (!replyComment.trim() || !blog?.blog_id) return;
        
        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/api/add-comment",
                {
                    blog_id: blog.blog_id || blog._id,
                    comment: replyComment.trim(),
                    blog_author: blog.author?._id,
                    parent: _id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${userAuth.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (data.success) {
                setReplyComment("");
                setIsReplying(false);
                // Insert the new reply into the children array of the parent comment in local state
                const newReply = data.comment;
                const updateChildren = (comments, parentId, reply) => {
                    return comments.map(c => {
                        if (c._id === parentId) {
                            return {
                                ...c,
                                children: Array.isArray(c.children) ? [...c.children, reply] : [reply]
                            };
                        } else if (Array.isArray(c.children) && c.children.length > 0) {
                            return {
                                ...c,
                                children: updateChildren(c.children, parentId, reply)
                            };
                        } else {
                            return c;
                        }
                    });
                };
                const updatedBlog = { ...blog };
                if (updatedBlog.comments && Array.isArray(updatedBlog.comments.results)) {
                    updatedBlog.comments.results = updateChildren(updatedBlog.comments.results, _id, newReply);
                }
                setBlog(updatedBlog);
                toast.success('Reply posted successfully!');
                if (typeof fetchBlog === 'function') {
                    await fetchBlog();
                }
            }
        } catch (error) {
            console.error('Error posting reply:', error);
            if (error.response?.data?.error) {
                toast.error('Error posting reply: ' + error.response.data.error);
            } else {
                toast.error('Failed to post reply. Please try again.');
            }
        }
    };

    return (
        <>
            <Toaster />
            <div className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow" style={{ marginLeft: `${(leftVal || 0) * 24}px` }}>
            <div className="flex items-start space-x-3">
                <img 
                    src={commented_by?.personal_info?.profile_img || commented_by?.profile_img || userProfile} 
                    alt={commented_by?.personal_info?.fullname || commented_by?.fullname || 'User'}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-800">
                                {commented_by?.personal_info?.fullname || commented_by?.fullname || 'Unknown User'}
                            </h4>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                                {getDay(commentedAt)}
                            </span>
                            
                            {/* Debug log */}
                            {console.log('userAuth in CommentCard:', userAuth)}
                            {console.log('userAuth check result:', !!userAuth)}
                            
                            {userAuth && userAuth.access_token && (
                                <button
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="text-black underline hover:text-black font-medium px-2 py-1 bg-transparent border-none cursor-pointer"
                                    title="Reply to comment"
                                >
                                    Reply
                                </button>
                            )}
                            
                            {/* Debug: Show if userAuth exists but no access_token */}
                            {userAuth && !userAuth.access_token && (
                                <span className="text-xs text-gray-400">(No token)</span>
                            )}
                            
                            {/* Debug: Show if not logged in */}
                            {!userAuth && (
                                <span className="text-xs text-gray-400">(Not logged in)</span>
                            )}
                            
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-red underline hover:text-red-700 font-medium px-2 py-1 bg-transparent border-none cursor-pointer disabled:opacity-50"
                                    title="Delete comment"
                                    style={{background: 'none', border: 'none'}}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-black dark:text-white leading-relaxed whitespace-pre-wrap">
                        {comment}
                    </p>

                    {/* Reply form */}
                    {isReplying && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <textarea
                                value={replyComment}
                                onChange={(e) => setReplyComment(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full p-2 border border-gray-300 rounded-md resize-none h-20 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleReply}
                                    disabled={!replyComment.trim()}
                                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reply
                                </button>
                                <button
                                    onClick={() => {
                                        setIsReplying(false);
                                        setReplyComment("");
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Render nested replies with show more functionality */}
            {Array.isArray(children) && children.length > 0 && (
                <div className="mt-4">
                    {children.slice(0, showAllReplies ? children.length : 2).map((childComment, idx) => (
                        <CommentCard
                            key={childComment._id || idx}
                            commentData={childComment}
                            index={idx}
                            leftVal={(leftVal || 0) + 1}
                        />
                    ))}
                    {children.length > 2 && !showAllReplies && (
                        <button
                            className="text-sm text-black underline hover:text-gray-700 mt-2"
                            onClick={() => setShowAllReplies(true)}
                        >
                            Show more replies ({children.length - 2} more)
                        </button>
                    )}
                    {children.length > 2 && showAllReplies && (
                        <button
                            className="text-sm text-black underline hover:text-gray-700 mt-2"
                            onClick={() => setShowAllReplies(false)}
                        >
                            Show less replies
                        </button>
                    )}
                </div>
            )}
        </div>
        </>
    );
};

export default CommentCard;
