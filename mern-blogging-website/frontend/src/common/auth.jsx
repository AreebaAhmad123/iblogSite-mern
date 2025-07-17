import axios from 'axios';
import csrfManager from './csrf';

// Token validation function with enhanced security
export const validateToken = async (token) => {
    if (!token) return false;
    
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/api/validate-token`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );
        return response.status === 200;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
};

// Enhanced token refresh function
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) return null;
    
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/api/refresh-token`,
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
};

// Secure logout function
export const logoutUser = async (setUserAuth) => {
    try {
        // Clear secure cookies
        sessionStorage.clear();
        // Clear CSRF token
        csrfManager.clearCSRFToken();
        
        // Clear any pending requests
        axios.defaults.headers.common['Authorization'] = null;
        
        // Reset user auth state
        setUserAuth({ access_token: null });
        
        console.log('User logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error);
        // Fallback: clear sessionStorage
        sessionStorage.clear();
        setUserAuth({ access_token: null });
    }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
    try {
        return await secureStorage.isAuthenticated();
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
};

// Get current user data safely
export const getCurrentUser = async () => {
    try {
        return await secureStorage.getUserData();
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}; 