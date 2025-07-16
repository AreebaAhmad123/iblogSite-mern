import BlogCard from "./BlogCard";

const TrendingBlogPost = ({ blog, className, variant = "trending", showAuthor = false, showStats = false, showBookmark = false, showLike = false }) => {
    if (!blog) {
        return null;
    }

    return (
        <div className={className}>
            <BlogCard 
                blog={blog}
                variant={variant}
                showAuthor={showAuthor}
                showStats={showStats}
                showBookmark={showBookmark}
                showLike={showLike}
            />
        </div>
    );
};

export default TrendingBlogPost; 