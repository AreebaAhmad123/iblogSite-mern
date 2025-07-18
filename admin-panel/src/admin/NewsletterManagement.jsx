import { useState, useContext, useEffect, useMemo } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import Loader from '../components/loader.component';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { saveAs } from "file-saver";

const NewsletterManagement = () => {
  const { userAuth } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [bulkActionError, setBulkActionError] = useState("");
  const [fetchSubscribersError, setFetchSubscribersError] = useState("");
  const [subscriberStatusError, setSubscriberStatusError] = useState("");
  const [deleteSubscriberError, setDeleteSubscriberError] = useState("");
  
  // Newsletter sending state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  
  // Test newsletter state
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Pagination and selection state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  // Filtered subscribers for search
  const filteredSubscribers = useMemo(() => {
    if (!search.trim()) return subscribers;
    return subscribers.filter(s => s.email.toLowerCase().includes(search.trim().toLowerCase()));
  }, [subscribers, search]);
  // Memoized paginated subscribers (use filtered list)
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscribers.slice(start, start + pageSize);
  }, [filteredSubscribers, currentPage, pageSize]);
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;

  // Selection handlers
  const isAllSelected = paginatedSubscribers.length > 0 && paginatedSubscribers.every(s => selected.includes(s._id));
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(prev => Array.from(new Set([...prev, ...paginatedSubscribers.map(s => s._id)])));
    } else {
      setSelected(prev => prev.filter(id => !paginatedSubscribers.some(s => s._id === id)));
    }
  };
  const handleSelectOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  // Bulk actions
  const handleBulkAction = async (action) => {
    setBulkActionError("");
    if (selected.length === 0) return;
    if (!window.confirm(`Are you sure you want to ${action} the selected subscribers?`)) return;
    try {
      let result;
      if (action === 'delete') {
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/newsletter-subscribers/bulk-delete`,
          { ids: selected },
          { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
        );
        result = res.data;
      } else if (action === 'activate' || action === 'deactivate') {
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/newsletter-subscribers/bulk-update`,
          { ids: selected, isActive: action === 'activate' ? true : false },
          { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
        );
        result = res.data;
      }
      setBulkActionError("");
      if (result.failed && result.failed.length > 0) {
        setBulkActionError(`Some actions failed: ${result.failed.map(f => `${f.id || f} (${f.reason || 'unknown'})`).join(', ')}`);
      }
      setSelected([]);
      fetchSubscribers();
    } catch (err) {
      setBulkActionError('Bulk action failed. Please try again.');
    }
  };

  // Fetch subscribers
  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    setFetchSubscribersError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/newsletter-subscribers`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSubscribers(res.data.subscribers);
      setStats(res.data.stats);
    } catch (err) {
      setFetchSubscribersError('Error fetching subscribers. Please try again.');
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (userAuth.access_token) {
      fetchSubscribers();
    }
  }, [userAuth.access_token]);

  // Add validation error state
  const [newsletterValidationError, setNewsletterValidationError] = useState("");
  const [testNewsletterValidationError, setTestNewsletterValidationError] = useState("");

  // Helper to strip HTML tags
  const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim();

  // Send newsletter to all subscribers
  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (sendingNewsletter) return; // Prevent double submission
    setNewsletterValidationError("");
    if (!subject.trim() || stripHtml(content).length === 0) {
      setNewsletterValidationError('Please fill in both subject and content.');
      return;
    }
    if (subject.trim().length < 5) {
      setNewsletterValidationError('Subject must be at least 5 characters.');
      return;
    }
    if (stripHtml(content).length < 20) {
      setNewsletterValidationError('Content must be at least 20 characters (excluding formatting).');
      return;
    }
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to send this newsletter to ALL active subscribers? This action cannot be undone.')) {
      return;
    }
    setSendingNewsletter(true);
    setSendResult(null);
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/send-newsletter`,
        { subject, content },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      
      setSendResult({
        success: true,
        message: res.data.message,
        stats: res.data.stats
      });
      
      // Clear form
      setSubject('');
      setContent('');
      
      // Refresh subscribers
      fetchSubscribers();
    } catch (err) {
      setSendResult({
        success: false,
        message: err.response?.data?.error || 'Failed to send newsletter.'
      });
    } finally {
      setSendingNewsletter(false);
    }
  };

  // Send test newsletter
  const handleSendTestNewsletter = async (e) => {
    e.preventDefault();
    setTestNewsletterValidationError("");
    if (!testEmail.trim() || !subject.trim() || stripHtml(content).length === 0) {
      setTestNewsletterValidationError('Please fill in all fields for test newsletter.');
      return;
    }
    if (subject.trim().length < 5) {
      setTestNewsletterValidationError('Subject must be at least 5 characters.');
      return;
    }
    if (stripHtml(content).length < 20) {
      setTestNewsletterValidationError('Content must be at least 20 characters (excluding formatting).');
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/send-test-newsletter`,
        { email: testEmail, subject, content },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      
      setTestResult({
        success: true,
        message: res.data.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || 'Failed to send test newsletter.'
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Update subscriber status
  const handleToggleSubscriberStatus = async (subscriberId, currentStatus, silent = false) => {
    if (!silent) setSubscriberStatusError("");
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/newsletter-subscriber/${subscriberId}`,
        { isActive: !currentStatus },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      fetchSubscribers();
    } catch (err) {
      if (!silent) setSubscriberStatusError('Failed to update subscriber status.');
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (subscriberId, silent = false) => {
    if (!silent && !confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }
    if (!silent) setDeleteSubscriberError("");
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/newsletter-subscriber/${subscriberId}`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      fetchSubscribers();
    } catch (err) {
      if (!silent) setDeleteSubscriberError('Failed to delete subscriber.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [
      ["Email", "Status", "Subscribed At"],
      ...filteredSubscribers.map(s => [
        s.email,
        s.isActive ? "Active" : "Inactive",
        new Date(s.subscribedAt).toLocaleString()
      ])
    ];
    const csvContent = csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `newsletter-subscribers-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="w-full max-w-full md:max-w-6xl mx-auto p-2 xs:p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-gray-800">Newsletter Management</h1>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Total Subscribers</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Active Subscribers</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active || 0}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Inactive Subscribers</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.inactive || 0}</p>
        </div>
      </div>
      {/* Send Newsletter Form */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-800">Send Newsletter</h2>
        <form onSubmit={handleSendNewsletter} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black dark:bg-black dark:text-white dark:border-gray-700"
              placeholder="Enter newsletter subject..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content (HTML supported)
            </label>
            <ReactQuill
              value={content}
              onChange={setContent}
              className="bg-white text-black dark:bg-black dark:text-white dark:border-gray-700"
              theme="snow"
              placeholder="Enter newsletter content..."
              style={{ minHeight: '200px', marginBottom: '1rem' }}
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={sendingNewsletter}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingNewsletter ? 'Sending...' : 'Send to All Subscribers'}
            </button>
            {sendingNewsletter && (
              <span className="ml-2 flex items-center text-blue-600">
                <svg className="animate-spin h-5 w-5 mr-1 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Sending newsletter...
              </span>
            )}
          </div>
        </form>

        {sendResult && (
          <div className={`mt-4 p-4 rounded-md ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {sendResult.message}
            {sendResult.stats && (
              <div className="mt-2 text-sm">
                <p>Total subscribers: {sendResult.stats.totalSubscribers}</p>
                <p>Successfully sent: {sendResult.stats.successCount}</p>
                <p>Failed: {sendResult.stats.failureCount}</p>
                {Array.isArray(sendResult.stats.errors) && sendResult.stats.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-red-700">Failed Emails:</p>
                    <ul className="list-disc ml-6">
                      {sendResult.stats.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx} className="text-xs text-red-700">
                          {err.email}: {err.error}
                        </li>
                      ))}
                    </ul>
                    {sendResult.stats.errors.length > 10 && (
                      <p className="text-xs text-gray-600">...and {sendResult.stats.errors.length - 10} more</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Newsletter Form */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-800">Send Test Newsletter</h2>
        
        <form onSubmit={handleSendTestNewsletter} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black dark:bg-black dark:text-white dark:border-gray-700"
              placeholder="Enter test email address..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={sendingTest}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {sendingTest ? 'Sending...' : 'Send Test Newsletter'}
          </button>
        </form>

        {testResult && (
          <div className={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Subscribers List */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-800">Subscribers</h2>
        {/* Search and Export Controls */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="px-2 py-1 border rounded w-64"
          />
          <button
            onClick={handleExportCSV}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
        {/* Bulk actions */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <button onClick={() => handleBulkAction('activate')} disabled={selected.length === 0} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50">Activate</button>
          <button onClick={() => handleBulkAction('deactivate')} disabled={selected.length === 0} className="bg-yellow-600 text-white px-3 py-1 rounded disabled:opacity-50">Deactivate</button>
          <button onClick={() => handleBulkAction('delete')} disabled={selected.length === 0} className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50">Delete</button>
          <span className="ml-4 text-sm text-gray-500">{selected.length} selected</span>
        </div>
        {/* Pagination controls */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="ml-2 px-2 py-1 border rounded">
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} / page</option>)}
          </select>
        </div>
        {loadingSubscribers ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className={selected.includes(subscriber._id) ? 'bg-blue-50' : ''}>
                    <td className="px-2 py-4"><input type="checkbox" checked={selected.includes(subscriber._id)} onChange={() => handleSelectOne(subscriber._id)} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subscriber.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscriber.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleSubscriberStatus(subscriber._id, subscriber.isActive)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {subscriber.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteSubscriber(subscriber._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Bulk actions error */}
      {bulkActionError && <div className="mb-2 text-red-600">{bulkActionError}</div>}
      {/* Fetch subscribers error */}
      {fetchSubscribersError && <div className="mb-2 text-red-600">{fetchSubscribersError}</div>}
      {/* Subscriber status error */}
      {subscriberStatusError && <div className="mb-2 text-red-600">{subscriberStatusError}</div>}
      {/* Delete subscriber error */}
      {deleteSubscriberError && <div className="mb-2 text-red-600">{deleteSubscriberError}</div>}
      {/* Newsletter validation error */}
      {newsletterValidationError && <div className="mb-2 text-red-600">{newsletterValidationError}</div>}
      {/* Test newsletter validation error */}
      {testNewsletterValidationError && <div className="mb-2 text-red-600">{testNewsletterValidationError}</div>}
    </div>
  );
};

export default NewsletterManagement; 