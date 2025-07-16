import { useState, useRef, useEffect, useContext } from 'react';
import AdminUserTable from '../admin/UserManagement/AdminUserTable.jsx';
import AdminUserTableRow from '../admin/UserManagement/AdminUserTableRow.jsx';
import AdminUserActions from '../admin/UserManagement/AdminUserActions.jsx';
import AdminUserSearchBar from '../admin/UserManagement/AdminUserSearchBar.jsx';
import AdminUserStatusBadge from '../admin/UserManagement/AdminUserStatusBadge.jsx';
import BlogManagement from '../admin/BlogManagement';
import AdminUtilities from '../admin/AdminUtilities.jsx';
import AdminNotifications from '../admin/AdminNotifications.jsx';
import AdminComments from '../admin/AdminComments.jsx';
import NewsletterManagement from '../admin/NewsletterManagement.jsx';
import LogoutButton from '../components/logout-button.component.jsx';
import ThemeToggle from '../components/theme-toggle.component.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../App';
import { Navigate, useNavigate, Outlet } from 'react-router-dom';
import AdminDashboard from '../admin/AdminDashboard.jsx';
import axios from 'axios';
import ProfilePage from './profile.page.jsx';

const sections = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'profile',
    label: 'My Profile',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'users',
    label: 'User Management',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'blogs',
    label: 'Blog Management',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4zm0 4h10v2H4z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'comments',
    label: 'Comments',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M21 6h-2V4a2 2 0 00-2-2H7a2 2 0 00-2 2v2H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-2 0H5V4h14v2zm2 12H3V8h18v10z" fill="currentColor"/></svg>
    ),
  },
  {
    key: 'utilities',
    label: 'Utilities',
    icon: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><path d="M19.14 12.94a1.5 1.5 0 00-2.12 0l-1.42 1.42-2.12-2.12 1.42-1.42a1.5 1.5 0 000-2.12l-2.12-2.12a1.5 1.5 0 00-2.12 0l-1.42 1.42-2.12-2.12 1.42-1.42a1.5 1.5 0 000-2.12l-2.12-2.12a1.5 1.5 0 00-2.12 0l-1.42 1.42-2.12-2.12 1.42-1.42a1.5 1.5 0 000-2.12l-2.12-2.12a1.5 1.5 0 00-2.12 0l-1.42 1.42-2.12-2.12 1.42-1.42a1.5 1.5 0 000-2.12z" fill="currentColor"/></svg>
    ),
  },
];

const AdminPanel = () => {
  const { userAuth, setUserAuth } = useContext(UserContext);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showSideNav, setShowSideNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const activeTabLine = useRef();
  const sideBarIconTab = useRef();
  const pageStateTab = useRef();
  // Add missing state for user search
  const [userSearchValue, setUserSearchValue] = useState("");
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  // Add missing state for users
  const [users, setUsers] = useState([]);
  // Add missing state for actionLoading
  const [actionLoading, setActionLoading] = useState("");
  // Add missing state for superAdmin
  const [superAdmin, setSuperAdmin] = useState(false);
  // Add missing state for selectedUserIds
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  // Add placeholder for handlePromoteDemote
  const handlePromoteDemote = () => {};

  const navigate = useNavigate(); // <-- add this

  // Add missing onSelectUser handler
  const onSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Add missing onSelectAll handler
  const onSelectAll = (userIds) => {
    // If all users are already selected, deselect all
    if (selectedUserIds.length === userIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userIds);
    }
  };

  // Check if user came from notification bell (check URL parameters or referrer)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotification = urlParams.get('section');
    if (fromNotification === 'notifications') {
      setActiveSection('notifications');
    }
  }, []);

  // Wait for auth state to be initialized
  useEffect(() => {
    // If userAuth is null, we're still loading
    if (userAuth === null) {
      setIsLoading(true);
    } else {
      // Auth state has been determined (either user object or false)
      setIsLoading(false);
    }
  }, [userAuth]);

  // If we've been loading for more than 2 seconds, assume no user is logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && userAuth === null) {
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, userAuth]);

  useEffect(() => {
    if (activeSection === 'users' && userAuth?.access_token) {
      setUserSearchLoading(true);
      axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/users`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      )
        .then(res => {
          setUsers(res.data.users || []);
        })
        .catch(err => {
          // Optionally handle error
          setUsers([]);
        })
        .finally(() => setUserSearchLoading(false));
    }
    // Optionally, clear users when leaving the section
    // else if (activeSection !== 'users') {
    //   setUsers([]);
    // }
  }, [activeSection, userAuth?.access_token]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }



  // Check if user is admin
  const isAdmin = userAuth?.admin === true || userAuth?.super_admin === true;
  
  // Redirect to login if not authenticated
  if (!userAuth?.access_token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // For accessibility: close sidebar on section change (mobile)
  const handleSectionChange = (key) => {
    setActiveSection(key);
    setShowSideNav(false);
    // Map section keys to routes
    const routeMap = {
      dashboard: '/admin/dashboard',
      profile: '/admin/profile',
      users: '/admin/users',
      blogs: '/admin/blogs',
      newsletter: '/admin/newsletter',
      notifications: '/admin/notifications',
      comments: '/admin/comments',
      utilities: '/admin/utilities',
    };
    if (routeMap[key]) {
      navigate(routeMap[key]);
    }
  };

  return (
    <section className="relative flex flex-col md:flex-row gap-0 py-0 m-0 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
      {/* Spacer for navbar height */}
      <div className="h-10 w-full md:hidden" />
      {/* Mobile Header - Simple responsive header, now below navbar */}
      <div className="md:hidden bg-white dark:bg-gray-800 py-1 border-b border-grey dark:border-gray-700 flex flex-nowrap overflow-x-auto z-40 w-full transition-colors duration-300">
        {/* Menu Button (improved UI for visibility and accessibility) */}
        <button
          className="flex items-center justify-center w-11 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white mx-2 transition-colors duration-300"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => setShowSideNav(true)}
          aria-label="Open menu"
        >
          <svg className="w-7 h-7 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button ref={pageStateTab} className="p-5 capitalize font-bold text-gray-900 dark:text-white" tabIndex={-1}>
          {sections.find(s => s.key === activeSection)?.label || 'Admin'}
        </button>
        <div className="flex items-center gap-2 ml-auto mr-4">
          <ThemeToggle />
        </div>
        <hr ref={activeTabLine} className="absolute bottom-0 duration-500 border-gray-200 dark:border-gray-700" />
      </div>
      {/* Sidebar Navigation */}
      {/* Desktop Sidebar (always visible) */}
      <div className="hidden md:flex flex-col w-full md:w-[260px] min-w-0 md:min-w-[220px] max-w-full md:max-w-[320px] h-auto md:h-[calc(100vh-0px)] sticky top-0 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 shadow-sm dark:shadow-lg transition-colors duration-300">
        <div className="flex items-center justify-between px-4 md:px-8 pt-4 md:pt-8 mb-3">
          <h1 className="text-xl text-dark-grey dark:text-gray-200 font-gelasio">Admin Panel</h1>
          <ThemeToggle />
        </div>
        <hr className="border-grey dark:border-gray-700 -ml-2 md:-ml-6 mb-4 md:mb-8 mr-2 md:mr-6" />
        <nav className="flex-1 flex flex-col gap-2 py-4 md:py-8 px-2 md:px-4">
          {sections.map((section) => (
            <button
              key={section.key}
              className={`flex items-center w-full px-3 md:px-5 py-2 md:py-3 my-1 rounded-xl font-medium text-base md:text-lg transition-all duration-150 group relative
                ${activeSection === section.key
                  ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold shadow-md dark:shadow-lg border-l-4 border-black dark:border-purple'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'}
              `}
              onClick={() => handleSectionChange(section.key)}
              tabIndex={0}
              aria-current={activeSection === section.key ? 'page' : undefined}
            >
              <span className={`transition-colors duration-150 ${activeSection === section.key ? 'text-black dark:text-purple' : 'text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>{section.icon}</span>
              {section.label}
              {activeSection === section.key && (
                <span className="absolute left-0 top-0 h-full w-1 bg-black dark:bg-purple rounded-r-xl" />
              )}
            </button>
          ))}
        </nav>
        <div className="px-2 md:px-4 py-2">
          <LogoutButton />
        </div>
        <div className="mt-auto py-4 md:py-6 px-4 md:px-8 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} IslamicStories Admin</div>
      </div>
      {/* Mobile Sidebar (animated) */}
      <AnimatePresence>
        {showSideNav && (
          <>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-11/12 max-w-xs bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl z-40 overflow-y-auto p-0 flex flex-col md:hidden transition-colors duration-300"
              style={{ borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem' }}
            >
              <button
                className="absolute top-4 right-4 text-2xl text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white focus:outline-none"
                onClick={() => setShowSideNav(false)}
                aria-label="Close menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center justify-between px-4 pt-8 mb-3">
                <h1 className="text-xl text-dark-grey dark:text-gray-200 font-gelasio">Admin Panel</h1>
                <ThemeToggle />
              </div>
              <hr className="border-grey dark:border-gray-700 -ml-2 mb-4 mr-2" />
              <nav className="flex-1 flex flex-col gap-2 py-4 px-2">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    className={`flex items-center w-full px-3 py-2 my-1 rounded-xl font-medium text-base transition-all duration-150 group relative
                      ${activeSection === section.key
                        ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold shadow-md dark:shadow-lg border-l-4 border-black dark:border-purple'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'}
                    `}
                    onClick={() => handleSectionChange(section.key)}
                    tabIndex={0}
                    aria-current={activeSection === section.key ? 'page' : undefined}
                  >
                    <span className={`transition-colors duration-150 ${activeSection === section.key ? 'text-black dark:text-purple' : 'text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>{section.icon}</span>
                    {section.label}
                    {activeSection === section.key && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-black dark:bg-purple rounded-r-xl" />
                    )}
                  </button>
                ))}
              </nav>
              <div className="px-2 py-2">
                <LogoutButton />
              </div>
              <div className="mt-auto py-4 px-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} IslamicStories Admin</div>
            </motion.div>
            {/* Overlay for mobile sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
              onClick={() => setShowSideNav(false)}
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>
      {/* Main Content */}
      <main className="flex-1 w-full px-1 xs:px-2 sm:px-3 md:px-8 pt-4 md:pt-8 transition-all duration-300 min-h-screen mt-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-3xl md:rounded-tl-none shadow-inner dark:shadow-none overflow-x-auto">
        <Outlet />
      </main>
    </section>
  );
};

export default AdminPanel; 