import axios from 'axios';
import { logoutUser } from './auth';
import { handleAuthError, getErrorMessage } from './error-handler';
import csrfManager from './csrf';
import { refreshAccessToken } from './auth';

// Create axios instance with enhanced security config
const axiosInstance = axios.create({
    timeout: 60000, // Increased timeout
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true // Enable credentials for CORS
});

// Request interceptor to add auth token, CSRF token, and security headers
axiosInstance.interceptors.request.use(
    async (config) => {
        // Attach access_token from localStorage if present
        const stored = localStorage.getItem('userAuth');
        if (stored) {
            const user = JSON.parse(stored);
            if (user && user.access_token) {
                config.headers['Authorization'] = `Bearer ${user.access_token}`;
            }
        }
        // Security headers are handled by the server, not client-side
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor with enhanced error handling and token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        // Check if response contains CSRF token (from login/signup)
        if (response.data && response.data.csrfToken) {
            csrfManager.setCSRFToken(response.data.csrfToken);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response) {
            const { status } = error.response;
            
            // Handle CSRF token errors
            if (status === 403 && error.response.data?.error === 'CSRF token validation failed') {
                console.error('CSRF token validation failed');
                // Try to get a new CSRF token by making a GET request
                try {
                    await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/get-auth-cookie`, {
                        withCredentials: true
                    });
                    // Retry the original request
                    return axiosInstance(originalRequest);
                } catch (csrfError) {
                    console.error('Failed to refresh CSRF token:', csrfError);
                    return Promise.reject(new Error('Security validation failed. Please refresh the page and try again.'));
                }
            }
            
            // Handle authentication errors
            if (status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                    // Try to refresh token using cookies (handled by backend)
                    const newAccessToken = await refreshAccessToken();
                    if (newAccessToken) {
                        // Update localStorage and retry original request
                        if (stored) {
                            const user = JSON.parse(stored);
                            user.access_token = newAccessToken;
                            localStorage.setItem('userAuth', JSON.stringify(user));
                        }
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        return axiosInstance(originalRequest);
                    } else {
                        // If refresh fails, logout
                        logoutUser(() => {
                            window.location.href = '/login';
                        });
                        return Promise.reject(new Error('Session expired. Please log in again.'));
                    }
                } catch (refreshError) {
                    logoutUser(() => {
                        window.location.href = '/login';
                    });
                    return Promise.reject(new Error('Session expired. Please log in again.'));
                }
            }
            
            // Handle authorization errors
            if (status === 403) {
                return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
            }
            
            // Handle rate limiting
            if (status === 429) {
                return Promise.reject(new Error('Too many requests. Please wait a moment before trying again.'));
            }
            
            // Handle server errors
            if (status >= 500) {
                return Promise.reject(new Error('Server error. Please try again later.'));
            }
        }
        
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('Request timed out. Please check your connection and try again.'));
        }
        
        if (error.code === 'ERR_NETWORK') {
            return Promise.reject(new Error('Network error. Please check your connection and try again.'));
        }
        
        // Handle other errors
        return Promise.reject(error);
    }
);

// Set up global axios defaults with security
axios.defaults.timeout = 15000;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Apply the same interceptors to global axios
axios.interceptors.request.use(
    async (config) => {
        // Security headers are handled by the server, not client-side
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        // Check if response contains CSRF token
        if (response.data && response.data.csrfToken) {
            csrfManager.setCSRFToken(response.data.csrfToken);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response) {
            const { status } = error.response;
            
            // Handle CSRF token errors
            if (status === 403 && error.response.data?.error === 'CSRF token validation failed') {
                console.error('CSRF token validation failed');
                try {
                    await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/get-auth-cookie`, {
                        withCredentials: true
                    });
                    return axios(originalRequest);
                } catch (csrfError) {
                    console.error('Failed to refresh CSRF token:', csrfError);
                    return Promise.reject(new Error('Security validation failed. Please refresh the page and try again.'));
                }
            }
            
            // Handle authentication errors
            if (status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                // If refresh failed or no refresh token, logout user
                console.log('Authentication failed, logging out user');
                logoutUser(() => {
                    window.location.href = '/login';
                });
                
                return Promise.reject(new Error('Authentication failed. Please log in again.'));
            }
            
            // Handle other errors
            if (status === 403) {
                return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
            }
            
            if (status === 429) {
                return Promise.reject(new Error('Too many requests. Please wait a moment before trying again.'));
            }
            
            if (status >= 500) {
                return Promise.reject(new Error('Server error. Please try again later.'));
            }
        }
        
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('Request timed out. Please check your connection and try again.'));
        }
        
        if (error.code === 'ERR_NETWORK') {
            return Promise.reject(new Error('Network error. Please check your connection and try again.'));
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance; 