// Enhanced image upload functionality with better error handling and validation

import axios from "axios";

// Allowed image types and max size (5MB)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadImage = async (img, access_token) => {
  let imgUrl = null;

  // 1. File type and size validation
  if (!ALLOWED_TYPES.includes(img.type)) {
    throw new Error("Only JPG, JPEG, PNG, and WebP files are allowed.");
  }
  if (img.size > MAX_SIZE) {
    throw new Error("Image size must be less than 5MB.");
  }

  // 2. Additional validation
  if (!img.name || img.name.trim() === '') {
    throw new Error("Invalid file name.");
  }

  try {
    // Convert image to base64
    const base64 = await convertToBase64(img);
    
    const response = await axios.post(
      import.meta.env.VITE_SERVER_DOMAIN + "/api/upload-image", 
      { 
        image: base64,
        fileName: img.name,
        fileSize: img.size,
        fileType: img.type
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        timeout: 90000 // 90 second timeout for uploads (increased from 30s)
      }
    );

    if (response.data.success) {
      imgUrl = response.data.url;
    } else {
      throw new Error(response.data.error || "Image upload failed.");
    }
  } catch (error) {
    // Enhanced error handling with specific messages
    let message = "Image upload failed.";
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        message = "Authentication required. Please log in again.";
      } else if (error.response.status === 403) {
        message = "You don't have permission to upload images.";
      } else if (error.response.status === 413) {
        message = "Image file is too large.";
      } else if (error.response.status === 415) {
        message = "Unsupported image format.";
      } else if (error.response.status === 500) {
        message = "Server error. Please try again later.";
      } else if (error.response.data?.error) {
        message = error.response.data.error;
      } else {
        message = `Upload failed (${error.response.status}). Please try again.`;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = "Upload timed out. Please check your connection and try again.";
    } else if (error.message) {
      message = error.message;
    }
    
    throw new Error(message);
  }

  return imgUrl;
}

// Helper function to convert file to base64 with progress tracking
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result === 'string' && result.startsWith('data:')) {
          resolve(result);
        } else {
          reject(new Error("Failed to convert file to base64."));
        }
      } catch (error) {
        reject(new Error("File conversion failed."));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };
    
    reader.onabort = () => {
      reject(new Error("File reading was aborted."));
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error("Failed to start file reading."));
    }
  });
}

// Utility function to validate image dimensions (optional)
export const validateImageDimensions = (file, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > maxWidth || img.height > maxHeight) {
        reject(new Error(`Image dimensions must be ${maxWidth}x${maxHeight} or smaller.`));
      } else {
        resolve(true);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for validation."));
    };
    
    img.src = url;
  });
} 