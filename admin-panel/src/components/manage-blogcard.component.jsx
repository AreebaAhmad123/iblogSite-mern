import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import getDay from '../common/date'
import { UserContext } from '../App'
import axios from 'axios'
import { toast } from 'react-hot-toast';

const BlogStats = ({ stats }) => {
    // Ensure the keys exist and fallback to 0 if not
    const likes = stats?.total_likes ?? 0;
    const views = stats?.total_reads ?? 0;
    const comments = stats?.total_comments ?? 0;
    return (
        <div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b">
            <div className="flex flex-col items-center w-full h-full justify-center p-4 px-6">
                <h1 className="text-xl lg:text-2xl mb-2">{likes.toLocaleString()}</h1>
                <p className="max-lg:text-dark-grey capitalize">Likes</p>
            </div>
            <div className="flex flex-col items-center w-full h-full justify-center p-4 px-6 border-grey border-l">
                <h1 className="text-xl lg:text-2xl mb-2">{views.toLocaleString()}</h1>
                <p className="max-lg:text-dark-grey capitalize">Views</p>
            </div>
            <div className="flex flex-col items-center w-full h-full justify-center p-4 px-6 border-grey border-l">
                <h1 className="text-xl lg:text-2xl mb-2">{comments.toLocaleString()}</h1>
                <p className="max-lg:text-dark-grey capitalize">Comments</p>
            </div>
        </div>
    );
};

export const ManagePublishedBlogCard = ({ blog }) => {
    let { banner, blog_id, title, publishedAt, activity } = blog;
    let { userAuth: { access_token } } = useContext(UserContext)

    let [showStat, setShowStat] = useState(false);

    return (
        <>
            <div className="flex gap-10 border-b border-grey pb-6 items-center max-md:px-4">
                <img src={banner} className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover" />
                <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
                    <div>
                        <Link to={`/blog/${blog_id}`} className="blog-title mb-4 hover:underline">{title}</Link>
                        <p className="line-clamp-1">Published on {getDay(publishedAt)}</p>
                    </div>
                    <div className="flex gap-6 mt-3">
                        <Link to={`/admin/editor/${blog.blog_id || blog._id}`} className="pr-4 py-2 underline">Edit</Link>
                        <button className="pr-4 py-2 underline" onClick={() => setShowStat(prevVal => !prevVal)}>
                            Stats
                        </button>
                        <button className="pr-4 py-2 underline text-red-500 hover:text-red-700 font-medium" style={{color: '#ef4444'}} onClick={(e) => {
                            if (window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
                                deleteBlog(blog, access_token, e.target);
                            }
                        }}>Delete</button>
                    </div>
                </div>
            </div>

            {
                showStat ? <div><BlogStats stats={activity} /></div> : ""
            }

        </>
    );
};

export const ManageDraftBlogPost = ({ blog }) => {
    let { title, des, blog_id, index } = blog;
    let { userAuth: { access_token } } = useContext(UserContext)
    index++;

    return (
        <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey">
            <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">
                {typeof index === "number" && !isNaN(index) ? (index < 10 ? "0" + index : index) : ""}
            </h1>
            <div>
                <h1 className="blog-title mb-3">{title}</h1>
                <p className="line-clamp-2 font-gelasio">{des.length ? des : "No Description"}</p>

                <div className="flex gap-6 mt-3">
                    <Link to={`/admin/editor/${blog.blog_id || blog.id || blog_id}`} className="pr-4 py-2 underline">Edit</Link>
                    <button className="pr-4 py-2 underline text-red-500 hover:text-red-700 font-medium" style={{color: '#ef4444'}} onClick={(e) => {
                        if (window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
                            deleteBlog(blog, access_token, e.target);
                        }
                    }}>Delete</button>
                </div>
            </div>
        </div>
    );
};

const deleteBlog = (blog, access_token, target) => {
    let { index, blogId, setStateFunc } = blog;
    // Use blog_id if available, otherwise fall back to blogId or id
    const blogIdToDelete = blog.blog_id || blog.blogId || blog.id || blogId;
    
    target.setAttribute("disabled", true);

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/delete-blog", { blogId: blogIdToDelete }, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
        .then(({ data }) => {
            target.removeAttribute("disabled");
            setStateFunc(prevVal => {
                if (!Array.isArray(prevVal)) return prevVal;
                // Remove the blog at the given index
                const newArr = prevVal.slice();
                newArr.splice(index, 1);
                return newArr;
            });
            toast.success("Blog deleted successfully!");
        })
        .catch(err => {
            target.removeAttribute("disabled");
            // User-facing error message
            toast.error("Failed to delete blog. Please try again.");
            console.log(err);
        })
} 