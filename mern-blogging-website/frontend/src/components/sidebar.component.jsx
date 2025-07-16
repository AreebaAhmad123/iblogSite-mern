import React, { useContext } from "react";
import { Link } from "react-router-dom";
import getDay, { getFullDay } from "../common/date";
import { BlogContext } from "../pages/blog.page";
import { UserContext } from "../App";
import { useBookmark } from "../hooks/useBookmark";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = ({ author, tags, topPosts, blogId }) => {
  const { setCommentsWrapper } = useContext(BlogContext) || {};
  const { userAuth } = useContext(UserContext) || {};
  const { handleBookmark, isBookmarked, bookmarking } = useBookmark();

  const handleCommentClick = () => {
    if (setCommentsWrapper) setCommentsWrapper(true);
    const el = document.getElementById("comments-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleBookmarkClick = async () => {
    if (!blogId) return;
    await handleBookmark(blogId);
  };

  const handleShare = async () => {
    if (!blogId) return;
    const url = window.location.origin + "/blog/" + blogId;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Blog link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <aside className="w-full max-w-xs flex flex-col gap-6 bg-white text-black dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg dark:shadow-gray-900/50">
      {/* Action Buttons */}
      <div className="flex gap-3 mb-2">
        <button
          className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg py-2 flex items-center justify-center gap-2 text-gray-700 dark:text-white font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:hover:shadow-gray-800/50 transform"
          onClick={handleShare}
          disabled={!blogId}
        >
          <i className="fi fi-rs-paper-plane text-gray-600 dark:text-gray-300 transition-colors duration-300"></i> 
          <span className="text-gray-700 dark:text-white transition-colors duration-300">Share</span>
        </button>
        {blogId && (
          <button
            className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg py-2 flex items-center justify-center gap-2 text-gray-700 dark:text-white font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:hover:shadow-gray-800/50 transform"
            onClick={handleBookmarkClick}
            disabled={bookmarking}
            aria-label={isBookmarked(blogId) ? "Unbookmark" : "Bookmark"}
          >
            {isBookmarked(blogId) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5  transition-all duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-white transition-all duration-300 hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
            )}
            <span className="text-gray-700 dark:text-white transition-colors duration-300">Save</span>
          </button>
        )}
        <button
          className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg py-2 flex items-center justify-center gap-2 text-gray-700 dark:text-white font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:hover:shadow-gray-800/50 transform"
          onClick={handleCommentClick}
        >
          <i className="fi fi-rs-comment-dots text-gray-600 dark:text-gray-300 transition-colors duration-300"></i> 
          <span className="text-gray-700 dark:text-white transition-colors duration-300">Comment</span>
        </button>
      </div>

      {/* Tags */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:scale-[1.02] transform">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-yellow-500 text-lg transition-all duration-300 hover:scale-110 transform">•</span> Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag, idx) => (
            <Link
              to={`/search/${encodeURIComponent(tag)}`}
              key={idx}
              className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md dark:hover:shadow-gray-700/50 transform hover:-translate-y-1"
              style={{ textDecoration: 'none' }}
            >
              <span className="text-gray-700 dark:text-gray-200 transition-colors duration-300">{tag}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Top Posts */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:scale-[1.02] transform">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-yellow-500 text-lg transition-all duration-300 hover:scale-110 transform">•</span> Top Post
        </h4>
        <div className="flex flex-col gap-3">
          {topPosts?.map((post, idx) => (
            <Link
              to={`/blog/${post.blog_id}`}
              key={post.blog_id}
              className="group flex gap-3 items-center hover:bg-black dark:hover:bg-gray-900 rounded-lg p-2 transition-all duration-300 border border-transparent  dark:hover:border-gray-600 hover:shadow-md dark:hover:shadow-gray-700/50 hover:scale-[1.02] transform"
            >
              <img
                src={post.banner}
                alt={post.title}
                className="w-12 h-12 rounded object-cover transition-all duration-300 group-hover:scale-110 transform"
              />
              <div className="flex-1">
                <div className="font-medium text-sm line-clamp-2 text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">{post.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 line-clamp-1 transition-colors duration-300">{new Date(post.publishedAt).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 