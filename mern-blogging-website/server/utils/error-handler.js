// Error handling utilities for better server responses and retry mechanisms

// Error types for better categorization
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  DATABASE: 'DATABASE_ERROR',
  NETWORK: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

// Error codes for consistent error handling
export const ErrorCodes = {
  INVALID_BLOG_ID: 'INVALID_BLOG_ID',
  BLOG_NOT_FOUND: 'BLOG_NOT_FOUND',
  BLOG_ID_EXISTS: 'BLOG_ID_EXISTS',
  INVALID_CONTENT: 'INVALID_CONTENT',
  INVALID_TITLE: 'INVALID_TITLE',
  INVALID_DESCRIPTION: 'INVALID_DESCRIPTION',
  INVALID_TAGS: 'INVALID_TAGS',
  INVALID_BANNER: 'INVALID_BANNER',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  DATABASE_OPERATION: 'DATABASE_OPERATION',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER: 'INTERNAL_SERVER'
};

// User-friendly error messages
export const ErrorMessages = {
  [ErrorCodes.INVALID_BLOG_ID]: {
    message: 'Blog ID format is invalid',
    details: 'Blog ID must be 3-100 characters long and contain only lowercase letters, numbers, and hyphens.',
    suggestion: 'Please use a valid blog ID format (e.g., "my-blog-post-123")'
  },
  [ErrorCodes.BLOG_NOT_FOUND]: {
    message: 'Blog not found',
    details: 'The requested blog could not be found in our database.',
    suggestion: 'Please check the blog ID or try creating a new blog'
  },
  [ErrorCodes.BLOG_ID_EXISTS]: {
    message: 'Blog ID already exists',
    details: 'A blog with this ID already exists in our system.',
    suggestion: 'Please choose a different blog ID or use the existing blog'
  },
  [ErrorCodes.INVALID_CONTENT]: {
    message: 'Invalid blog content',
    details: 'The blog content structure is not valid.',
    suggestion: 'Please ensure your content is properly formatted'
  },
  [ErrorCodes.INVALID_TITLE]: {
    message: 'Invalid blog title',
    details: 'Blog title is required and must be between 1 and 200 characters.',
    suggestion: 'Please provide a valid title for your blog'
  },
  [ErrorCodes.INVALID_DESCRIPTION]: {
    message: 'Invalid blog description',
    details: 'Blog description must be between 1 and 200 characters.',
    suggestion: 'Please provide a description within the character limit'
  },
  [ErrorCodes.INVALID_TAGS]: {
    message: 'Invalid blog tags',
    details: 'Tags must be an array of non-empty strings, maximum 10 tags allowed.',
    suggestion: 'Please provide valid tags for your blog'
  },
  [ErrorCodes.INVALID_BANNER]: {
    message: 'Invalid blog banner',
    details: 'Blog banner is required for published blogs.',
    suggestion: 'Please upload a banner image for your blog'
  },
  [ErrorCodes.UNAUTHORIZED_ACCESS]: {
    message: 'Authentication required',
    details: 'You must be logged in to perform this action.',
    suggestion: 'Please log in and try again'
  },
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: {
    message: 'Insufficient permissions',
    details: 'You do not have the required permissions to perform this action.',
    suggestion: 'Please contact an administrator if you believe this is an error'
  },
  [ErrorCodes.DATABASE_CONNECTION]: {
    message: 'Database connection error',
    details: 'Unable to connect to the database.',
    suggestion: 'Please try again in a few moments'
  },
  [ErrorCodes.DATABASE_OPERATION]: {
    message: 'Database operation failed',
    details: 'An error occurred while processing your request.',
    suggestion: 'Please try again or contact support if the problem persists'
  },
  [ErrorCodes.NETWORK_TIMEOUT]: {
    message: 'Request timeout',
    details: 'The request took too long to process.',
    suggestion: 'Please try again with a smaller request or contact support'
  },
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded',
    details: 'You have made too many requests in a short time.',
    suggestion: 'Please wait a moment before trying again'
  },
  [ErrorCodes.INTERNAL_SERVER]: {
    message: 'Internal server error',
    details: 'An unexpected error occurred on our servers.',
    suggestion: 'Please try again later or contact support if the problem persists'
  }
};

// Custom error class with enhanced information
export class AppError extends Error {
  constructor(code, type, message, details = null, suggestion = null, statusCode = 500) {
    super(message || ErrorMessages[code]?.message || 'An error occurred');
    this.code = code;
    this.type = type;
    this.details = details || ErrorMessages[code]?.details;
    this.suggestion = suggestion || ErrorMessages[code]?.suggestion;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.requestId = null; // Will be set by middleware
  }
}

// Create specific error instances
export const createError = {
  validation: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.VALIDATION, null, details, suggestion, 400),
  
  authentication: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.AUTHENTICATION, null, details, suggestion, 401),
  
  authorization: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.AUTHORIZATION, null, details, suggestion, 403),
  
  notFound: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.NOT_FOUND, null, details, suggestion, 404),
  
  conflict: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.CONFLICT, null, details, suggestion, 409),
  
  database: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.DATABASE, null, details, suggestion, 500),
  
  network: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.NETWORK, null, details, suggestion, 503),
  
  rateLimit: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.RATE_LIMIT, null, details, suggestion, 429),
  
  internal: (code, details = null, suggestion = null) => 
    new AppError(code, ErrorTypes.INTERNAL, null, details, suggestion, 500)
};

// Retry mechanism configuration
export const RetryConfig = {
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_RETRY_DELAY: 1000, // 1 second
  EXPONENTIAL_BACKOFF: true,
  MAX_RETRY_DELAY: 10000, // 10 seconds
  RETRYABLE_ERRORS: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'MongoNetworkError',
    'MongoTimeoutError'
  ]
};

// Retry mechanism for failed operations
export const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = RetryConfig.DEFAULT_MAX_RETRIES,
    retryDelay = RetryConfig.DEFAULT_RETRY_DELAY,
    exponentialBackoff = RetryConfig.EXPONENTIAL_BACKOFF,
    maxRetryDelay = RetryConfig.MAX_RETRY_DELAY,
    retryableErrors = RetryConfig.RETRYABLE_ERRORS,
    onRetry = null
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if this is the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(retryableError => 
        error.code === retryableError || 
        error.name === retryableError ||
        error.message.includes(retryableError)
      );
      
      if (!isRetryable) {
        break;
      }
      
      // Calculate delay for next retry
      let delay = retryDelay;
      if (exponentialBackoff) {
        delay = Math.min(retryDelay * Math.pow(2, attempt), maxRetryDelay);
      }
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Enhanced error response formatter
export const formatErrorResponse = (error, requestId = null) => {
  const isAppError = error instanceof AppError;
  
  const response = {
    success: false,
    error: {
      code: isAppError ? error.code : ErrorCodes.INTERNAL_SERVER,
      type: isAppError ? error.type : ErrorTypes.INTERNAL,
      message: isAppError ? error.message : 'An unexpected error occurred',
      details: isAppError ? error.details : null,
      suggestion: isAppError ? error.suggestion : null,
      timestamp: isAppError ? error.timestamp : new Date().toISOString()
    }
  };
  
  if (requestId) {
    response.error.requestId = requestId;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }
  
  return response;
};

// Database operation wrapper with retry
export const withDatabaseRetry = async (operation, options = {}) => {
  return withRetry(operation, {
    ...options,
    retryableErrors: [
      'MongoNetworkError',
      'MongoTimeoutError',
      'MongoServerSelectionError',
      'MongoNotConnectedError'
    ],
    onRetry: (error, attempt, delay) => {
      console.warn(`Database operation failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
    }
  });
};

// Network operation wrapper with retry
export const withNetworkRetry = async (operation, options = {}) => {
  return withRetry(operation, {
    ...options,
    retryableErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ENETUNREACH'
    ],
    onRetry: (error, attempt, delay) => {
      console.warn(`Network operation failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
    }
  });
};

// Validation helper
export const validateBlogId = (blogId) => {
  if (!blogId || typeof blogId !== 'string') {
    return { isValid: false, error: createError.validation(ErrorCodes.INVALID_BLOG_ID) };
  }
  
  const blogIdRegex = /^[a-z0-9-]+$/;
  if (!blogIdRegex.test(blogId) || blogId.length < 3 || blogId.length > 100) {
    return { 
      isValid: false, 
      error: createError.validation(
        ErrorCodes.INVALID_BLOG_ID,
        `Blog ID "${blogId}" does not meet the required format`,
        'Please use only lowercase letters, numbers, and hyphens (3-100 characters)'
      )
    };
  }
  
  return { isValid: true };
};

// Content validation helper
export const validateContent = (content) => {
  if (!content) {
    return { isValid: false, error: createError.validation(ErrorCodes.INVALID_CONTENT) };
  }
  
  if (Array.isArray(content)) {
    if (content.length === 0) return { isValid: true };
    const isValid = content.every(item => 
      item && 
      typeof item === 'object' && 
      Array.isArray(item.blocks)
    );
    if (!isValid) {
      return { 
        isValid: false, 
        error: createError.validation(
          ErrorCodes.INVALID_CONTENT,
          'Content array contains invalid items',
          'Each content item must have a valid blocks array'
        )
      };
    }
  } else if (content.blocks && Array.isArray(content.blocks)) {
    return { isValid: true };
  } else {
    return { 
      isValid: false, 
      error: createError.validation(
        ErrorCodes.INVALID_CONTENT,
        'Content must be an array or have a blocks property',
        'Please ensure your content is properly formatted'
      )
    };
  }
  
  return { isValid: true };
}; 