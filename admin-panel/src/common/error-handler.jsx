import { toast } from 'react-hot-toast';

// Error types and their corresponding messages
const ERROR_MESSAGES = {
    // Authentication errors
    AUTH_REQUIRED: "Authentication required. Please log in again.",
    AUTH_EXPIRED: "Your session has expired. Please log in again.",
    AUTH_INVALID: "Invalid authentication. Please log in again.",
    
    // Authorization errors
    PERMISSION_DENIED: "You don't have permission to perform this action.",
    ADMIN_REQUIRED: "Admin privileges are required for this action.",
    
    // Network errors
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
    TIMEOUT_ERROR: "Request timed out. Please try again.",
    SERVER_ERROR: "Server error. Please try again later.",
    
    // Validation errors
    VALIDATION_ERROR: "Please check your input and try again.",
    INVALID_DATA: "Invalid data provided. Please check your input.",
    
    // File upload errors
    FILE_TOO_LARGE: "File size is too large. Please choose a smaller file.",
    INVALID_FILE_TYPE: "Invalid file type. Please choose a supported file format.",
    UPLOAD_FAILED: "File upload failed. Please try again.",
    
    // Blog related errors
    BLOG_NOT_FOUND: "Blog not found.",
    BLOG_SAVE_FAILED: "Failed to save blog. Please try again.",
    BLOG_PUBLISH_FAILED: "Failed to publish blog. Please try again.",
    DRAFT_SAVE_FAILED: "Failed to save draft. Please try again.",
    
    // Comment related errors
    COMMENT_FAILED: "Failed to post comment. Please try again.",
    COMMENT_DELETE_FAILED: "Failed to delete comment. Please try again.",
    
    // Profile related errors
    PROFILE_UPDATE_FAILED: "Failed to update profile. Please try again.",
    PASSWORD_CHANGE_FAILED: "Failed to change password. Please try again.",
    
    // Generic errors
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
    OPERATION_FAILED: "Operation failed. Please try again."
};

// HTTP status code to error message mapping
const STATUS_ERROR_MESSAGES = {
    400: ERROR_MESSAGES.VALIDATION_ERROR,
    401: ERROR_MESSAGES.AUTH_EXPIRED,
    403: ERROR_MESSAGES.PERMISSION_DENIED,
    404: ERROR_MESSAGES.BLOG_NOT_FOUND,
    408: ERROR_MESSAGES.TIMEOUT_ERROR,
    413: ERROR_MESSAGES.FILE_TOO_LARGE,
    415: ERROR_MESSAGES.INVALID_FILE_TYPE,
    500: ERROR_MESSAGES.SERVER_ERROR,
    502: ERROR_MESSAGES.SERVER_ERROR,
    503: ERROR_MESSAGES.SERVER_ERROR,
    504: ERROR_MESSAGES.TIMEOUT_ERROR
};

// Network error codes to error message mapping
const NETWORK_ERROR_MESSAGES = {
    'ECONNABORTED': ERROR_MESSAGES.TIMEOUT_ERROR,
    'ERR_NETWORK': ERROR_MESSAGES.NETWORK_ERROR,
    'ERR_BAD_REQUEST': ERROR_MESSAGES.VALIDATION_ERROR,
    'ERR_BAD_RESPONSE': ERROR_MESSAGES.SERVER_ERROR,
    'ERR_BAD_OPTION': ERROR_MESSAGES.UNKNOWN_ERROR
};

/**
 * Get appropriate error message based on error object
 * @param {Error|Object} error - The error object
 * @param {string} fallbackMessage - Fallback message if no specific error is found
 * @returns {string} The error message
 */
export const getErrorMessage = (error, fallbackMessage = ERROR_MESSAGES.UNKNOWN_ERROR) => {
    // If error is a string, return it directly
    if (typeof error === 'string') {
        return error;
    }
    
    // If error has a custom message property
    if (error?.message && typeof error.message === 'string') {
        return error.message;
    }
    
    // Check for HTTP status code
    if (error?.response?.status) {
        const statusMessage = STATUS_ERROR_MESSAGES[error.response.status];
        if (statusMessage) {
            return statusMessage;
        }
        
        // Check for server-provided error message
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
    }
    
    // Check for network error codes
    if (error?.code && NETWORK_ERROR_MESSAGES[error.code]) {
        return NETWORK_ERROR_MESSAGES[error.code];
    }
    
    // Check for axios error types
    if (error?.name === 'AxiosError') {
        if (error.code === 'ECONNABORTED') {
            return ERROR_MESSAGES.TIMEOUT_ERROR;
        }
        if (error.code === 'ERR_NETWORK') {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
    }
    
    // Return fallback message
    return fallbackMessage;
};

/**
 * Show error toast with appropriate message
 * @param {Error|Object|string} error - The error object or message
 * @param {string} fallbackMessage - Fallback message if no specific error is found
 * @param {Object} options - Toast options
 */
export const showErrorToast = (error, fallbackMessage = ERROR_MESSAGES.UNKNOWN_ERROR, options = {}) => {
    const message = getErrorMessage(error, fallbackMessage);
    toast.error(message, {
        duration: 4000,
        position: 'top-right',
        ...options
    });
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 */
export const showSuccessToast = (message, options = {}) => {
    toast.success(message, {
        duration: 3000,
        position: 'top-right',
        ...options
    });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Toast options
 */
export const showInfoToast = (message, options = {}) => {
    toast(message, {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
        ...options
    });
};

/**
 * Handle API errors consistently
 * @param {Error|Object} error - The error object
 * @param {string} context - Context of the operation (e.g., 'blog', 'profile', 'comment')
 * @param {Function} onError - Optional callback function to execute on error
 */
export const handleApiError = (error, context = 'general', onError = null) => {
    console.error(`${context} error:`, error);
    
    const message = getErrorMessage(error, ERROR_MESSAGES.OPERATION_FAILED);
    showErrorToast(message);
    
    if (onError && typeof onError === 'function') {
        onError(error);
    }
};

/**
 * Handle authentication errors specifically
 * @param {Error|Object} error - The error object
 * @param {Function} logoutCallback - Callback to execute on auth error
 */
export const handleAuthError = (error, logoutCallback = null) => {
    console.error('Authentication error:', error);
    
    if (error?.response?.status === 401) {
        showErrorToast(ERROR_MESSAGES.AUTH_EXPIRED);
        
        if (logoutCallback && typeof logoutCallback === 'function') {
            logoutCallback();
        }
    } else {
        showErrorToast(error, ERROR_MESSAGES.AUTH_INVALID);
    }
};

// Export error messages for direct use
export { ERROR_MESSAGES, STATUS_ERROR_MESSAGES, NETWORK_ERROR_MESSAGES }; 