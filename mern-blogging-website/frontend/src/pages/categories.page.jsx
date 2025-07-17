import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FooterContext } from "../App";
import Loader from "../components/loader.component";
import PostCard from "../components/PostCard";
import LoadMoreDataBtn from "../components/load-more.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import axios from "axios";
import CategoryCard from "../components/category-card.component";

const CategoriesPage = () => {
  const { categories, setCategories } = useContext(FooterContext);
  const { categoryName } = useParams(); // expects route: /categories/:categoryName
  const [blogs, setBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBlogs = async (page = 1) => {
    try {
      let response;
      if (categoryName) {
        // Use search-blogs endpoint for category filtering
        response = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", {
          tag: categoryName,
          page
        });
      } else {
        // Use latest-blogs endpoint for all blogs
        response = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/latest-blogs", { page });
      }

      const { data } = response;
      if (data.blogs && Array.isArray(data.blogs)) {
        const formattedData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: categoryName ? "/search-blogs-count" : "/all-latest-blogs-count",
          create_new_arr: page === 1,
          data_to_send: categoryName ? { tag: categoryName } : {}
        });

        if (formattedData) {
          setBlogs(formattedData);
        }

        // Set categories if not already set
        if (categories.length === 0 && setCategories && page === 1) {
          const baseCategories = [
            "islam",
            "prophets",
            "religion",
            "basics",
            "sahaba",
            "anbiya",
          ];
          const tagCategories = data.blogs.flatMap((blog) => blog.tags || []);
          const allCategories = Array.from(
            new Set([...baseCategories, ...tagCategories])
          );
          setCategories(allCategories);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs(prev => prev || { results: [], page: 1, totalDocs: 0 });
      setLoading(false);
    }
  };

  useEffect(() => {
    setBlogs(null);
    setLoading(true);
    fetchBlogs(1);
  }, [categoryName]);

  if (loading) return <Loader />;

  return (
    <div className="max-w-screen-2xl w-full mx-auto px-4 py-8 categories-page-content">
     
      {/* Blogs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {blogs && blogs.results && blogs.results.length > 0 ? (
          blogs.results.map((blog) => (
            <PostCard
              key={blog._id || blog.blog_id}
              post={{
                banner: blog.banner,
                title: blog.title,
                description: blog.des || blog.description,
                author: {
                  avatar: blog.author?.personal_info?.profile_img,
                  name: blog.author?.personal_info?.fullname,
                },
                date: blog.publishedAt || blog.date,
                blog_id: blog.blog_id || blog._id,
              }}
              className="h-full"
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No blogs found{categoryName ? ` for '${categoryName}'` : ""}.
          </div>
        )}
      </div>
      {blogs && (
        <div className="flex justify-center mt-8">
          <LoadMoreDataBtn 
            state={blogs} 
            fetchDataFun={fetchBlogs}
          />
        </div>
      )}
    </div>
  );
};

export default CategoriesPage; 