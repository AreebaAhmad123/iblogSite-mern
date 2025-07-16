import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserContext } from "../App";
import { useBookmark } from "../hooks/useBookmark";
import { useLike } from "../hooks/useLike";
import getDay, { getFullDay } from "../common/date";
import { cardHover, cardTap, imageHover, buttonHover } from "../common/animations";

const BlogCard = ({ 
  blog, 
  variant = "default", // "default", "compact", "trending", "sidebar"
  showAuthor = true,
  showStats = true,
  showBookmark = true,
  showLike = true,
  className = "",
  onLikeToggle
}) => {
  const [imageError, setImageError] = useState(false);
  const { userAuth } = useContext(UserContext);
  const { handleBookmark, isBookmarked, bookmarking } = useBookmark();
  const { handleLike, loading: likeLoading } = useLike();

  // Local state for likes and liked status
  const [likes, setLikes] = useState(blog.activity?.total_likes || 0);
  const [isLiked, setIsLiked] = useState(blog.liked || false);

  const defaultBanner = "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80";
  const banner = imageError ? defaultBanner : (blog.banner || defaultBanner);
  
  const blogId = blog.blog_id || blog._id;
  const author = blog.author || {};
  const authorName = author.fullname || author.name || "Unknown Author";
  const authorUsername = author.username || "";
  const authorImage = author.profile_img || author.avatar || '/src/imgs/user profile.png';
  const publishedDate = blog.publishedAt || blog.date;

  const handleLikeClick = async (e) => {
    e.preventDefault();
    const result = await handleLike(blogId, likes, isLiked, onLikeToggle);
    if (result.success) {
      setLikes(result.likes);
      setIsLiked(result.isLiked);
    }
  };

  const handleBookmarkClick = async (e) => {
    await handleBookmark(blogId, e);
  };

  // Variant-specific configurations
  const getVariantConfig = () => {
    switch (variant) {
      case "compact":
        return {
          containerClass: "flex flex-col bg-white rounded-lg shadow-md p-4 h-[340px] w-full max-w-full hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
          imageClass: "rounded-md w-full h-32 object-cover",
          titleClass: "font-semibold text-base mb-1 line-clamp-2",
          descriptionClass: "text-gray-500 text-sm mb-3 line-clamp-2",
          authorClass: "text-sm font-medium",
          dateClass: "text-xs text-gray-400"
        };
      case "trending":
        return {
          containerClass: "relative w-full h-full rounded-lg overflow-hidden group block",
          imageClass: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          overlayClass: "absolute bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm",
          titleClass: "text-xs font-normal text-black",
          descriptionClass: "text-gray-800 mt-1 line-clamp-2 text-sm"
        };
      case "sidebar":
        return {
          containerClass: "flex gap-4 border-b border-grey pb-5 mb-4",
          imageClass: "w-16 h-16 rounded-md object-cover",
          titleClass: "font-semibold text-sm line-clamp-2",
          descriptionClass: "text-gray-500 text-xs line-clamp-2 mt-1"
        };
      default:
        return {
          containerClass: "block border-b border-grey pb-5 mb-4",
          imageClass: "w-full h-40 sm:w-36 sm:h-28 flex-shrink-0 bg-grey rounded-md overflow-hidden object-cover",
          titleClass: "blog-title",
          descriptionClass: "my-3 text-base sm:text-xl font-gelasio leading-7 line-clamp-2",
          authorClass: "line-clamp-1",
          dateClass: "min-w-fit"
        };
    }
  };

  const config = getVariantConfig();

  // Render trending variant
  if (variant === "trending") {
    return (
      <Link to={`/blog/${blogId}`} className={`${config.containerClass} ${className}`}>
        <img
          src={banner}
          alt={blog.title}
          className={config.imageClass}
          onError={() => setImageError(true)}
        />
        <div className={config.overlayClass}>
          <h3 className={config.titleClass} style={{ fontSize: '10px' }}>{blog.title}</h3>
          <p className={config.descriptionClass}>{blog.des || blog.description}</p>
        </div>
      </Link>
    );
  }

  // Render compact variant
  if (variant === "compact") {
    return (
      <motion.div
        variants={cardHover}
        whileHover="hover"
        whileTap="tap"
        initial="initial"
        animate="animate"
        className="w-full max-w-full"
      >
        <Link to={`/blog/${blogId}`} className="block w-full max-w-full">
          <div className={config.containerClass}>
            <motion.div
              variants={imageHover}
              whileHover="hover"
              className="overflow-hidden rounded-md mb-3"
            >
              <img
                src={banner}
                alt={blog.title}
                className={config.imageClass}
                onError={() => setImageError(true)}
              />
            </motion.div>
            <motion.h3 
              className={config.titleClass}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {blog.title}
            </motion.h3>
            <motion.p 
              className={config.descriptionClass}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {blog.des || blog.description}
            </motion.p>
            <div className="flex items-center mt-auto bg-gray-100 rounded-xl px-3 w-full">
              {showAuthor && authorImage && (
                <motion.img
                  src={authorImage}
                  alt={authorName}
                  className="w-8 h-8 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div className="ml-2 flex-grow flex items-center justify-between">
                <div>
                  <div className={config.authorClass}>{authorName}</div>
                  <div className={config.dateClass}>
                    {publishedDate ? getFullDay(publishedDate) : "No date"}
                  </div>
                </div>
                {showBookmark && (
                  <motion.button 
                    onClick={handleBookmarkClick}
                    aria-label={isBookmarked(blogId) ? "Unbookmark" : "Bookmark"}
                    disabled={bookmarking}
                    variants={buttonHover}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {isBookmarked(blogId) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-black dark:hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Render sidebar variant
  if (variant === "sidebar") {
    return (
      <Link to={`/blog/${blogId}`} className={`${config.containerClass} ${className}`}>
        <div className="w-16 h-16 flex-shrink-0">
          <img src={banner} className={config.imageClass} onError={() => setImageError(true)} />
        </div>
        <div className="flex-1">
          <h3 className={config.titleClass}>{blog.title}</h3>
          <p className={config.descriptionClass}>{blog.des || blog.description}</p>
        </div>
      </Link>
    );
  }

  // Render default variant
  return (
    <Link to={`/blog/${blogId}`} className={`${config.containerClass} ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-stretch">
        <div className="w-full h-40 sm:w-36 sm:h-28 flex-shrink-0 bg-grey rounded-md overflow-hidden">
          <img src={banner} className="w-full h-full object-cover" onError={() => setImageError(true)} />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {showAuthor && (
              <div className="flex gap-2 items-center mb-4">
                <img src={authorImage} className="w-6 h-6 rounded-full" alt={authorName} />
                <p className={config.authorClass}>{authorName} {authorUsername && `@${authorUsername}`}</p>
                <p className={config.dateClass}>{publishedDate ? getDay(publishedDate) : "No date"}</p>
              </div>
            )}
            <h1 className={config.titleClass}>{blog.title}</h1>
            <p className={config.descriptionClass}>{blog.des || blog.description}</p>
          </div>
          {showStats && (
            <div className="flex flex-wrap gap-3 mt-4 items-center">
              {blog.tags && blog.tags[0] && (
                <span className="btn-light py-1 px-4">{blog.tags[0]}</span>
              )}
              {showLike && (
                <button 
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                  className={`flex items-center gap-2 text-dark-grey ${isLiked ? 'text-red-500' : ''} hover:text-red-500 transition-colors`}
                >
                  <i className={`fi ${isLiked ? 'fi-sr-heart' : 'fi-rr-heart'} text-xl`}></i>
                  {likes}
                </button>
              )}
              {showBookmark && (
                <button 
                  onClick={handleBookmarkClick}
                  disabled={bookmarking}
                  className={`flex items-center gap-2 text-dark-grey ${isBookmarked(blogId) ? 'text-yellow-500' : ''} hover:text-yellow-500 transition-colors`}
                  aria-label={isBookmarked(blogId) ? "Unbookmark" : "Bookmark"}
                >
                  <i className={`fi ${isBookmarked(blogId) ? 'fi-sr-bookmark' : 'fi-rr-bookmark'} text-xl`}></i>
                </button>
              )}
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <i className="fi fi-rr-eye"></i> {blog.activity?.total_reads || 0} 
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <i className="fi fi-rr-comment-dots"></i> {blog.activity?.total_comments || 0} 
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BlogCard; 