import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "./blog-post.component";
import Loader from "./loader.component";
import { UserContext } from "../App";

const SimilarBlogs = ({ currentBlogId, tags }) => {
    const [similarBlogs, setSimilarBlogs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(4);
    const [loadingMore, setLoadingMore] = useState(false);
    const { userAuth, setUserAuth } = useContext(UserContext);

    useEffect(() => {
        const fetchSimilarBlogs = async () => {
            if (!tags || tags.length === 0) {
                setSimilarBlogs([]);
                setLoading(false);
                return;
            }

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_DOMAIN}/api/search-blogs`,
                    {
                        tag: tags[0],
                        limit: 20, // Fetch more blogs initially to support load more
                        eleminate_blog: currentBlogId
                    }
                );
                setSimilarBlogs(data.blogs);
            } catch (err) {
                console.error("Error fetching similar blogs:", err);
                setSimilarBlogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilarBlogs();
    }, [currentBlogId, tags]);

    const handleLoadMore = () => {
        setLoadingMore(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setDisplayCount(prev => prev + 4);
            setLoadingMore(false);
        }, 500);
    };

    const handleLikeToggle = (liked, blog_id) => {
        setUserAuth((prev) => {
            if (!prev) return prev;
            
            let liked_blogs = prev.liked_blogs || [];
            
            if (liked) {
                if (!liked_blogs.includes(blog_id)) {
                    liked_blogs = [...liked_blogs, blog_id];
                }
            } else {
                liked_blogs = liked_blogs.filter(id => id !== blog_id);
            }
            
            return { ...prev, liked_blogs };
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!similarBlogs || similarBlogs.length === 0) {
        return null;
    }

    const displayedBlogs = similarBlogs.slice(0, displayCount);
    const hasMoreBlogs = displayCount < similarBlogs.length;

    return (
        <div className="mt-14">
            <h1 className="text-2xl mb-10 font-medium">Similar Blogs</h1>
            {displayedBlogs.map((blog, i) => {
                let { author: { personal_info } } = blog;
                return (
                    <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                        <BlogPostCard 
                            content={blog} 
                            author={personal_info} 
                            liked={userAuth?.liked_blogs?.includes(blog.blog_id)}
                            onLikeToggle={handleLikeToggle}
                        />
                    </AnimationWrapper>
                );
            })}
            
            {hasMoreBlogs && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="btn-dark py-3 px-8 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingMore ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                            </div>
                        ) : (
                            "Load More"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SimilarBlogs; 