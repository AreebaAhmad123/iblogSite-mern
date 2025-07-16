import React, { useState, useEffect } from 'react'
import { useAuth } from '../common/session'
import ManageBlogCard from '../components/manage-blogcard.component'
import Loader from '../components/loader.component'
import LoadMoreDataBtn from '../components/load-more.component'
import { filterPaginationData } from '../common/filter-pagination-data'

const Dashboard = () => {
    // Paginated blogs state
    const [blogs, setBlogs] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { user } = useAuth()

    useEffect(() => {
        if (user?.token) {
            fetchUserBlogs({ page: 1, create_new_arr: true })
        }
    }, [user])

    // Fetch blogs for a given page, append if not first page
    const fetchUserBlogs = async ({ page = 1, create_new_arr = false }) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(import.meta.env.VITE_SERVER_DOMAIN + '/api/user-written-blogs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page,
                    draft: false,
                    query: ""
                })
            })
            if (response.ok) {
                const data = await response.json()
                const formattedData = await filterPaginationData({
                    create_new_arr,
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: '/user-written-blogs-count',
                    data_to_send: { draft: false, query: "" }
                })
                setBlogs(formattedData)
            } else {
                setError('Failed to load your stories')
            }
        } catch (error) {
            console.error('Error fetching blogs:', error)
            setError('Failed to load your stories')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (blogId) => {
        try {
            const response = await fetch(import.meta.env.VITE_SERVER_DOMAIN + '/api/delete-blog', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blogId: blogId
                })
            })
            if (response.ok) {
                setBlogs(prev => ({
                    ...prev,
                    results: prev.results.filter(blog => blog.blog_id !== blogId),
                    totalDocs: prev.totalDocs - 1
                }))
            }
        } catch (error) {
            console.error('Error deleting blog:', error)
        }
    }

    const handleEdit = (blogId) => {
        window.location.href = `/editor/${blogId}`
    }

    const stats = {
        totalStories: blogs?.results?.length || 0,
        totalViews: blogs?.results?.reduce((sum, blog) => sum + (blog.activity?.total_reads || 0), 0),
        totalLikes: blogs?.results?.reduce((sum, blog) => sum + (blog.activity?.total_likes || 0), 0),
        totalComments: blogs?.results?.reduce((sum, blog) => sum + (blog.activity?.total_comments || 0), 0)
    }

    if (loading && (!blogs || blogs.results?.length === 0)) return <Loader />

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-2">{error}</p>
                        <button 
                            onClick={() => fetchUserBlogs({ page: 1, create_new_arr: true })}
                            className="text-yellow-300 hover:text-yellow-500"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Manage your Islamic stories and track their performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <span className="text-2xl">📖</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Stories</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalStories}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <span className="text-2xl">👁️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Views</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <span className="text-2xl">❤️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Likes</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalLikes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Comments</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalComments}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stories Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Your Stories</h2>
                        <a 
                            href="/editor"
                            className="px-4 py-2 bg-yellow-300 text-white rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                            Write New Story
                        </a>
                    </div>

                    {!blogs || blogs.results.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">You haven't published any stories yet</p>
                            <a 
                                href="/editor"
                                className="px-6 py-3 bg-yellow-300 text-white rounded-lg hover:bg-yellow-400 transition-colors"
                            >
                                Write Your First Story
                            </a>
                        </div>
                    ) : (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {blogs.results.map(blog => (
                                <ManageBlogCard 
                                    key={blog.blog_id}
                                    blog={blog}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                        <div className="flex justify-center mt-6">
                            <LoadMoreDataBtn 
                                state={blogs}
                                fetchDataFun={fetchUserBlogs}
                                additionalParam={{ page: blogs.page + 1, create_new_arr: false }}
                            />
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
