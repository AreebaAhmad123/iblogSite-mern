import { useContext } from 'react';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LogoutButton = () => {
  const { setUserAuth } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user auth
    setUserAuth(null);
    // Clear localStorage
    localStorage.removeItem('userAuth');
    // Show success message
    toast.success('Logged out successfully');
    // Redirect to login
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  );
};

export default LogoutButton; 