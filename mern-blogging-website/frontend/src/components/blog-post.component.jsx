import getDay from "../common/date";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import BlogCard from "./BlogCard";

const BlogPostCard = ({ content, author, liked, onLikeToggle }) => {
    // Transform data to match BlogCard format
    const blogData = {
        ...content,
        author: {
            fullname: author.fullname,
            username: author.username,
            profile_img: author.profile_img
        },
        liked: liked
    };

    return (
        <BlogCard 
            blog={blogData}
            variant="default"
            showAuthor={true}
            showStats={true}
            showBookmark={true}
            showLike={true}
            onLikeToggle={onLikeToggle}
        />
    );
};

export default BlogPostCard;