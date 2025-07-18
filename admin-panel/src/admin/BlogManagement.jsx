import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import { ManagePublishedBlogCard, ManageDraftBlogPost } from '../components/manage-blogcard.component.jsx';
import Loader from '../components/loader.component.jsx';
import { Link } from 'react-router-dom';
import InPageNavigation from '../components/inpage-navigation.component.jsx';

const BLOGS_PER_PAGE = 5;

const BlogManagement = () => {
  const { userAuth } = useContext(UserContext);
  const [publishedBlogs, setPublishedBlogs] = useState([]);
  const [draftBlogs, setDraftBlogs] = useState([]);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [loading, setLoading] = useState({ published: true, drafts: true });
  const [error, setError] = useState({ published: null, drafts: null });
  const [publishedPage, setPublishedPage] = useState(1);
  const [draftsPage, setDraftsPage] = useState(1);

  useEffect(() => {
    if (!userAuth || !userAuth.admin) return;
    fetchBlogs(false, 1); // Published, page 1
    fetchBlogs(true, 1);  // Drafts, page 1
    // eslint-disable-next-line
  }, [userAuth]);

  const fetchBlogs = async (draft, page) => {
    setLoading(prev => ({ ...prev, [draft ? 'drafts' : 'published']: true }));
    setError(prev => ({ ...prev, [draft ? 'drafts' : 'published']: null }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/all-blogs`,
        { page, limit: BLOGS_PER_PAGE, draft },
        {
          headers: { 'Authorization': `Bearer ${userAuth.access_token}` },
        }
      );
      if (draft) {
        setDraftBlogs(res.data.blogs || []);
        setDraftsTotal(res.data.total || 0);
      } else {
        setPublishedBlogs(res.data.blogs || []);
        setPublishedTotal(res.data.total || 0);
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        [draft ? 'drafts' : 'published']: err.response?.data?.error || 'Failed to fetch blogs.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [draft ? 'drafts' : 'published']: false }));
    }
  };

  // Pagination logic
  const getTotalPages = (total) => {
    return Math.max(1, Math.ceil(total / BLOGS_PER_PAGE));
  };

  return (
    <div className="w-full max-w-full md:max-w-4xl mx-auto p-2 xs:p-3 sm:p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-medium">Blog Management</h1>
        <Link to="/admin/editor" className="btn-dark px-4 py-2 rounded w-full sm:w-auto text-center">Create New Blog</Link>
      </div>
      
      <InPageNavigation routes={["Published Blogs", "Drafts"]} defaultActiveIndex={0}>
        {/* Published Blogs Tab */}
        <div>
          {loading.published ? (
            <Loader />
          ) : error.published ? (
            <div className="text-red-500 text-center">{error.published}</div>
          ) : publishedBlogs && publishedBlogs.length ? (
            <>
              <div className="space-y-4 sm:space-y-6">
                {publishedBlogs.map((blog, idx) => (
                  <ManagePublishedBlogCard key={blog.blog_id || idx} blog={{ ...blog, index: (publishedPage - 1) * BLOGS_PER_PAGE + idx, setStateFunc: setPublishedBlogs }} />
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col xs:flex-row justify-center items-center gap-2 mt-4 sm:mt-6 w-full overflow-x-auto">
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => {
                    const newPage = Math.max(1, publishedPage - 1);
                    setPublishedPage(newPage);
                    fetchBlogs(false, newPage);
                  }}
                  disabled={publishedPage === 1}
                >
                  Previous
                </button>
                <span>Page {publishedPage} of {getTotalPages(publishedTotal)}</span>
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => {
                    const newPage = Math.min(getTotalPages(publishedTotal), publishedPage + 1);
                    setPublishedPage(newPage);
                    fetchBlogs(false, newPage);
                  }}
                  disabled={publishedPage === getTotalPages(publishedTotal)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">No published blogs found.</div>
          )}
        </div>
        
        {/* Drafts Tab */}
        <div>
          {loading.drafts ? (
            <Loader />
          ) : error.drafts ? (
            <div className="text-red-500 text-center">{error.drafts}</div>
          ) : draftBlogs && draftBlogs.length ? (
            <>
              <div className="space-y-4 sm:space-y-6">
                {draftBlogs.map((blog, idx) => (
                  <ManageDraftBlogPost key={blog.blog_id || idx} blog={{ ...blog, index: (draftsPage - 1) * BLOGS_PER_PAGE + idx, setStateFunc: setDraftBlogs }} />
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col xs:flex-row justify-center items-center gap-2 mt-4 sm:mt-6 w-full overflow-x-auto">
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => {
                    const newPage = Math.max(1, draftsPage - 1);
                    setDraftsPage(newPage);
                    fetchBlogs(true, newPage);
                  }}
                  disabled={draftsPage === 1}
                >
                  Previous
                </button>
                <span>Page {draftsPage} of {getTotalPages(draftsTotal)}</span>
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => {
                    const newPage = Math.min(getTotalPages(draftsTotal), draftsPage + 1);
                    setDraftsPage(newPage);
                    fetchBlogs(true, newPage);
                  }}
                  disabled={draftsPage === getTotalPages(draftsTotal)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">No drafts found.</div>
          )}
        </div>
      </InPageNavigation>
    </div>
  );
};

export default BlogManagement; 