import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import "./common/axios-config"; // Initialize axios interceptors
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "./common/axios-config";
import AdminPanel from "./pages/admin.page.jsx";
import UserAuthForm from "./pages/userAuthForm.page.jsx";
import UserManagement from './admin/UserManagement/index.jsx';
import BlogManagement from './admin/BlogManagement';
import AdminUtilities from './admin/AdminUtilities.jsx';
import AdminNotifications from './admin/AdminNotifications.jsx';
import AdminComments from './admin/AdminComments.jsx';
import NewsletterManagement from './admin/NewsletterManagement.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import ProfilePage from './pages/profile.page.jsx';
import EditorPage from './pages/editor.page.jsx';

export const UserContext = createContext({});
export const ThemeContext = createContext({});
const darkThemePreference = window.matchMedia("(prefers-color-scheme: dark)").matches;

const App = () => {
  const getInitialUserAuth = () => {
    try {
      const stored = localStorage.getItem('userAuth');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Normalize admin property
        if (parsed && typeof parsed === 'object') {
          if (parsed.admin !== undefined && parsed.isAdmin === undefined) {
            parsed.isAdmin = parsed.admin;
          }
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };
  const [userAuth, setUserAuthState] = useState(getInitialUserAuth);
  const setUserAuth = (user) => {
    console.log("setUserAuth called with:", user);
    if (user && typeof user === 'object') {
      // Normalize admin property
      if (user.admin !== undefined && user.isAdmin === undefined) {
        user.isAdmin = user.admin;
      }
    }
    setUserAuthState(user);
    if (user && user.access_token) {
      localStorage.setItem('userAuth', JSON.stringify(user));
    } else {
      localStorage.removeItem('userAuth');
    }
  };
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme) {
      return savedTheme;
    }
    return darkThemePreference ? "dark" : "light";
  });

  useEffect(() => {
    let themeInSession = lookInSession("theme");
    
    if (themeInSession) {
      setTheme(() => {
        document.body.setAttribute("data-theme", themeInSession)
        return themeInSession
      })
    }
    else {
      document.body.setAttribute("data-theme", theme);
    }
  }, [])

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    console.log("App.jsx: userAuth value:", userAuth);
  }, [userAuth]);

  useEffect(() => {
    console.log("Server Domain:", import.meta.env.VITE_SERVER_DOMAIN);
  }, []);

  useEffect(() => {
    // Always sync userAuth from localStorage on mount
    const stored = localStorage.getItem('userAuth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.access_token) {
        setUserAuthState(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (userAuth && userAuth.access_token) {
      localStorage.setItem('userAuth', JSON.stringify(userAuth));
    }
  }, [userAuth]);

  useEffect(() => {
    if (!userAuth?.access_token) return;
    const checkNotifications = async () => {
      try {
        const { data } = await axios.get(
          import.meta.env.VITE_SERVER_DOMAIN + "/api/new-notification",
          {
            headers: { Authorization: `Bearer ${userAuth.access_token}` }
          }
        );
        if (data?.new_notification_available !== undefined) {
          setUserAuth({
            ...userAuth,
            new_notification_available: data.new_notification_available
          });
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    checkNotifications();
  }, [userAuth?.access_token]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<UserAuthForm />} />
          <Route path="/admin" element={<AdminPanel />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="blogs" element={<BlogManagement />} />
            <Route path="newsletter" element={<NewsletterManagement />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="utilities" element={<AdminUtilities />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="editor/:blog_id" element={<EditorPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App; 