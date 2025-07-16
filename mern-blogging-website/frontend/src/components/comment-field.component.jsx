import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";

const CommentField = ({ action, type = "Comment" }) => {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userAuth } = useContext(UserContext);
    const { blog, setBlog } = useContext(BlogContext);

    // Robust login check based on user info
    const isLoggedIn = !!(userAuth?.username || userAuth?.profile_img || userAuth?.fullname || userAuth?.personal_info?.username || userAuth?.personal_info?.profile_img || userAuth?.personal_info?.fullname);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!comment.trim() || !blog?.blog_id) return;
        
        setIsSubmitting(true);
        
        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/api/add-comment",
                {
                    blog_id: blog.blog_id || blog._id,
                    comment: comment.trim(),
                    blog_author: blog.author?._id
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (data.success) {
                setComment("");
                // Refresh comments
                const updatedBlog = { ...blog };
                if (!updatedBlog.comments) {
                    updatedBlog.comments = { results: [] };
                }
                if (!updatedBlog.activity) {
                    updatedBlog.activity = { total_parent_comments: 0 };
                }
                
                // Add the new comment to the comments array
                if (data.comment && updatedBlog.comments.results) {
                    updatedBlog.comments.results.unshift(data.comment);
                }
                
                setBlog(updatedBlog);
                toast.success('Comment posted successfully!');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            // Show user-friendly error message
            if (error.response?.data?.error) {
                toast.error('Error posting comment: ' + error.response.data.error);
            } else {
                toast.error('Failed to post comment. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 mb-2">Please log in to leave a comment</p>
                <Link to="/login" className="text-yellow-300 hover:text-yellow-400 font-medium">
                    Login to Comment
                </Link>
            </div>
        );
    }

    return (
        <>
            <Toaster />
            <AnimationWrapper>
                <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border comment-field">
                <div className="flex items-start space-x-3">
                    <img 
                        src={userAuth?.personal_info?.profile_img || userAuth?.profile_img || '/src/imgs/user profile.png'} 
                        alt={userAuth?.personal_info?.fullname || userAuth?.fullname || 'Profile'} 
                        className="w-10 h-10 rounded-full"
                    />
                    
                    <div className="flex-1">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={`Share your thoughts on this story...`}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent resize-none"
                            rows="3"
                            disabled={isSubmitting}
                            maxLength={500}
                        />
                        
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-500">
                                {comment.length}/500 characters
                            </span>
                            
                            <button
                                type="submit"
                                disabled={!comment.trim() || isSubmitting || comment.length > 500}
                                className="px-4 py-2 bg-yellow-300 text-white rounded-lg hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? 'Posting...' : `Post ${type}`}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AnimationWrapper>
        </>
    );
};

export default CommentField;
