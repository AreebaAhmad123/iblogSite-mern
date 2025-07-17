// SECURITY REMINDER:
// All permission checks (e.g., self-demote, super admin demote/delete, bulk actions) MUST be enforced on the backend.
// Frontend checks are for user experience only and are NOT sufficient for security.
// Ensure all admin actions are also audit-logged on the backend for traceability.
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../App.jsx';
import AdminUserTable from './AdminUserTable.jsx';
import AdminUserSearchBar from './AdminUserSearchBar.jsx';
import Loader from '../../components/loader.component.jsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InPageNavigation from '../../components/inpage-navigation.component';

const FILTERS = [
  { label: 'Active', value: 'active', color: 'bg-green-100 text-green-800' },
  { label: 'Deactivated', value: 'deactivated', color: 'bg-yellow-100 text-yellow-800' },
  { label: 'Deleted', value: 'deleted', color: 'bg-gray-200 text-gray-700' },
];

export default function UserManagement() {
  const { userAuth } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [actionLoading, setActionLoading] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [myRequestsError, setMyRequestsError] = useState('');
  const [bulkActionError, setBulkActionError] = useState('');
  const isSuperAdmin = userAuth?.super_admin;

  // Remove logging from tab click handler
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin && activeTab === 1) {
      fetchPendingRequests();
    }
    if (!isSuperAdmin && activeTab === 1) {
      fetchMyRequests();
    }
    // eslint-disable-next-line
  }, [userAuth.access_token, isSuperAdmin, activeTab]);

  useEffect(() => {
    let filtered = users;
    if (filter === 'active') filtered = users.filter(u => !u.deleted && u.active !== false);
    else if (filter === 'deactivated') filtered = users.filter(u => !u.deleted && u.active === false);
    else if (filter === 'deleted') filtered = users.filter(u => u.deleted);
    if (search) {
      filtered = filtered.filter(
        u => u.personal_info?.fullname?.toLowerCase().includes(search.toLowerCase()) ||
             u.personal_info?.email?.toLowerCase().includes(search.toLowerCase()) ||
             u.personal_info?.username?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [search, users, filter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/users`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setUsers(res.data.users || []);
      setFilteredUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/status-change-requests`,
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setPendingRequests(res.data.requests || []);
    } catch (err) {
      setRequestsError(err.response?.data?.error || 'Failed to fetch requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setMyRequestsLoading(true);
    setMyRequestsError('');
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/my-status-change-requests`,
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setMyRequests(res.data.requests || []);
    } catch (err) {
      setMyRequestsError(err.response?.data?.error || 'Failed to fetch your requests.');
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const handleSearch = (val) => setSearch(val);
  const handleFilter = (val) => setFilter(val);

  const handleSelectUser = (userId, checked) => {
    setSelectedUserIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };
  const handleSelectAll = (checked) => {
    setSelectedUserIds(checked ? filteredUsers.map(u => u._id) : []);
  };

  const handlePromoteDemote = async (userId, promote) => {
    // Find the target user
    const targetUser = users.find(u => u._id === userId);
    // Prevent self-demote/promote
    if (userId === userAuth._id) {
      toast.error("You cannot change your own admin status.");
      return;
    }
    // Prevent super admin demote/promote unless current user is super admin and not targeting themselves
    if (targetUser?.super_admin) {
      toast.error("You cannot change the admin status of a super admin.");
      return;
    }
    const actionText = promote ? 'promote this user to admin' : 'demote this admin to user';
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    setActionLoading(userId + (promote ? '-promote' : '-demote'));
    setError(null);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/set-admin`,
        { userId, admin: promote },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      if (userAuth.super_admin) {
        toast.success(`User ${promote ? 'promoted' : 'demoted'} successfully.`);
      } else {
        toast.success('Request submitted successfully.');
      }
      await fetchUsers(); // Refresh user list
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user role.';
      setError(msg);
      if (err.response?.status === 403 || /permission|not allowed|forbidden/i.test(msg)) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleActivateDeactivate = async (userId, activate) => {
    // Find the target user
    const targetUser = users.find(u => u._id === userId);
    // Prevent self-activate/deactivate
    if (userId === userAuth._id) {
      toast.error("You cannot change your own active status.");
      return;
    }
    // Prevent super admin activate/deactivate
    if (targetUser?.super_admin) {
      toast.error("You cannot change the active status of a super admin.");
      return;
    }
    const actionText = activate ? 'activate this user' : 'deactivate this user';
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    setActionLoading(userId + (activate ? '-activate' : '-deactivate'));
    setError(null);
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/user-status`,
        { userId, active: activate },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      toast.success(`User ${activate ? 'activated' : 'deactivated'} successfully.`);
      await fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user status.';
      setError(msg);
      if (err.response?.status === 403 || /permission|not allowed|forbidden/i.test(msg)) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteUser = async (userId) => {
    // Find the target user
    const targetUser = users.find(u => u._id === userId);
    // Prevent self-delete
    if (userId === userAuth._id) {
      toast.error("You cannot delete yourself.");
      return;
    }
    // Prevent super admin delete
    if (targetUser?.super_admin) {
      toast.error("You cannot delete a super admin.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(userId + '-delete');
    setError(null);
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/user/${userId}`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      toast.success('User deleted successfully.');
      await fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete user.';
      setError(msg);
      if (err.response?.status === 403 || /permission|not allowed|forbidden/i.test(msg)) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleBulkAction = async (action) => {
    setBulkActionError("");
    if (selectedUserIds.length === 0) return;
    // Only super admin can perform bulk actions
    if (!userAuth?.super_admin) {
      setBulkActionError("Only super admins can perform bulk actions.");
      toast.error("Only super admins can perform bulk actions.");
      return;
    }
    // Prevent bulk actions if any selected user is self or super admin
    const selectedUsers = users.filter(u => selectedUserIds.includes(u._id));
    if (selectedUsers.some(u => u._id === userAuth._id)) {
      setBulkActionError("You cannot perform bulk actions on yourself.");
      toast.error("You cannot perform bulk actions on yourself.");
      return;
    }
    if (selectedUsers.some(u => u.super_admin)) {
      setBulkActionError("You cannot perform bulk actions on super admins.");
      toast.error("You cannot perform bulk actions on super admins.");
      return;
    }
    let actionText = '';
    switch(action) {
      case 'promote': actionText = 'promote'; break;
      case 'demote': actionText = 'demote'; break;
      case 'activate': actionText = 'activate'; break;
      case 'deactivate': actionText = 'deactivate'; break;
      case 'delete': actionText = 'delete'; break;
      default: actionText = action;
    }
    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedUserIds.length} users? This action cannot be undone.`)) return;
    setActionLoading('bulk-' + action);
    setError(null);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/bulk-user-action`,
        { userIds: selectedUserIds, action },
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSelectedUserIds([]);
      toast.success(`Bulk action '${action}' completed successfully.`);
      await fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Bulk action failed.';
      setBulkActionError(msg);
      setError(msg);
      if (err.response?.status === 403 || /permission|not allowed|forbidden/i.test(msg)) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleApproveRequest = async (id) => {
    setRequestsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/status-change-requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      toast.success('Request approved.');
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve request.');
    } finally {
      setRequestsLoading(false);
    }
  };
  const handleRejectRequest = async (id) => {
    setRequestsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/status-change-requests/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      toast.success('Request rejected.');
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject request.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    setMyRequestsLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/delete-status-change-request/${id}`,
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      toast.success('Request deleted.');
      fetchMyRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete request.');
    } finally {
      setMyRequestsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full md:max-w-5xl mx-auto p-2 xs:p-3 sm:p-4 md:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">User Management</h1>
      <InPageNavigation
        routes={isSuperAdmin ? ["Admins & Users", "Requests"] : ["Admins & Users", "My Requests"]}
        defaultActiveIndex={0}
        onTabChange={handleTabChange}
      >
        {[
          // Tab 1: User/Admin List
          <div key="users-admins">
            <div className="mb-3 sm:mb-4">
              {selectedUserIds.length > 0 && userAuth?.super_admin && (
                <div className="flex flex-col sm:flex-row gap-2 mb-2 p-2 bg-gray-50 border rounded-lg shadow-sm overflow-x-auto">
                  <span className="font-medium">Bulk actions for {selectedUserIds.length} selected:</span>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 rounded bg-black text-white" disabled={actionLoading} onClick={() => handleBulkAction('promote')}>Promote</button>
                    <button className="px-3 py-1 rounded bg-gray-700 text-white" disabled={actionLoading} onClick={() => handleBulkAction('demote')}>Demote</button>
                    <button className="px-3 py-1 rounded bg-green-600 text-white" disabled={actionLoading} onClick={() => handleBulkAction('activate')}>Activate</button>
                    <button className="px-3 py-1 rounded bg-yellow-500 text-white" disabled={actionLoading} onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
                    <button className="px-3 py-1 rounded bg-red text-white" disabled={actionLoading} onClick={() => handleBulkAction('delete')}>Delete</button>
                  </div>
                  {bulkActionError && <div className="mt-2 text-red-600">{bulkActionError}</div>}
                </div>
              )}
              <div className="w-full overflow-x-auto">
                <AdminUserSearchBar value={search} onChange={handleSearch} />
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              {(() => {
                const validFilteredUsers = filteredUsers.filter(u => u && u._id);
                return (
                  <AdminUserTable
                    users={validFilteredUsers}
                    userAuth={userAuth}
                    superAdmin={isSuperAdmin}
                    loading={loading}
                    error={error}
                    selectedUserIds={selectedUserIds}
                    onSelectUser={handleSelectUser}
                    onSelectAll={handleSelectAll}
                    handlePromoteDemote={handlePromoteDemote}
                    handleActivateDeactivate={handleActivateDeactivate}
                    handleDeleteUser={handleDeleteUser}
                    actionLoading={actionLoading}
                    filter={filter}
                    onFilter={handleFilter}
                  />
                );
              })()}
            </div>
          </div>,
          // Tab 2: Requests (Super Admin) or My Requests (Admin)
          isSuperAdmin ? (
            <div key="requests">
              {requestsLoading ? (
                <Loader />
              ) : requestsError ? (
                <div className="text-red-500 text-center my-8">{requestsError}</div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-gray-500 text-center my-8">No pending requests.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl shadow-lg bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-4 font-medium rounded-tl-2xl">Requesting User</th>
                        <th className="p-4 font-medium">Target User</th>
                        <th className="p-4 font-medium">Action</th>
                        <th className="p-4 font-medium">Requested At</th>
                        <th className="p-4 font-medium text-center rounded-tr-2xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map(req => (
                        <tr key={req._id} className="transition hover:bg-gray-50">
                          <td className="p-4 align-middle font-medium">
                            {req.requestingUser?.personal_info?.fullname || req.requestingUser?.fullname || req.requestingUser?.personal_info?.email || req.requestingUser?.email || '-'}
                          </td>
                          <td className="p-4 align-middle font-medium">
                            {req.targetUser?.personal_info?.fullname || req.targetUser?.fullname || req.targetUser?.personal_info?.email || req.targetUser?.email || '-'}
                          </td>
                          <td className="p-4 align-middle capitalize">{req.action}</td>
                          <td className="p-4 align-middle">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="p-4 align-middle text-center flex gap-2">
                            <button className="px-4 py-2 bg-green-50 text-green-700 border border-green-300 rounded-full shadow hover:bg-green-100 focus:ring-2 focus:ring-green-300 transition disabled:opacity-50" disabled={requestsLoading} onClick={() => handleApproveRequest(req._id)}>Approve</button>
                            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full shadow hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 transition disabled:opacity-50" disabled={requestsLoading} onClick={() => handleRejectRequest(req._id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div key="my-requests">
              {myRequestsLoading ? (
                <Loader />
              ) : myRequestsError ? (
                <div className="text-red-500 text-center my-8">{myRequestsError}</div>
              ) : myRequests.length === 0 ? (
                <div className="text-gray-500 text-center my-8">You have not submitted any requests.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl shadow-lg bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-3 font-medium text-left rounded-tl-2xl">Target User</th>
                        <th className="p-3 font-medium text-left">Action</th>
                        <th className="p-3 font-medium text-left">Status</th>
                        <th className="p-3 font-medium text-left">Requested At</th>
                        <th className="p-3 font-medium text-left">Reviewed By</th>
                        <th className="p-3 font-medium text-left">Reviewed At</th>
                        <th className="p-3 font-medium text-left rounded-tr-2xl">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req, idx) => (
                        <tr key={req._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-3 font-medium">
                            {req.targetUser?.personal_info?.fullname || req.targetUser?.fullname || req.targetUser?.personal_info?.email || req.targetUser?.email || '-'}
                          </td>
                          <td className="p-3 capitalize">{req.action}</td>
                          <td className="p-3">
                            {req.status === 'pending' && <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</span>}
                            {req.status === 'approved' && <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-200">Approved</span>}
                            {req.status === 'rejected' && <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 border border-red-200">Rejected</span>}
                          </td>
                          <td className="p-3">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="p-3">{req.reviewedBy?.personal_info?.fullname || req.reviewedBy?.personal_info?.email || <span className="text-gray-400">-</span>}</td>
                          <td className="p-3">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : <span className="text-gray-400">-</span>}</td>
                          <td className="p-3 text-center">
                            <button
                              className="w-8 h-8 flex items-center justify-center border border-red-500 bg-white hover:bg-red-100 rounded-full"
                              title="Delete request"
                              onClick={() => handleDeleteRequest(req._id)}
                              disabled={myRequestsLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="red">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        ]}
      </InPageNavigation>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
} 