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
  const [publishedBlogs, setPublishedBlogs] = useState(null);
  const [draftBlogs, setDraftBlogs] = useState(null);
  const [loading, setLoading] = useState({ published: true, drafts: true });
  const [error, setError] = useState({ published: null, drafts: null });
  const [publishedPage, setPublishedPage] = useState(1);
  const [draftsPage, setDraftsPage] = useState(1);

  useEffect(() => {
    if (!userAuth || !userAuth.admin) return;
    fetchBlogs(false); // Published
    fetchBlogs(true);  // Drafts
    // eslint-disable-next-line
  }, [userAuth]);

  const fetchBlogs = async (draft) => {
    setLoading(prev => ({ ...prev, [draft ? 'drafts' : 'published']: true }));
    setError(prev => ({ ...prev, [draft ? 'drafts' : 'published']: null }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/all-blogs`,
        {},
        {
          headers: { 'Authorization': `Bearer ${userAuth.access_token}` },
        }
      );
      // Filter blogs by draft status on the frontend
      if (draft) setDraftBlogs((res.data.blogs || []).filter(b => b.draft === true));
      else setPublishedBlogs((res.data.blogs || []).filter(b => b.draft === false));
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
  const getPaginatedBlogs = (blogs, page) => {
    if (!Array.isArray(blogs)) return [];
    const start = (page - 1) * BLOGS_PER_PAGE;
    return blogs.slice(start, start + BLOGS_PER_PAGE);
  };
  const getTotalPages = (blogs) => {
    if (!Array.isArray(blogs)) return 1;
    return Math.max(1, Math.ceil(blogs.length / BLOGS_PER_PAGE));
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
                {getPaginatedBlogs(publishedBlogs, publishedPage).map((blog, idx) => (
                  <ManagePublishedBlogCard key={blog.blog_id || idx} blog={{ ...blog, index: (publishedPage - 1) * BLOGS_PER_PAGE + idx, setStateFunc: setPublishedBlogs }} />
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col xs:flex-row justify-center items-center gap-2 mt-4 sm:mt-6 w-full overflow-x-auto">
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => setPublishedPage(p => Math.max(1, p - 1))}
                  disabled={publishedPage === 1}
                >
                  Previous
                </button>
                <span>Page {publishedPage} of {getTotalPages(publishedBlogs)}</span>
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => setPublishedPage(p => Math.min(getTotalPages(publishedBlogs), p + 1))}
                  disabled={publishedPage === getTotalPages(publishedBlogs)}
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
                {getPaginatedBlogs(draftBlogs, draftsPage).map((blog, idx) => (
                  <ManageDraftBlogPost key={blog.blog_id || idx} blog={{ ...blog, index: (draftsPage - 1) * BLOGS_PER_PAGE + idx, setStateFunc: setDraftBlogs }} />
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col xs:flex-row justify-center items-center gap-2 mt-4 sm:mt-6 w-full overflow-x-auto">
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => setDraftsPage(p => Math.max(1, p - 1))}
                  disabled={draftsPage === 1}
                >
                  Previous
                </button>
                <span>Page {draftsPage} of {getTotalPages(draftBlogs)}</span>
                <button
                  className="btn-light px-3 py-1"
                  onClick={() => setDraftsPage(p => Math.min(getTotalPages(draftBlogs), p + 1))}
                  disabled={draftsPage === getTotalPages(draftBlogs)}
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