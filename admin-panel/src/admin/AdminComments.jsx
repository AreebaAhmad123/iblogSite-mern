import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../App";
import CommentsContainer from "../components/comments.component";
import Loader from "../components/loader.component";
import { BlogContext } from "../pages/blog.page";
import InPageNavigation from "../components/inpage-navigation.component";
// Add Recharts imports
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie, AreaChart, Area, ComposedChart } from 'recharts';

const blogStructure = {
  title: "",
  des: "",
  content: [],
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
  comments: { results: [] },
  activity: { total_parent_comments: 0 }
};

const barColors = [
  '#42a5f5', // Blue
  '#66bb6a', // Green
  '#ffa726', // Orange
  '#ab47bc', // Purple
  '#ef5350', // Red
  '#26c6da', // Cyan
  '#ffca28', // Yellow
  '#8d6e63', // Brown
];

const pieColors = [
  '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350', '#26c6da', '#ffca28', '#8d6e63', '#f06292', '#ba68c8', '#ffd600', '#00bfae', '#ff7043', '#8bc34a', '#bdbdbd', '#5c6bc0', '#00acc1', '#d4e157', '#ff8a65', '#a1887f'
];

const AdminComments = () => {
  const { userAuth } = useContext(UserContext);
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [blog, setBlog] = useState(blogStructure);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(true);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
  const [spamComments, setSpamComments] = useState([]);
  const [loadingSpam, setLoadingSpam] = useState(false);
  const [commentAnalytics, setCommentAnalytics] = useState({
    totalComments: 0,
    totalBlogs: 0,
    avgCommentsPerBlog: 0,
    recentActivity: []
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch all blogs for selection
  useEffect(() => {
    setLoadingBlogs(true);
    console.log('AdminComments: Fetching all blogs for admin');
    axios.post(
      import.meta.env.VITE_SERVER_DOMAIN + "/api/admin/all-blogs",
      {},
      { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
    )
      .then(({ data }) => {
        console.log('AdminComments: Received blogs data:', data);
        setBlogs(data.blogs || []);
        setLoadingBlogs(false);
      })
      .catch((error) => {
        console.error('AdminComments: Error fetching blogs:', error);
        setLoadingBlogs(false);
      });
  }, [userAuth.access_token]);

  // Fetch blog data and comments when a blog is selected
  useEffect(() => {
    if (!selectedBlog) return;
    setLoadingBlog(true);
    
    console.log('AdminComments: Fetching blog with ID:', selectedBlog.blog_id);
    console.log('AdminComments: Selected blog data:', selectedBlog);
    
    // Test if the blog_id is valid
    if (!selectedBlog.blog_id || typeof selectedBlog.blog_id !== 'string') {
      console.error('AdminComments: Invalid blog_id:', selectedBlog.blog_id);
      setLoadingBlog(false);
      return;
    }
    
    axios.post(
      import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog",
      { blog_id: selectedBlog.blog_id },
      { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
    )
      .then(async ({ data }) => {
        console.log('AdminComments: Received blog data:', data);
        let blogData = data.blog || blogStructure;
        
        // Fetch comments for the blog
        console.log('AdminComments: Fetching comments for blog_id:', blogData.blog_id);
        const { data: commentsData } = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog-comments",
          { blog_id: blogData.blog_id },
          { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
        );
        console.log('AdminComments: Received comments data:', commentsData);
        
        blogData.comments = { results: commentsData.comments || [] };
        setBlog(blogData);
        setTotalParentCommentsLoaded(commentsData.comments?.length || 0);
        setLoadingBlog(false);
      })
      .catch((error) => {
        console.error('AdminComments: Error fetching blog:', error);
        if (error.response?.status === 404) {
            alert('This blog or its comments no longer exist. Please select another blog.');
            setSelectedBlog(null);
            setBlog(blogStructure);
        }
        setLoadingBlog(false);
      });
  }, [selectedBlog, userAuth.access_token]);

  // Fetch spam comments
  const fetchSpamComments = async () => {
    setLoadingSpam(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/spam-comments`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSpamComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to fetch spam comments:', err);
    } finally {
      setLoadingSpam(false);
    }
  };

  // Fetch comment analytics
  const fetchCommentAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/comment-analytics`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setCommentAnalytics(res.data || {
        totalComments: 0,
        totalBlogs: 0,
        avgCommentsPerBlog: 0,
        recentActivity: []
      });
    } catch (err) {
      console.error('Failed to fetch comment analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Approve spam comment
  const approveSpamComment = async (comment_id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/mark-spam`,
        { comment_id, isSpam: false },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      fetchSpamComments();
    } catch (err) {
      console.error('Failed to approve spam comment:', err);
    }
  };

  // Delete spam comment
  const deleteSpamComment = async (comment_id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/delete-spam-comment/${comment_id}`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      fetchSpamComments();
    } catch (err) {
      console.error('Failed to delete spam comment:', err);
    }
  };

  // Filter blogs by search
  const filteredBlogs = blogs.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.blog_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch comment analytics on mount
  useEffect(() => {
    fetchCommentAnalytics();
  }, []);

  return (
    <div className="w-full max-w-full md:max-w-4xl mx-auto p-2 xs:p-3 sm:p-4 md:p-8">
      <h1 className="text-2xl font-normal mb-6">Comments Moderation</h1>
      
      <InPageNavigation routes={["Blog Comments", "Spam Comments", "Analytics"]} defaultActiveIndex={0}>
        {/* Blog Comments Tab */}
        <div>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search blog by title or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-2 bg-white text-black dark:bg-black dark:text-white dark:border-gray-700"
            />
            {loadingBlogs ? (
              <Loader />
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded bg-gray-50">
                {filteredBlogs.length ? (
                  filteredBlogs.map((blog) => {
                    console.log('AdminComments: Blog item:', blog);
                    return (
                      <div
                        key={blog.blog_id}
                        className={`px-4 py-2 cursor-pointer hover:bg-black-100 ${selectedBlog?.blog_id === blog.blog_id ? 'bg-black-200 font-seminormal' : ''}`}
                        onClick={() => {
                          console.log('AdminComments: Selected blog:', blog);
                          setSelectedBlog(blog);
                        }}
                      >
                        {blog.title} <span className="text-xs text-gray-400">({blog.blog_id})</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-gray-400">No blogs found.</div>
                )}
              </div>
            )}
          </div>
          {selectedBlog && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-2">Comments for: <span className="text-black-700">{selectedBlog.title}</span></h2>
              {loadingBlog ? (
                <Loader />
              ) : (
                <BlogContext.Provider value={{
                  blog,
                  setBlog,
                  commentsWrapper,
                  setCommentsWrapper,
                  totalParentCommentsLoaded,
                  setTotalParentCommentsLoaded,
                  fetchBlog: () => {}, // Optionally implement refresh
                }}>
                  <CommentsContainer />
                </BlogContext.Provider>
              )}
            </div>
          )}
        </div>
        
        {/* Spam Comments Tab */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Spam Comments</h2>
            <button 
              onClick={fetchSpamComments}
              className="btn-dark px-4 py-2 rounded mb-4"
            >
              Refresh Spam Comments
            </button>
            {loadingSpam ? (
              <Loader />
            ) : spamComments.length > 0 ? (
              <div className="space-y-4">
                {spamComments.map((comment, idx) => (
                  <div key={comment._id || idx} className="border rounded p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{comment.commented_by?.personal_info?.fullname || comment.commented_by?.email || 'Anonymous'}</span>
                      <span className="text-sm text-gray-500">{new Date(comment.commentedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.comment}</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm" onClick={() => approveSpamComment(comment._id)}>Approve</button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm" onClick={() => deleteSpamComment(comment._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center">No spam comments found.</div>
            )}
          </div>
        </div>
        
        {/* Analytics Tab */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Comment Analytics</h2>
            <button 
              onClick={fetchCommentAnalytics}
              className="btn-dark px-4 py-2 rounded mb-4"
            >
              Refresh Analytics
            </button>
            {loadingAnalytics ? (
              <Loader />
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium mb-2">Total Comments</h3>
                    <p className="text-3xl font-bold text-blue-600">{commentAnalytics.totalComments}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium mb-2">Blogs with Comments</h3>
                    <p className="text-3xl font-bold text-green-600">{commentAnalytics.blogsWithComments}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-medium mb-2">Avg Comments/Blog</h3>
                    <p className="text-3xl font-bold text-purple-600">{(commentAnalytics.avgCommentsPerBlog || 0).toFixed(1)}</p>
                  </div>
                </div>
                {/* Combined Area + Bar Chart for Comments Analytics Overview */}
                {commentAnalytics.recentActivity && commentAnalytics.recentActivity.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Comments Analytics Overview</h3>
                    <div className="bg-white p-4 rounded border">
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={commentAnalytics.recentActivity.map(c => ({
                          date: new Date(c.commentedAt).toLocaleDateString(),
                          count: 1
                        })).reduce((acc, curr) => {
                          const found = acc.find(a => a.date === curr.date);
                          if (found) found.count += 1;
                          else acc.push(curr);
                          return acc;
                        }, [])}>
                          <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#42a5f5" stopOpacity={0.8}/>
                              <stop offset="100%" stopColor="#7e57c2" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 13 }} />
                          <YAxis allowDecimals={false} tick={{ fill: '#555', fontSize: 13 }} />
                          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #42a5f5', borderRadius: 8, color: '#333' }} cursor={{ fill: '#f5f5f5' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#555' }} />
                          <Bar dataKey="count" name="Comments (Bar)" fill="#42a5f5" radius={[8, 8, 0, 0]} barSize={30} />
                          <Area type="monotone" dataKey="count" stroke="#7e57c2" fill="url(#colorArea)" name="Comments (Trend)" strokeWidth={3} dot={{ r: 4, fill: '#7e57c2', stroke: '#fff', strokeWidth: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {commentAnalytics.recentActivity && commentAnalytics.recentActivity.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Recent Comment Activity</h3>
                    <div className="space-y-2">
                      {commentAnalytics.recentActivity.map((comment, idx) => (
                        <div key={comment._id || idx} className="bg-white p-4 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {comment.commented_by?.personal_info?.fullname || comment.commented_by?.email || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.commentedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{comment.comment}</p>
                          {comment.blog_id && (
                            <p className="text-xs text-gray-400">
                              On: {comment.blog_id.title || comment.blog_id.blog_id || 'Unknown Blog'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </InPageNavigation>
    </div>
  );
};

export default AdminComments; 