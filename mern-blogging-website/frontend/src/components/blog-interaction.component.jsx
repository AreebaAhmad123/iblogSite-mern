import { useContext, useEffect, useState } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
    const [ isLiking, setIsLiking ] = useState(false);
    // Correct context consumption
    const {
        blog, 
        setBlog, 
        isLikedByUser, 
        setLikedByUser, 
        commentsWrapper,
        setCommentsWrapper
    } = useContext(BlogContext);
    const { userAuth, setUserAuth } = useContext(UserContext);

    // Proper destructuring of blog properties
    const {
        _id, 
        title = "",
        blog_id: blogId = "",
        activity: {
            total_likes: totalLikes = 0,
            total_comments = 0
        } = {},
        author: {
            personal_info: {
                username: author_username = ""
            } = {}
        } = {}
    } = blog || {};

    const username = userAuth?.username || "";
    const access_token = userAuth?.access_token || "";

    useEffect(() => {
        console.log("BlogInteraction mounted");
        console.log("Blog data:", blog);
        console.log("Author username:", author_username);
        console.log("Current user:", username);
        console.log("Should show edit button:", username === author_username);
    }, [blog, username, author_username]);

    const handleLike = () => {
        if(isLiking){
            return;
        }

        if (access_token) {
            setIsLiking(true);
            const newLikeStatus = !isLikedByUser;
            const updatedLikes = newLikeStatus ? totalLikes + 1 : totalLikes - 1;

            // Update state immediately for responsive UI
            setLikedByUser && setLikedByUser(newLikeStatus);
            setBlog && setBlog(prev => ({
                ...prev,
                activity: {
                    ...prev.activity,
                    total_likes: updatedLikes
                }
            }));

            axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/api/like-blog`, {
                blog_id: blogId,
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
            .then(() => {
                // Update liked_blogs in userAuth context
                setUserAuth && setUserAuth(prev => {
                    if (!prev) return prev;
                    let liked_blogs = prev.liked_blogs || [];
                    if (newLikeStatus) {
                        // Add blog to liked_blogs
                        if (!liked_blogs.includes(blogId)) {
                            liked_blogs = [...liked_blogs, blogId];
                        }
                    } else {
                        // Remove blog from liked_blogs
                        liked_blogs = liked_blogs.filter(id => id !== blogId);
                    }
                    return { ...prev, liked_blogs };
                });
            })
            .catch(err => {
                // Revert state on error
                setLikedByUser && setLikedByUser(!newLikeStatus);
                setBlog && setBlog(prev => ({
                    ...prev,
                    activity: {
                        ...prev.activity,
                        total_likes: totalLikes
                    }
                }));
                toast.error("Failed to update like status");
            })
            .finally(() => {
                setIsLiking(false);
            });
        } else {
            toast.error("Please login to like this blog");
        }
    }

    return (
        <>
            <Toaster />
            <hr className="border-grey my-2" />
            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80"
                        } ${ isLiking ? "cursor-not-allowed" : "" }`}
                    >
                        <i className={`fi ${isLikedByUser ? "fi-sr-heart" : "fi-rr-heart"}`}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{totalLikes}</p>

                    <button 
                    onClick={() => {
                        if (setCommentsWrapper) setCommentsWrapper(true);
                        const el = document.getElementById('comments-section');
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                        }
                    }} className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80 ">
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                <div className="flex gap-6 items-center">
                    {username === author_username && (
                        <Link to={`/editor/${blogId}`} className="underline hover:text-purple-600">
                            Edit
                        </Link>
                    )}
                    <Link to={`https://twitter.com/intent/tweet?text=Read ${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`}>
                        <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
                    </Link>
                </div>
            </div>
            <hr className="border-grey my-2" />
        </>
    );
};

export default BlogInteraction;