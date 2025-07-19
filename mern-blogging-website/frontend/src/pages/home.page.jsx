import AnimationWrapper from "../common/page-animation";
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component"
import LoadMoreDataBtn from "../components/load-more.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import { blogAPI, userAPI } from "../services/api";
import { UserContext, FooterContext } from "../App";
import CategorySlider from "../components/category-slider.component";
import TrendingBlogPost from "../components/TrendingBlogPost";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import getDay, { getFullDay } from "../common/date";
import PostCard from "../components/PostCard.jsx";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  fadeInUp, 
  staggerContainer, 
  staggerItem, 
  cardHover,
  textReveal,
  useScrollAnimation
} from "../common/animations";
import AnimatedNavButton from "../components/animated-nav-button.component.jsx";
import SmoothLoader from "../components/smooth-loader.component.jsx";
import SkeletonLoader from "../components/skeleton-loader.component.jsx";
import AdBanner from "../components/AdBanner";

const HomePage = () => {
    let [blogs, setBlog] = useState(null);
    let [trendingblogs, setTrendingBlog] = useState(null);
    let [pageState, setPageState] = useState("home");
    const { userAuth, setUserAuth } = useContext(UserContext);
    const { setBlogImages, setCategories } = useContext(FooterContext);
    const liked_blogs = userAuth?.liked_blogs || [];
    const bookmarked_blogs = userAuth?.bookmarked_blogs || [];
    const [bookmarking, setBookmarking] = useState(false);

    // Pagination state for each section
    const [popularPage, setPopularPage] = useState(1);
    const [newPage, setNewPage] = useState(1);
    const [trendyPage, setTrendyPage] = useState(1);
    const [topPage, setTopPage] = useState(1);
    const [popularBlogs, setPopularBlogs] = useState([]);
    const [newBlogs, setNewBlogs] = useState([]);
    const [trendyBlogs, setTrendyBlogs] = useState([]);
    const [topBlogs, setTopBlogs] = useState([]);
    
    // Loading states for slider transitions
    const [popularLoading, setPopularLoading] = useState(false);
    const [newLoading, setNewLoading] = useState(false);
    const [trendyLoading, setTrendyLoading] = useState(false);
    const [topLoading, setTopLoading] = useState(false);

    // Store all fetched blogs to avoid re-fetching
    const [allPopularBlogs, setAllPopularBlogs] = useState([]);
    const [allNewBlogs, setAllNewBlogs] = useState([]);
    const [allTrendyBlogs, setAllTrendyBlogs] = useState([]);
    const [allTopBlogs, setAllTopBlogs] = useState([]);

    const baseCategories = ["islam", "prophets", "religion", "basics", "sahaba", "anbiya"];
    
    // Memoize categories calculation to prevent infinite re-renders
    const categories = useMemo(() => {
        const tagCategories = (blogs?.results || []).flatMap(blog => blog.tags || []);
        return Array.from(new Set([...baseCategories, ...tagCategories]));
    }, [blogs?.results]);

    // Update categories and blog images for footer
    useEffect(() => {
        if (setCategories) {
            setCategories(categories);
        }
        
        // Collect blog images for footer
        const allBlogs = [
            ...(blogs?.results || []),
            ...(trendingblogs || []),
            ...popularBlogs,
            ...newBlogs,
            ...trendyBlogs,
            ...topBlogs
        ];
        // Store blog objects (with banner and blog_id) for Instagram section
        const blogObjs = allBlogs
            .filter(blog => blog.banner && blog.blog_id)
            .slice(0, 12);
        if (setBlogImages) {
            setBlogImages(blogObjs);
        }
    }, [blogs, trendingblogs, popularBlogs, newBlogs, trendyBlogs, topBlogs, setCategories, setBlogImages]);

    let [mostViewedBlogs, setMostViewedBlogs] = useState([]);
    let [mostViewedPage, setMostViewedPage] = useState(1);
    let [mostViewedLoading, setMostViewedLoading] = useState(false);
    const MOST_VIEWED_LIMIT = 6;

    const fetchLatestBlogs = async (page = 1) => {
        try {
            const data = await blogAPI.getBlogs(page, 10);
            const formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/all-latest-blogs-count",
                create_new_arr: page === 1,
            });

            if (formattedData) {
                setBlog(formattedData);
            }
        } catch (err) {
            // Set a default state to prevent infinite loading
            setBlog(prev => prev || { results: [], page: 1, totalDocs: 0 });
        }
    }

    const fetchBlogsByCategory = async (page = 1) => {
        try {
            const { data } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", {
                tag: pageState,
                page,
            }, {
                timeout: 10000 // 10 second timeout
            });

            const formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/search-blogs-count",
                create_new_arr: page === 1,
                data_to_send: { tag: pageState },
            });

            if (formattedData) {
                setBlog(formattedData);
            }
        } catch (err) {
            // Set a default state to prevent infinite loading
            setBlog(prev => prev || { results: [], page: 1, totalDocs: 0 });
        }
    };

    const fetchTrendingBlogs = async () => {
        try {
            const data = await blogAPI.getTrendingBlogs(10);
            if (data.blogs && Array.isArray(data.blogs)) {
                setTrendingBlog(data.blogs);
            } else {
                setTrendingBlog([]);
            }
        } catch (err) {
            setTrendingBlog([]); // Set empty array instead of null
        }
    };

    const navigate = useNavigate();
    const handleCategorySelect = (category) => {
        navigate(`/categories/${encodeURIComponent(category)}`);
    };

    // Fetch most viewed blogs (for New Posts section)
    const fetchMostViewedBlogs = async (page = 1) => {
        setMostViewedLoading(true);
        try {
            // If backend supports pagination, use it. Otherwise, fetch all and paginate client-side.
            const data = await blogAPI.getTrendingBlogs();
            if (page === 1) {
                setMostViewedBlogs(data.blogs.slice(0, MOST_VIEWED_LIMIT));
            } else {
                setMostViewedBlogs(prev => [
                    ...prev,
                    ...data.blogs.slice((page - 1) * MOST_VIEWED_LIMIT, page * MOST_VIEWED_LIMIT)
                ]);
            }
        } catch (err) {
            setMostViewedBlogs([]);
        } finally {
            setMostViewedLoading(false);
        }
    };

    // Fetch blogs for Popular section with pagination
    const fetchPopularBlogs = async (page = 1) => {
        setPopularLoading(true);
        try {
            const { data } = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + `/api/popular-blogs?page=${page}&limit=30`);
            
            if (!data.blogs || !Array.isArray(data.blogs)) {
                setPopularBlogs([]);
                return;
            }
            
            setPopularBlogs(data.blogs);
        } catch (err) {
            setPopularBlogs([]);
        } finally {
            setPopularLoading(false);
        }
    };

    // Fetch blogs for New section with pagination
    const fetchNewBlogs = async (page = 1) => {
        setNewLoading(true);
        try {
            const { data } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/latest-blogs", { page });
            
            if (!data.blogs || !Array.isArray(data.blogs)) {
                setNewBlogs([]);
                return;
            }
            
            // Format the date for each blog before setting the state
            const formattedBlogs = data.blogs.map(blog => ({
                ...blog,
                date: getDay(blog.publishedAt) // Ensure date is formatted
            }));
            
            setNewBlogs(formattedBlogs);
        } catch (err) {
            setNewBlogs([]); // Set empty array on error
        } finally {
            setNewLoading(false);
        }
    };

    // Fetch blogs for Trendy section with pagination
    const fetchTrendyBlogs = async (page = 1) => {
        setTrendyLoading(true);
        try {
            const { data } = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + `/api/trending-blogs?page=${page}&limit=30`);
            
            if (!data.blogs || !Array.isArray(data.blogs)) {
                setTrendyBlogs([]);
                return;
            }
            
            setTrendyBlogs(data.blogs);
        } catch (err) {
            setTrendyBlogs([]); // Set empty array on error
        } finally {
            setTrendyLoading(false);
        }
    };

    // Fetch blogs for Top section with pagination
    const fetchTopBlogs = async (page = 1) => {
        setTopLoading(true);
        try {
            const { data } = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + `/api/top-blogs?page=${page}&limit=30`);
            
            if (!data.blogs || !Array.isArray(data.blogs)) {
                setTopBlogs([]);
                return;
            }
            
            setTopBlogs(data.blogs);
        } catch (err) {
            setTopBlogs([]);
        } finally {
            setTopLoading(false);
        }
    };

    const [maxPopularPage, setMaxPopularPage] = useState(1);
    const [maxTopPage, setMaxTopPage] = useState(1);
    const [maxTrendyPage, setMaxTrendyPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            try {
                
                setBlog(null); // Reset to trigger loader
                
                if (pageState == "home") {
                    await fetchLatestBlogs(1);
                } else {
                    await fetchBlogsByCategory(1);
                }
                
                if (!trendingblogs) {
                    fetchTrendingBlogs();
                }
                
                if (mostViewedBlogs.length === 0) {
                    fetchMostViewedBlogs(1);
                }
                
                // Always fetch section blogs on mount
                fetchPopularBlogs(1);
                fetchNewBlogs(1);
                fetchTrendyBlogs(1);
                fetchTopBlogs(1);
                
            } catch (error) {
                // Set default states to prevent infinite loading
                setBlog({ results: [], page: 1, totalDocs: 0 });
                setTrendingBlog([]);
            }
        };

        loadData();
    }, [pageState]); // Removed liked_blogs from dependencies to prevent unnecessary re-fetches

    const handleShowMoreMostViewed = () => {
        const nextPage = mostViewedPage + 1;
        setMostViewedPage(nextPage);
        fetchMostViewedBlogs(nextPage);
    };

    // Arrow navigation handlers
    const handlePopularNext = () => {
        if (popularPage < popularBlogs.length - 3) {
            const nextPage = popularPage + 1;
            setPopularPage(nextPage);
        }
    };

    const handlePopularPrev = () => {
        if (popularPage > 1) {
            const prevPage = popularPage - 1;
            setPopularPage(prevPage);
        }
    };

    const handleNewNext = () => {
        const nextPage = newPage + 1;
        setNewPage(nextPage);
        fetchNewBlogs(nextPage);
    };

    const handleNewPrev = () => {
        if (newPage > 1) {
            const prevPage = newPage - 1;
            setNewPage(prevPage);
            fetchNewBlogs(prevPage);
        }
    };

    const handleTrendyNext = () => {
        if (trendyPage < trendyBlogs.length - 3) {
            const nextPage = trendyPage + 1;
            setTrendyPage(nextPage);
        }
    };

    const handleTrendyPrev = () => {
        if (trendyPage > 1) {
            const prevPage = trendyPage - 1;
            setTrendyPage(prevPage);
        }
    };

    const handleTopNext = () => {
        if (topPage < topBlogs.length - 3) {
            const nextPage = topPage + 1;
            setTopPage(nextPage);
        }
    };

    const handleTopPrev = () => {
        if (topPage > 1) {
            const prevPage = topPage - 1;
            setTopPage(prevPage);
        }
    };

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase();

        setBlog(null);

        if (pageState == category) {
            setPageState("home");
            return;
        }

        setPageState(category);
    }

    const handleLikeToggle = (liked, blog_id) => {
        // This function is called when a blog is liked/unliked
        // 'liked' is a boolean indicating the new like status
        // 'blog_id' is the ID of the blog being liked/unliked
        setUserAuth((prev) => {
            if (!prev) return prev;
            
            let liked_blogs = prev.liked_blogs || [];
            
            if (liked) {
                // Add blog to liked_blogs if not already present
                if (!liked_blogs.includes(blog_id)) {
                    liked_blogs = [...liked_blogs, blog_id];
                }
            } else {
                // Remove blog from liked_blogs
                liked_blogs = liked_blogs.filter(id => id !== blog_id);
            }
            
            return { ...prev, liked_blogs };
        });
    };

    // Handle bookmark/unbookmark with debouncing
    const handleBookmark = async (blog_id) => {
        if (!userAuth?.access_token || bookmarking) return;
        
        const isBookmarked = userAuth?.bookmarked_blogs?.includes(blog_id);
        setBookmarking(true);
        
        try {
            await blogAPI.toggleBookmark(blog_id, isBookmarked);
            // Fetch latest user profile and update userAuth
            const user = await userAPI.getProfile(userAuth.username);
            setUserAuth(user);
        } catch (err) {
            // console.error("Bookmark error:", err); // Removed sensitive error logging
        } finally {
            // Add a small delay to prevent rapid clicks
            setTimeout(() => {
                setBookmarking(false);
            }, 300);
        }
    };

    const loadMore = pageState === "home" ? fetchLatestBlogs : fetchBlogsByCategory;

    const [popularStartIndex, setPopularStartIndex] = useState(0);
    const visiblePopularBlogs = popularBlogs.slice(popularStartIndex, popularStartIndex + 4);

    const [trendyStartIndex, setTrendyStartIndex] = useState(0);
    const visibleTrendyBlogs = trendyBlogs.slice(trendyStartIndex, trendyStartIndex + 4);
    const [topStartIndex, setTopStartIndex] = useState(0);
    const visibleTopBlogs = topBlogs.slice(topStartIndex, topStartIndex + 4);

    return (
        <AnimationWrapper>
            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.6 }}
            >
                <CategorySlider categories={categories} onCategorySelect={handleCategorySelect} />
            </motion.div>
            <motion.section 
                className="h-cover flex flex-col gap-10 px-[5vw] home-page-content"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {/* Trending Blogs */}
                <motion.div className="w-full" variants={staggerItem}>
                    <motion.div 
                        className="flex items-center justify-between mb-8"
                        variants={textReveal}
                    >
                        
                    </motion.div>
                    {
                        trendingblogs == null ? (
                            <div className="flex justify-center items-center h-64">
                                <SmoothLoader 
                                    type="pulse" 
                                    size="xlarge" 
                                    color="primary"
                                    text="Loading trending stories..."
                                />
                            </div>
                        ) : (
                            trendingblogs.length > 0 &&
                            <motion.div 
                                className="grid grid-cols-1 lg:grid-cols-4 gap-4"
                                variants={staggerContainer}
                            >
                                {
                                    trendingblogs.slice(0, 2).map((blog, i) => (
                                        <motion.div 
                                            key={i} 
                                            className="h-[340px]"
                                            variants={staggerItem}
                                            custom={i}
                                        >
                                            <TrendingBlogPost blog={blog} variant="compact" showAuthor={true} showBookmark={true} className="h-full" />
                                        </motion.div>
                                    ))
                                }
                                <motion.div 
                                    className="h-[340px] lg:col-span-2"
                                    variants={staggerItem}
                                    custom={2}
                                >
                                    <Swiper
                                        modules={[Navigation, Pagination, Autoplay]}
                                        spaceBetween={50}
                                        slidesPerView={1}
                                        navigation
                                        pagination={{ clickable: true }}
                                        autoplay={{
                                            delay: 3000,
                                            disableOnInteraction: false,
                                        }}
                                        loop={true}
                                        className="h-full"
                                    >
                                        {
                                            trendingblogs.slice(2).map((blog, i) => (
                                                <SwiperSlide key={i}>
                                                    <TrendingBlogPost blog={blog} variant="compact" showAuthor={true} showBookmark={true} className="h-full" />
                                                </SwiperSlide>
                                            ))
                                        }
                                    </Swiper>
                                </motion.div>
                            </motion.div>
                        )
                    }
                </motion.div>

                {/* Ad Banner above Popular Posts */}
                <AdBanner />
                {/* Popular Posts */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-medium text-2xl">Popular Posts</h1>
                        {!popularLoading && popularBlogs.length > 0 && (
                            <div className="text-sm text-gray-500">
                                {popularStartIndex + 1} - {Math.min(popularStartIndex + 4, popularBlogs.length)} of {popularBlogs.length}
                            </div>
                        )}
                    </div>
                    {popularLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <SmoothLoader 
                                type="dots" 
                                size="large" 
                                color="secondary"
                                text="Loading popular posts..."
                            />
                        </div>
                    ) : (
                    <div className="relative overflow-hidden">
                        {/* Left Button */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="left"
                                onClick={() => setPopularStartIndex(popularStartIndex - 1)}
                                disabled={popularStartIndex === 0}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        {/* Right Button */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="right"
                                onClick={() => setPopularStartIndex(popularStartIndex + 1)}
                                disabled={popularStartIndex + 4 >= popularBlogs.length}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        <div className="flex transition-transform duration-500 ease-in-out">
                            {visiblePopularBlogs.map((blog, i) => (
                                <div
                                    key={blog.blog_id || blog._id || i}
                                    className="w-1/4 flex-shrink-0 px-2"
                                >
                                    <AnimationWrapper>
                                        <PostCard post={{
                                            banner: blog.banner,
                                            title: blog.title,
                                            description: blog.des || blog.description,
                                            author: {
                                                name: blog.author?.personal_info?.fullname,
                                                avatar: blog.author?.personal_info?.profile_img
                                            },
                                            date: blog.publishedAt || blog.createdAt,
                                            blog_id: blog.blog_id || blog._id
                                        }} />
                                    </AnimationWrapper>
                                </div>
                            ))}
                        </div>
                        {/* Dot Indicators */}
                        {popularBlogs.length > 4 && (
                            <motion.div 
                                className="flex justify-center mt-4 space-x-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {Array.from({ length: Math.max(1, popularBlogs.length - 3) }, (_, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => setPopularStartIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            popularStartIndex === index 
                                                ? 'bg-yellow-500' 
                                                : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        animate={{
                                            scale: popularStartIndex === index ? 1.3 : 1,
                                            backgroundColor: popularStartIndex === index ? '#f59e0b' : '#d1d5db'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>
                    )}
                </div>

                {/* New Posts (Most Viewed) Section */}
                <div className="w-full mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-medium text-2xl">New Posts</h1>
                        <div className="flex space-x-2">
                            <AnimatedNavButton
                                direction="left"
                                onClick={handleNewPrev}
                                disabled={newPage === 1 || newLoading}
                                size="medium"
                                variant="primary"
                            />
                            <AnimatedNavButton
                                direction="right"
                                onClick={handleNewNext}
                                disabled={newLoading}
                                size="medium"
                                variant="primary"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newLoading ? (
                            <div className="col-span-full flex justify-center py-8">
                                <SmoothLoader 
                                    type="wave" 
                                    size="medium" 
                                    color="primary"
                                    text="Loading new posts..."
                                />
                            </div>
                        ) : newBlogs.length === 0 ? (
                            <SkeletonLoader type="list" count={6} className="col-span-full" />
                        ) : newBlogs.length ? (
                            newBlogs.slice(0, 6).map((blog, i) => (
                                <Link key={blog.blog_id || blog._id || i} to={`/blog/${blog.blog_id || blog._id}`} className="block">
                                    <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow p-4 gap-4 items-center hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                                        <img src={blog.banner || "/src/imgs/default.jpg"} alt={blog.title} className="w-full sm:w-32 h-40 sm:h-32 object-cover rounded-lg" />
                                        <div className="flex-1 flex flex-col justify-between h-full">
                                            <div>
                                                <h2 className="font-semibold text-lg line-clamp-2">{blog.title}</h2>
                                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{blog.des || blog.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 bg-gray-100 rounded-lg px-3 ">
                                                <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                                                    <img src={blog.author?.personal_info?.profile_img || "/src/imgs/default.jpg"} alt={blog.author?.personal_info?.fullname} className="w-8 h-8 rounded-full object-cover" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{blog.author?.personal_info?.fullname}</span>
                                                        <span className="text-xs text-gray-500 mt-0.5">{blog.publishedAt ? getFullDay(blog.publishedAt) : ""}</span>
                                                    </div>
                                                </div>
                                                <button className="ml-3" onClick={e => { e.preventDefault(); e.stopPropagation(); handleBookmark(blog.blog_id || blog._id); }} disabled={bookmarking}>
                                                    {userAuth?.bookmarked_blogs?.includes(blog.blog_id || blog._id) ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-black dark:hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <NoDataMessage message="No Most Viewed Blogs" />
                        )}
                    </div>
                </div>

                {/* Trendy Posts Section */}
                <div className="w-full mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-medium text-2xl">Trendy Posts</h1>
                        {!trendyLoading && trendyBlogs.length > 0 && (
                            <div className="text-sm text-gray-500">
                                {trendyStartIndex + 1} - {Math.min(trendyStartIndex + 4, trendyBlogs.length)} of {trendyBlogs.length}
                            </div>
                        )}
                    </div>
                    {trendyLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <SmoothLoader 
                                type="ring" 
                                size="large" 
                                color="secondary"
                                text="Loading trendy posts..."
                            />
                        </div>
                    ) : (
                    <div className="relative overflow-hidden">
                        {/* Left Button */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="left"
                                onClick={() => setTrendyStartIndex(trendyStartIndex - 1)}
                                disabled={trendyStartIndex === 0}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        {/* Right Button */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="right"
                                onClick={() => setTrendyStartIndex(trendyStartIndex + 1)}
                                disabled={trendyStartIndex + 4 >= trendyBlogs.length}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        <div className="flex transition-transform duration-500 ease-in-out">
                            {visibleTrendyBlogs.map((blog, i) => (
                                <div
                                    key={blog.blog_id || blog._id || i}
                                    className="w-1/4 flex-shrink-0 px-2"
                                >
                                    <AnimationWrapper>
                                        <PostCard post={{
                                            banner: blog.banner,
                                            title: blog.title,
                                            description: blog.des || blog.description,
                                            author: {
                                                name: blog.author?.personal_info?.fullname,
                                                avatar: blog.author?.personal_info?.profile_img
                                            },
                                            date: blog.publishedAt || blog.createdAt,
                                            blog_id: blog.blog_id || blog._id
                                        }} />
                                    </AnimationWrapper>
                                </div>
                            ))}
                        </div>
                        {/* Dot Indicators */}
                        {trendyBlogs.length > 4 && (
                            <motion.div 
                                className="flex justify-center mt-4 space-x-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {Array.from({ length: Math.max(1, trendyBlogs.length - 3) }, (_, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => setTrendyStartIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            trendyStartIndex === index 
                                                ? 'bg-yellow-500' 
                                                : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        animate={{
                                            scale: trendyStartIndex === index ? 1.3 : 1,
                                            backgroundColor: trendyStartIndex === index ? '#f59e0b' : '#d1d5db'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>
                    )}
                </div>

                {/* Top Posts Section */}
                <div className="w-full mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-medium text-2xl mb-8">Top Posts</h1>
                        {!topLoading && topBlogs.length > 0 && (
                            <div className="text-sm text-gray-500">
                                {topStartIndex + 1} - {Math.min(topStartIndex + 4, topBlogs.length)} of {topBlogs.length}
                            </div>
                        )}
                    </div>
                    {topLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <SmoothLoader 
                                type="bars" 
                                size="large" 
                                color="secondary"
                                text="Loading top posts..."
                            />
                        </div>
                    ) : (
                    <div className="relative overflow-hidden">
                        {/* Left Button */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="left"
                                onClick={() => setTopStartIndex(topStartIndex - 1)}
                                disabled={topStartIndex === 0}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        {/* Right Button */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50">
                            <AnimatedNavButton
                                direction="right"
                                onClick={() => setTopStartIndex(topStartIndex + 1)}
                                disabled={topStartIndex + 4 >= topBlogs.length}
                                size="large"
                                variant="primary"
                            />
                        </div>
                        <div className="flex transition-transform duration-500 ease-in-out">
                            {visibleTopBlogs.map((blog, i) => (
                                <div
                                    key={blog.blog_id || blog._id || i}
                                    className="w-1/4 flex-shrink-0 px-2"
                                >
                                    <AnimationWrapper>
                                        <PostCard post={{
                                            banner: blog.banner,
                                            title: blog.title,
                                            description: blog.des || blog.description,
                                            author: {
                                                name: blog.author?.personal_info?.fullname,
                                                avatar: blog.author?.personal_info?.profile_img
                                            },
                                            date: blog.publishedAt || blog.createdAt,
                                            blog_id: blog.blog_id || blog._id
                                        }} />
                                    </AnimationWrapper>
                                </div>
                            ))}
                        </div>
                        {/* Dot Indicators */}
                        {topBlogs.length > 4 && (
                            <motion.div 
                                className="flex justify-center mt-4 space-x-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {Array.from({ length: Math.max(1, topBlogs.length - 3) }, (_, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => setTopStartIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            topStartIndex === index 
                                                ? 'bg-yellow-500' 
                                                : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        animate={{
                                            scale: topStartIndex === index ? 1.3 : 1,
                                            backgroundColor: topStartIndex === index ? '#f59e0b' : '#d1d5db'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>
                    )}
                </div>
            </motion.section>
        </AnimationWrapper>
    );
};

export default HomePage;
