import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";
import { UserContext } from "../App";

const SearchPage = () => {
    let { query } = useParams();
    const { userAuth, setUserAuth } = useContext(UserContext);

    let [blogs, setBlogs] = useState(null);

    const searchBlogs = ({ page = 1, create_new_arr = false }) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", { query, page })
            .then(async ({ data }) => {
                let formattedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { query },
                    create_new_arr
                });
                setBlogs(formattedData);
            })
            .catch((err) => {
                // console.log(err);
            });
    };

    const resetState = () => {
        setBlogs(null);
    };

    useEffect(() => {
        resetState();
        searchBlogs({ page: 1, create_new_arr: true });
    }, [query]);

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



    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                {blogs === null ? (
                    <Loader />
                ) : (
                    <>
                        {blogs.results.length ? (
                            <>
                                {blogs.results.map((blog, i) => (
                                    <AnimationWrapper
                                        key={i}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                    >
                                        <BlogPostCard
                                            content={blog}
                                            author={blog.author.personal_info}
                                            liked={userAuth?.liked_blogs?.includes(blog.blog_id)}
                                            onLikeToggle={handleLikeToggle}
                                        />
                                    </AnimationWrapper>
                                ))}
                                <LoadMoreDataBtn state={blogs} fetchDataFun={searchBlogs} />
                            </>
                        ) : (
                            <NoDataMessage message="No blogs published" />
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default SearchPage;