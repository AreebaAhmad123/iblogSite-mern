import axios from '../common/axios-config';

const API_BASE_URL = import.meta.env.VITE_SERVER_DOMAIN + '/api';

// Blog API services
export const blogAPI = {
  // Get blogs with pagination
  getBlogs: async (page = 1, limit = 10) => {
    const response = await axios.post(`${API_BASE_URL}/latest-blogs`, { page, limit });
    return response.data;
  },

  // Get single blog by ID
  getBlogById: async (blogId) => {
    const response = await axios.get(`${API_BASE_URL}/get-blog/${blogId}`);
    return response.data;
  },

  // Create new blog
  createBlog: async (blogData) => {
    const response = await axios.post(`${API_BASE_URL}/create-blog`, blogData);
    return response.data;
  },

  // Update blog
  updateBlog: async (blogId, blogData) => {
    const response = await axios.put(`${API_BASE_URL}/update-blog/${blogId}`, blogData);
    return response.data;
  },

  // Delete blog
  deleteBlog: async (blogId) => {
    const response = await axios.post(`${API_BASE_URL}/delete-blog`, { blogId });
    return response.data;
  },

  // Like/unlike blog
  toggleLike: async (blogId) => {
    const response = await axios.post(`${API_BASE_URL}/like-blog`, { blog_id: blogId });
    return response.data;
  },

  // Bookmark/unbookmark blog
  toggleBookmark: async (blogId, isBookmarked) => {
    const endpoint = isBookmarked ? '/unbookmark-blog' : '/bookmark-blog';
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, { blog_id: blogId });
    return response.data;
  },

  // Search blogs
  searchBlogs: async (query, page = 1) => {
    const response = await axios.post(`${API_BASE_URL}/search-blogs`, { query, page });
    return response.data;
  },

  // Get blogs by category
  getBlogsByCategory: async (category, page = 1) => {
    const response = await axios.post(`${API_BASE_URL}/get-blogs-by-category`, { category, page });
    return response.data;
  },

  // Get user's blogs
  getUserBlogs: async (username, page = 1) => {
    const response = await axios.post(`${API_BASE_URL}/get-profile-blogs`, { username, page });
    return response.data;
  },

  // Get trending blogs
  getTrendingBlogs: async (limit = 10) => {
    const response = await axios.get(`${API_BASE_URL}/trending-blogs?limit=${limit}`);
    return response.data;
  }
};

// User API services
export const userAPI = {
  // Register user
  register: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/signup`, userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async (username) => {
    const response = await axios.post(`${API_BASE_URL}/get-profile`, { username });
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await axios.put(`${API_BASE_URL}/update-profile`, profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await axios.put(`${API_BASE_URL}/change-password`, passwordData);
    return response.data;
  },

  // Validate token
  validateToken: async () => {
    const response = await axios.post(`${API_BASE_URL}/validate-token`);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_BASE_URL}/refresh-token`, { refreshToken });
    return response.data;
  }
};

// Comment API services
export const commentAPI = {
  // Get comments for a blog
  getComments: async (blogId, page = 1) => {
    const response = await axios.post(`${API_BASE_URL}/get-blog-comments`, { blog_id: blogId, page });
    return response.data;
  },

  // Add comment
  addComment: async (commentData) => {
    const response = await axios.post(`${API_BASE_URL}/add-comment`, commentData);
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await axios.delete(`${API_BASE_URL}/delete-comment/${commentId}`);
    return response.data;
  }
};

// Notification API services
export const notificationAPI = {
  // Get user notifications
  getNotifications: async (page = 1) => {
    const response = await axios.post(`${API_BASE_URL}/get-notifications`, { page });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await axios.put(`${API_BASE_URL}/mark-notification-read/${notificationId}`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axios.put(`${API_BASE_URL}/mark-all-notifications-read`);
    return response.data;
  }
};

// Category API services
export const categoryAPI = {
  // Get all categories
  getCategories: async () => {
    const response = await axios.get(`${API_BASE_URL}/get-categories`);
    return response.data;
  },

  // Get category details
  getCategoryDetails: async (categoryName) => {
    const response = await axios.post(`${API_BASE_URL}/get-category-details`, { category: categoryName });
    return response.data;
  }
};

// File upload API services
export const uploadAPI = {
  // Upload image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_BASE_URL}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload banner
  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    
    const response = await axios.post(`${API_BASE_URL}/upload-banner`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Newsletter API services
export const newsletterAPI = {
  // Subscribe to newsletter
  subscribe: async (email, recaptchaToken) => {
    const response = await axios.post(`${API_BASE_URL}/subscribe-newsletter`, { email, recaptchaToken });
    return response.data;
  },

  // Verify newsletter subscription
  verifySubscription: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/verify-newsletter?token=${token}`);
    return response.data;
  },

  // Unsubscribe from newsletter
  unsubscribe: async (token) => {
    const response = await axios.post(`${API_BASE_URL}/unsubscribe`, { token });
    return response.data;
  }
};

// Contact API services
export const contactAPI = {
  // Send contact message
  sendMessage: async (messageData) => {
    const response = await axios.post(`${API_BASE_URL}/contact`, messageData);
    return response.data;
  }
};

// Export all API services
export default {
  blog: blogAPI,
  user: userAPI,
  comment: commentAPI,
  notification: notificationAPI,
  category: categoryAPI,
  upload: uploadAPI,
  newsletter: newsletterAPI,
  contact: contactAPI
}; 