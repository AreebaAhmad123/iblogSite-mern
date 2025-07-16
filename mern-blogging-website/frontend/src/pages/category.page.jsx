import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import BlogCard from "../components/blog-post.component";
import Loader from "../components/loader.component";
import axios from "axios";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CategoryPage = () => {
  const { category } = useParams();
  const query = useQuery();
  const tag = query.get("tag");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let filter = {};
    if (category && tag) {
      filter.tags = [category, tag];
    } else if (category) {
      filter.tag = category;
    } else if (tag) {
      filter.tag = tag;
    }
    
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", filter)
      .then(({ data }) => {
        setBlogs(data.blogs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching category blogs:", err);
        setBlogs([]);
        setLoading(false);
      });
  }, [category, tag]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-[5vw] py-6 border-2 border-red-500">
      <h2 className="text-2xl font-semibold mb-4">
        Category: <span className="text-yellow-500">{category}</span>
        {tag && (
          <span className="ml-4">Tag: <span className="text-yellow-300">{tag}</span></span>
        )}
      </h2>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 m-0 p-0">
          {blogs.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">No blogs found for this category/tag.</div>
          ) : (
            blogs.map(blog => <BlogCard key={blog.blog_id || blog._id} content={blog} author={blog.author?.personal_info} />)
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryPage; 