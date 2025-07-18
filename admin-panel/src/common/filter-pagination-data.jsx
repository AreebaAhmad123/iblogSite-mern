import axios from "./axios-config";
export const filterPaginationData = async ({
    create_new_arr = false,
    state,
    data,
    page,
    countRoute,
    data_to_send = {},
    user = null,
  }) => {
    try {
      console.log('filterPaginationData called with:', {
        create_new_arr,
        stateExists: !!state,
        dataLength: data?.length,
        page,
        countRoute,
        data_to_send
      });

      if (state !== null && !create_new_arr) {
        console.log('Appending to existing state');
        return {
          ...state,
          results: [...state.results, ...data],
          page: page,
          totalDocs: state.totalDocs
        };
      } else {
        console.log('Creating new state, fetching count from:', countRoute);
        const headers = {};
        if (user) {
          headers['Authorization'] = `Bearer ${user}`;
        }
        
        const { data: countData } = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + "/api" + countRoute,
          data_to_send,
          {
            headers,
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log('Count response:', countData);
        
        return {
          results: data || [],
          page: 1,
          totalDocs: countData.totalDocs || 0,
        };
      }
    } catch (err) {
      console.error('Error in filterPaginationData:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        response: err.response?.data
      });
      
      // Return a safe default state
      return {
        results: data || [],
        page: page || 1,
        totalDocs: 0,
      };
    }
  };

// Content validation utilities
export const validateBlogContent = (content) => {
  if (!content) return { isValid: false, error: "Content is required" };
  
  // Handle array format
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return { isValid: false, error: "Content array is empty" };
    }
    const firstContent = content[0];
    if (!firstContent.blocks || !Array.isArray(firstContent.blocks)) {
      return { isValid: false, error: "Invalid content structure" };
    }
    if (firstContent.blocks.length === 0) {
      return { isValid: false, error: "No content blocks found" };
    }
    return { isValid: true, blocks: firstContent.blocks };
  }
  
  // Handle object format
  if (typeof content === 'object') {
    if (!content.blocks || !Array.isArray(content.blocks)) {
      return { isValid: false, error: "Invalid content structure" };
    }
    if (content.blocks.length === 0) {
      return { isValid: false, error: "No content blocks found" };
    }
    return { isValid: true, blocks: content.blocks };
  }
  
  return { isValid: false, error: "Invalid content format" };
};

export const sanitizeBlogData = (blogData) => {
  const sanitized = { ...blogData };
  
  // Sanitize title
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim();
  }
  
  // Sanitize description
  if (sanitized.des) {
    sanitized.des = sanitized.des.trim();
  }
  
  // Sanitize tags
  if (sanitized.tags && Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags
  }
  
  // Sanitize banner
  if (sanitized.banner) {
    sanitized.banner = sanitized.banner.trim();
  }
  
  return sanitized;
};

export const validateBlogForPublishing = (blogData) => {
  const errors = [];
  
  if (!blogData.title?.trim()) {
    errors.push("Blog title is required");
  } else if (blogData.title.trim().length > 100) {
    errors.push("Title cannot exceed 100 characters");
  }
  
  if (!blogData.des?.trim()) {
    errors.push("Blog description is required");
  } else if (blogData.des.length > 200) {
    errors.push("Description cannot exceed 200 characters");
  }
  
  if (!blogData.banner?.trim()) {
    errors.push("Blog banner is required");
  }
  
  if (!blogData.tags?.length) {
    errors.push("At least one tag is required");
  }
  
  const contentValidation = validateBlogContent(blogData.content);
  if (!contentValidation.isValid) {
    errors.push(contentValidation.error);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBlogForDraft = (blogData) => {
  const hasTitle = blogData.title?.trim().length > 0;
  const hasDescription = blogData.des?.trim().length > 0;
  const contentValidation = validateBlogContent(blogData.content);
  const hasContent = contentValidation.isValid && contentValidation.blocks.length > 0;
  
  if (!hasTitle && !hasDescription && !hasContent) {
    return {
      isValid: false,
      error: "Please add some content (title, description, or blog content) before saving as draft"
    };
  }
  
  return { isValid: true };
};