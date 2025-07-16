import axios from "axios";
import { useEffect, useState, createContext } from "react";
import { useParams, Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import getDay from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer from "../components/comments.component";
import SimilarBlogs from "../components/similar-blogs.component";
import { UserContext } from "../App";
import { lookInSession } from "../common/session";
import Sidebar from "../components/sidebar.component";
import { FiEye, FiTag } from "react-icons/fi";

export const BlogContext = createContext({});

export const blogStructure = {
    title: "",
    des: "",
    content: [],
    author: { personal_info: {} },
    banner: "",
    publishedAt: "",
    comments: { results: [] },
    activity: { total_parent_comments: 0 }
};

const BlogPage = () => {
    const { blog_id } = useParams();
    const [blog, setBlog] = useState(blogStructure);
    const [similarBlogs, setSimilarBlogs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLikedByUser, setLikedByUser] = useState(false);
    const [commentsWrapper, setCommentsWrapper] = useState(true);
    const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
    const [topPosts, setTopPosts] = useState([]);
    const [trendingTags, setTrendingTags] = useState([]);
    const [authorInfo, setAuthorInfo] = useState(null);

    const fetchComments = async ({ blog_id, setParentCommentCountFun }) => {
        try {
            console.log('Fetching comments for blog:', blog_id);
            if (!blog_id) {
                console.error('Blog ID is missing');
                return { results: [] };
            }

            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog-comments",
                { blog_id }
            );

            console.log('Comments response:', data);

            if (data.comments) {
                setParentCommentCountFun(data.comments.length);
                return { results: data.comments };
            }
            return { results: [] };
        } catch (err) {
            console.error("Error fetching comments:", err);
            if (err.response) {
                console.error("Error details:", err.response.data);
            }
            return { results: [] };
        }
    };

    const fetchBlog = async () => {
        try {
            const { data: { blog, likedByUser } } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog",
                { blog_id }
            );

            console.log("Received blog data:", blog);
            setBlog(blog);
            setLikedByUser(likedByUser);

            if (blog && blog.blog_id) {
                console.log('Fetching comments for blog ID:', blog.blog_id);
                const comments = await fetchComments({
                    blog_id: blog.blog_id,
                    setParentCommentCountFun: setTotalParentCommentsLoaded
                });
                blog.comments = comments;
                setBlog(blog);
            }

            // Fetch similar blogs
            if (blog.tags && blog.tags.length > 0) {
                const { data } = await axios.post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs",
                    {
                        tag: blog.tags[0],
                        limit: 6,
                        eleminate_blog: blog_id,
                    }
                );
                setSimilarBlogs(data.blogs);
            }
        } catch (err) {
            console.error("Error fetching blog:", err);
            if (err.response) {
                console.error("Error details:", err.response.data);
                console.error("Error status:", err.response.status);
                console.error("Error headers:", err.response.headers);
            }
            setBlog(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setBlog(blogStructure);
        setSimilarBlogs(null);
        setLoading(true);
        fetchBlog();
        setLikedByUser(false);
        setCommentsWrapper(false);
        setTotalParentCommentsLoaded(0);
        // Only fetch top posts and trending tags here
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/api/trending-blogs")
          .then(res => setTopPosts(res.data.blogs))
          .catch(console.error);
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/api/trending-tags")
          .then(res => setTrendingTags(res.data.tags.map(tagObj => tagObj._id)))
          .catch(console.error);
    }, [blog_id]);

    // Improved dependency for author info fetch
    useEffect(() => {
        const username = blog?.author?.personal_info?.username;
        if (username) {
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-profile", { username })
                .then(res => setAuthorInfo(res.data))
                .catch(console.error);
        }
    }, [blog?.author?.personal_info?.username]);

    if (loading) {
        return <Loader />;
    }

    if (!blog) {
        return <div className="max-w-[900px] center py-10">Blog not found</div>;
    }

    // Safe destructuring with null checks
    const {
        title = "",
        content = [],
        banner = "",
        publishedAt = "",
    } = blog;

    // Check if content exists and has blocks
    const hasContent = content && content.length > 0 && content[0] && content[0].blocks;

    return (
        <AnimationWrapper>
            <BlogContext.Provider value={{ 
                blog, 
                setBlog, 
                isLikedByUser, 
                setLikedByUser, 
                commentsWrapper, 
                setCommentsWrapper, 
                totalParentCommentsLoaded, 
                setTotalParentCommentsLoaded,
                fetchBlog
            }}>
                <div className="flex flex-row gap-8 max-w-6xl mx-auto py-10 max-lg:px-[5vw] items-start">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{title}</h1>
                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-6">
                            <span>Published on {getDay(publishedAt)}</span>
                            <span className="hidden sm:block">•</span>
                            <span className="flex items-center gap-1"><FiEye className="inline-block" /> {blog.activity?.total_reads || 0} Views</span>
                            {blog.tags && blog.tags.length > 0 && (
                                <>
                                    <span className="hidden sm:block">•</span>
                                    <span className="flex items-center gap-1"><FiTag className="inline-block" /> {blog.tags[0]}</span>
                                </>
                            )}
                        </div>
                        {/* Main Image */}
                        <img src={banner} alt="Blog Banner" className="aspect-video rounded-xl w-full object-cover mb-8" />
                        {/* Blog Content */}
                        <div className="my-8 font-geliasio blog-page-content text-base md:text-lg leading-relaxed">
                            {hasContent ? content[0].blocks.map((block, i) => (
                                <div key={i} className="my-4 md:my-8">
                                    <BlogContent block={block} />
                                </div>
                            )) : (
                                <div className="text-gray-500 italic">No content available</div>
                            )}
                        </div>
                        {/* Related Posts Section */}
                        <SimilarBlogs currentBlogId={blog_id} tags={blog.tags || []} similarBlogs={similarBlogs} />
                        <BlogInteraction />
                    </div>
                    {/* Sidebar */}
                    <div className="hidden lg:flex flex-col w-80 flex-shrink-0 gap-6">
                        <Sidebar
                            author={authorInfo}
                            tags={blog.tags || []}
                            topPosts={topPosts}
                            blogId={blog.blog_id}
                        />
                    </div>
                </div>
                {/* Comments section full width below main content/sidebar */}
                <CommentsContainer />
            </BlogContext.Provider>
        </AnimationWrapper>
    );
};

export default BlogPage;