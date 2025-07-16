import React from "react";
import BlogCard from "./BlogCard";

const PostCard = ({ post, className }) => {
  // Transform post data to match BlogCard format
  const blogData = {
    ...post,
    author: {
      name: post.author?.name,
      fullname: post.author?.name,
      username: post.author?.username,
      avatar: post.author?.avatar,
      profile_img: post.author?.avatar
    },
    des: post.description,
    publishedAt: post.date,
    blog_id: post.blog_id || post._id
  };

  return (
    <BlogCard 
      blog={blogData}
      variant="compact"
      showAuthor={true}
      showStats={false}
      showBookmark={true}
      showLike={false}
      className={className}
    />
  );
};

export default PostCard; 