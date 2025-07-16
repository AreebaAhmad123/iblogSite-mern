import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../App";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import axios from "axios";
import AboutUser from "../components/about.component"
import { Link } from "react-router-dom";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component"
import LoadMoreDataBtn from "../components/load-more.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import PageNotFound from "./404.page";
import PostCard from "../components/PostCard";


export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_blogs: 0,
    },
    social_links: {},
    joinedAt: ""
}



const ProfilePage = () => {
    let { username: profileId } = useParams();

    let [profile, setProfile] = useState(profileDataStructure);
    let [loading, setLoading] = useState(true);
    let [blogs, setBlogs] = useState(null);
    let [profileLoaded, setProfileLoaded] = useState("");
    const [error, setError] = useState(null);
    const [bookmarkedBlogs, setBookmarkedBlogs] = useState(null);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    let { personal_info: { fullname, username: profile_username, profile_img, bio }, account_info: { total_posts, total_reads }, social_links, joinedAt } = profile;
    const { userAuth, setUserAuth } = useContext(UserContext);
    const username = userAuth?.username || "";
    const isOwnProfile = userAuth?.username && profile_username && userAuth.username === profile_username;
    
    if (!userAuth) {
        return <Loader />;
    }

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

    const fetchUserProfile = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-profile", {
            username: profileId
        })
            .then(({ data: user }) => {
                if (user) {
                    setProfile(user);
                    setProfileLoaded(profileId);
                    setError(null);
                    // Fetch blogs for all users
                    getBlogs({ user_id: user._id });
                    // Always update userAuth if viewing own profile
                    if (isOwnProfile) {
                        import("../common/auth").then(({ updateUserAuth }) => {
                            updateUserAuth(user, setUserAuth);
                        });
                    }
                } else {
                    setError("User not found");
                }
                setLoading(false);
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    setError("User not found");
                } else {
                    setError("Failed to load profile");
                }
                setLoading(false);
            });
    }

    const getBlogs = async ({ page = 1, user_id }) => {
        user_id = user_id || blogs?.user_id;

        try {
            const { data: { blogs: newBlogs, total } } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", {
                author: user_id,
                page
            });

            const formattedData = await filterPaginationData({
                state: blogs,
                data: newBlogs,
                page,
                countRoute: "/search-blogs-count",
                data_to_send: { author: user_id },
                create_new_arr: page === 1
            });

            if (formattedData) {
                setBlogs(formattedData);
            }
        } catch (err) {
            // console.error("Error fetching blogs:", err);
        }
    };

    // Wrapper function for LoadMoreDataBtn
    const loadMoreBlogs = (user_id, page) => {
        getBlogs({ page, user_id });
    };

    // Function to get bookmarked blogs with pagination
    const getBookmarkedBlogs = async ({ page = 1 }) => {
        
        if (!userAuth?.bookmarked_blogs?.length) {
            setBookmarkedBlogs({
                results: [],
                page: 1,
                totalDocs: 0
            });
            return;
        }

        try {
            
            const { data: { blogs: newBookmarkedBlogs, totalDocs } } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blogs-by-ids",
                { 
                    blog_ids: userAuth.bookmarked_blogs,
                    page,
                    limit: 5
                }
            );
            
            // Custom pagination logic for bookmarked blogs
            if (bookmarkedBlogs !== null && page !== 1) {
                // Append to existing results
                setBookmarkedBlogs({
                    ...bookmarkedBlogs,
                    results: [...bookmarkedBlogs.results, ...newBookmarkedBlogs],
                    page: page,
                    totalDocs: totalDocs
                });
            } else {
                // Create new state
                setBookmarkedBlogs({
                    results: newBookmarkedBlogs || [],
                    page: 1,
                    totalDocs: totalDocs
                });
            }
        } catch (err) {
            // console.error("Error fetching bookmarked blogs:", err);
            setBookmarkedBlogs({
                results: [],
                page: 1,
                totalDocs: 0
            });
        }
    };

    // Wrapper function for LoadMoreDataBtn for bookmarked blogs
    const loadMoreBookmarkedBlogs = ({ page }) => {
        getBookmarkedBlogs({ page });
    };

    useEffect(() => {
        if (profileId !== profileLoaded) {
            setBlogs(null);
        }

        if (blogs === null) {
            resetStates();
            fetchUserProfile();
        }
    }, [profileId, blogs]);

    useEffect(() => {
        
        if (bookmarkedBlogs === null && userAuth && isOwnProfile) {
            setLoadingBookmarks(true);
            getBookmarkedBlogs({ page: 1 }).finally(() => {
                setLoadingBookmarks(false);
            });
        }
    }, [userAuth, bookmarkedBlogs, profileId, isOwnProfile]);

    useEffect(() => {
        // Automatically load bookmarks for non-admin users when profile loads
        if (isOwnProfile && profileLoaded === profileId) {
            getBookmarkedBlogs({ page: 1 });
        }
    }, [isOwnProfile, profileLoaded, profileId]);

    const resetStates = () => {
        setProfile(profileDataStructure);
        setLoading(true);
        setProfileLoaded("");
        setBookmarkedBlogs(null);
    }

    return (
        <AnimationWrapper>
            {
                loading ? <Loader /> :
                    profile && profile.personal_info && profile.personal_info.username && profile.personal_info.username.length ?
                        (
                            <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                                {/* Desktop Sidebar */}
                                <div className="flex flex-col items-center justify-center w-full md:w-[50%] md:pl-8 md:border-l border-grey md:sticky md:top-[100px] md:py-10">
                                    <AboutUser 
                                        personal_info={profile.personal_info}
                                        bio={bio}
                                        social_links={social_links}
                                        joinedAt={joinedAt}
                                    />
                                </div>
                                {/* Main Content Area */}
                                <div className="w-full">
                                    {isOwnProfile ? (
                                        <InPageNavigation
                                            routes={["Bookmarked Blogs"]}
                                            defaultActiveIndex={0}
                                        >
                                            {/* Bookmarked Blogs Tab */}
                                            <div label="Bookmarked Blogs">
                                                {(!bookmarkedBlogs || !Array.isArray(bookmarkedBlogs.results)) ? (
                                                    <Loader />
                                                ) : bookmarkedBlogs.results.length === 0 ? (
                                                    <NoDataMessage message="No Bookmarked Blogs" />
                                                ) : (
                                                    <>
                                                        {bookmarkedBlogs.results.map((blog, i) => (
                                                            <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                                                <BlogPostCard
                                                                    content={blog}
                                                                    author={blog.author.personal_info}
                                                                    liked={userAuth?.liked_blogs?.includes(blog.blog_id)}
                                                                    onLikeToggle={handleLikeToggle}
                                                                />
                                                            </AnimationWrapper>
                                                        ))}
                                                        <div className="flex justify-center mt-4">
                                                            <LoadMoreDataBtn
                                                                state={bookmarkedBlogs}
                                                                fetchDataFun={loadMoreBookmarkedBlogs}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </InPageNavigation>
                                    ) : (
                                        // User viewing someone else's profile
                                        <InPageNavigation
                                            routes={["About"]}
                                            defaultActiveIndex={0}
                                        >
                                            {/* About Tab */}
                                            <div label="About">
                                                {/* ...about content... */}
                                            </div>
                                        </InPageNavigation>
                                    )}
                                </div>
                            </section>
                        )
                    : error ? <PageNotFound /> : <Loader />
            }
        </AnimationWrapper>
    )
}

export default ProfilePage;
