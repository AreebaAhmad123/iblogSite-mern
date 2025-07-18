import { useNavigate, useParams } from "react-router-dom";
import defaultBanner from "../imgs/blog banner.png";
import AnimationWrapper from "../common/page-animation.jsx";
import EditorJS from "@editorjs/editorjs";
import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import { tools } from "./tools.component.jsx";
import { EditorContext } from "../pages/editor.page.jsx";
import axios from '../common/axios-config';
import { lookInSession } from "../common/session";
import { UserContext } from "../App";
import { uploadImage } from "../common/cloudinary";

// Debug EditorJS import
console.log("EditorJS import check:", {
  EditorJS: typeof EditorJS,
  isFunction: typeof EditorJS === 'function',
  isConstructor: EditorJS && EditorJS.prototype && EditorJS.prototype.constructor === EditorJS
});

// Helper function to validate blog_id
const isValidBlogId = id => /^[a-z0-9-]{3,100}$/.test(id);

function scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave) {
  // Clear any existing timeout
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }
  // Schedule auto-save after 30 seconds of inactivity
  autoSaveTimeoutRef.current = setTimeout(() => {
    debouncedAutoSave();
  }, 30000); // 30 seconds
}

const BlogEditor = () => {
  const { blog, setBlog, setEditorState } = useContext(EditorContext);
  const { userAuth = {} } = useContext(UserContext);
  const [title, setTitle] = useState("");
  const [banner, setBanner] = useState("");
  const [des, setDes] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [saveError, setSaveError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [localStateInitialized, setLocalStateInitialized] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const editorRef = useRef(null);
  const textEditorRef = useRef(null);
  const navigate = useNavigate();
  const { blogId } = useParams();
  const access_token = userAuth.access_token || null;
  const [authChecked, setAuthChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // Helper function to get the correct blog ID
  const getBlogId = () => {
    return blog?.blog_id || blogId || null;
  };

  // Helper function to normalize content structure
  const normalizeContent = (content) => {
    if (!content) {
      return [{ time: Date.now(), blocks: [], version: '2.27.2' }];
    }
    
    if (Array.isArray(content)) {
      return content.map(item => ({
        time: item?.time || Date.now(),
        blocks: Array.isArray(item?.blocks) ? item.blocks : [],
        version: item?.version || '2.27.2'
      }));
    }
    
    if (typeof content === 'object' && content !== null) {
      return [{
        time: content.time || Date.now(),
        blocks: Array.isArray(content.blocks) ? content.blocks : [],
        version: content.version || '2.27.2'
      }];
    }
    
    return [{ time: Date.now(), blocks: [], version: '2.27.2' }];
  };

  // Helper function to manage session storage
  const clearSessionDraft = () => {
    sessionStorage.removeItem("blog_draft");
  };

  const saveToSessionDraft = (blogData) => {
    try {
      sessionStorage.setItem("blog_draft", JSON.stringify(blogData));
    } catch (error) {
      console.warn("Failed to save to sessionStorage:", error);
      toast.error("Draft backup failed: browser storage is full or unavailable.");
    }
  };

  // Auth check and show toast before navigating
  useEffect(() => {
    if (!access_token) {
      toast.error("Authentication required. Please log in.");
      setTimeout(() => navigate("/login"), 1000);
    } else {
      setAuthChecked(true);
    }
  }, [access_token, navigate]);

  // Check if we're in edit mode
  useEffect(() => {
    if (blogId) {
      setIsEditing(true);
    }
  }, [blogId]);

  // Refactored local state initialization from context
  useEffect(() => {
    if (blog && !hasUserEdited) {
      setTitle(blog.title || "");
      setBanner(blog.banner || "");
      setDes(blog.des || "");
      setTags(blog.tags || []);
      setLocalStateInitialized(true);
    }
  }, [blog, hasUserEdited]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(async () => {
    if (!authChecked || isSaving || isAutoSaving) return;
    setAutoSaveStatus('saving');
    setSaveError(null);
    setIsAutoSaving(true);
    try {
      let content = null;
      if (editorRef.current?.isReady) {
        try {
          content = await editorRef.current.save();
        } catch (editorError) {
          console.warn("Auto-save: Editor save failed:", editorError);
          setAutoSaveStatus('error');
          setSaveError("Editor not ready");
          setIsAutoSaving(false);
          return;
        }
      } else {
        setAutoSaveStatus('error');
        setSaveError("Editor not ready");
        setIsAutoSaving(false);
        return;
      }
      // Validate content before sending
      if (!content || !content.blocks) {
        console.warn("Auto-save: Invalid content structure");
        setAutoSaveStatus('error');
        setSaveError("Invalid content structure");
        setIsAutoSaving(false);
        return;
      }
      // Get current values from state (not closure)
      const currentTitle = title;
      const currentBanner = banner;
      const currentDes = des;
      const currentTags = tags;
      // Only auto-save if there's actual content
      const hasContent = currentTitle.trim() || currentDes.trim() || (content.blocks && content.blocks.length > 0);
      if (!hasContent) {
        setAutoSaveStatus('idle');
        setIsAutoSaving(false);
        return;
      }
      const blogObj = {
        title: currentTitle.trim() || "Untitled Draft",
        banner: currentBanner.trim() || "",
        des: currentDes.trim() || "",
        content: normalizeContent(content),
        tags: currentTags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
        draft: true
      };
      // If we have a blog_id, update; otherwise, create
      const isUpdate = !!getBlogId();
      const url = isUpdate
        ? `${import.meta.env.VITE_SERVER_DOMAIN}/api/update-blog/${getBlogId()}`
        : `${import.meta.env.VITE_SERVER_DOMAIN}/api/create-blog`;
      const method = isUpdate ? 'put' : 'post';
      const response = await axios[method](
        url,
        blogObj,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      // If this was a new blog, update context with new blog_id
      if (!isUpdate && response.data.blog_id) {
        setBlog(prev => ({
          ...prev,
          blog_id: response.data.blog_id,
          content: blogObj.content
        }));
      }
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      setSaveError(null);
      setIsAutoSaving(false);
      // Reset status after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.warn("Auto-save failed:", error);
      setAutoSaveStatus('error');
      let errorMessage = "Auto-save failed";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired";
      } else if (error.response?.status === 403) {
        errorMessage = "Permission denied";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setSaveError(errorMessage);
      // Reset error status after 5 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
        setSaveError(null);
        setIsAutoSaving(false);
      }, 5000);
    }
  }, [authChecked, blog?.blog_id, access_token, isSaving, isAutoSaving, title, banner, des, tags, setBlog]);

  // Replace the EditorJS initialization useEffect with a new one that re-initializes on blog.content change

  useEffect(() => {
    if (!authChecked) return;
    if (!textEditorRef.current) return;
    if (!blog?.content?.[0]) return; // Wait for blog content

    // Clean up any existing editor instance
    if (editorRef.current) {
      try {
        if (editorRef.current.isReady && typeof editorRef.current.isReady.then === 'function') {
          editorRef.current.isReady.then(() => editorRef.current.destroy()).catch(() => {});
        } else if (typeof editorRef.current.destroy === 'function') {
          editorRef.current.destroy();
        }
      } catch (cleanupErr) {
        console.warn('Error during EditorJS destroy:', cleanupErr);
      } finally {
        editorRef.current = null;
        setEditorReady(false);
        setContentLoaded(false);
      }
    }
    // Always clear the editor holder DOM node before creating a new EditorJS instance
    if (textEditorRef.current) {
      textEditorRef.current.innerHTML = '';
    }

    const editorData = blog.content[0] || {
      time: Date.now(),
      blocks: [],
      version: '2.27.2'
    };

    try {
      const editor = new EditorJS({
        holder: textEditorRef.current,
        data: editorData,
        tools: tools,
        placeholder: "Start writing your story here...",
        autofocus: true,
        readOnly: false,
        logLevel: "ERROR",
        onChange: async () => {
          try {
            if (editor.isReady) {
              const data = await editor.save();
              // Save to sessionStorage for immediate backup
              const blogData = {
                ...blog,
                title,
                banner,
                content: [{
                  ...data,
                  time: Date.now(),
                  version: '2.27.2'
                }],
                tags,
                des
              };
              saveToSessionDraft(blogData);
              scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
            }
          } catch (error) {
            console.warn("Failed to save to sessionStorage:", error);
          }
        },
        onReady: () => {
          setEditorReady(true);
          setContentLoaded(true);
          console.log("Editor is ready");
        }
      });
      editorRef.current = editor;
      console.log("EditorJS instance created successfully");
    } catch (error) {
      console.error("EditorJS initialization failed:", error);
      toast.error("Failed to initialize editor. Please refresh the page or check your internet connection. If the problem persists, contact support.");
    }

    return () => {
      if (editorRef.current) {
        try {
          if (editorRef.current.isReady && typeof editorRef.current.isReady.then === 'function') {
            editorRef.current.isReady.then(() => editorRef.current.destroy()).catch(() => {});
          } else if (typeof editorRef.current.destroy === 'function') {
            editorRef.current.destroy();
          }
        } catch (cleanupErr) {
          console.warn('Error during EditorJS destroy (unmount):', cleanupErr);
        } finally {
          editorRef.current = null;
          setEditorReady(false);
          setContentLoaded(false);
        }
      }
    };
  }, [authChecked, blog?.content, textEditorRef.current]);

  // Update editor data if blog.content changes (but don't re-create instance)
  useEffect(() => {
    if (editorRef.current && blog?.content?.[0] && editorReady && !contentLoaded) {
      // Only handle content updates if content hasn't been loaded yet
      // This prevents the render error and handles initial content loading properly
      console.log("Content updated - EditorJS content handled during initialization");
    }
  }, [blog?.content, editorReady, contentLoaded]);

  // Test upload service function
  const testUploadService = async () => {
    try {
      console.log("Testing upload service...");
      const response = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/test-upload`);
      console.log("Upload service test result:", response.data);
      return response.data.success;
    } catch (error) {
      console.error("Upload service test failed:", error);
      return false;
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG files are allowed");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    let loadingToast = toast.loading("Uploading banner image...");

    try {
      // Test upload service first
      const serviceWorking = await testUploadService();
      if (!serviceWorking) {
        throw new Error("Upload service is not available");
      }

      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log("Starting upload, file size:", file.size, "bytes");

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/upload-image`,
        { image: base64 },
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90 second timeout for image upload (increased from 30s)
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success === true) {
        const secureUrl = response.data.url;
        console.log("Banner uploaded successfully:", secureUrl);
        setBanner(secureUrl);
        setHasUserEdited(true);
        // Update blog context but preserve other local state
        setBlog(prev => ({ ...prev, banner: secureUrl }));
        toast.success("Banner uploaded successfully! 🎉");
        scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
      } else {
        toast.error("Failed to upload banner image");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Banner upload error:", error);
      
      let errorMessage = "Failed to upload banner image. Please check your internet connection or try a different image.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please log in again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || "Invalid image format";
      } else if (error.response?.status === 408) {
        errorMessage = "Upload timed out. Please try again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Upload timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Add auto-save scheduling to all user input handlers
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUserEdited(true);
    scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
  };

  const handleDescriptionChange = (e) => {
    setDes(e.target.value);
    setHasUserEdited(true);
    scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
    scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
  };

  const normalizeTag = tag => tag.trim().toLowerCase();

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (tags.length >= 5) {
        toast.error("Maximum 5 tags allowed");
        return;
      }
      const newTag = normalizeTag(tagInput);
      if (!tags.map(normalizeTag).includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        setTagInput("");
        scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
      } else {
        toast.error("Duplicate tag");
      }
    }
  };

  const removeTag = (tag) => {
    const normalizedTag = normalizeTag(tag);
    const newTags = tags.filter((t) => normalizeTag(t) !== normalizedTag);
    setTags(newTags);
    scheduleAutoSave(autoSaveTimeoutRef, debouncedAutoSave);
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  const handleError = (e) => {
    e.target.src = defaultBanner;
  };

  const handleSaveDraft = async (e) => {
    if (isSaving) return;
    
    // Validate blog_id if present
    const blogIdToCheck = getBlogId();
    if (blogIdToCheck && !isValidBlogId(blogIdToCheck)) {
      toast.error("Draft has an invalid blog ID. Please start a new draft.");
      clearSessionDraft();
      navigate("/admin/editor");
      return;
    }

    // Validate minimum content requirements
    const hasTitle = title.trim().length > 0;
    const hasDescription = des.trim().length > 0;
    let hasContent = false;
    if (editorRef.current?.isReady) {
      hasContent = await editorRef.current.save().then(data => data.blocks && data.blocks.length > 0).catch(() => false);
    }
    if (!editorRef.current?.isReady && !hasTitle && !hasDescription) {
      return toast.error("Editor is not ready. Please wait for the editor to load before saving.");
    }
    if (!hasTitle && !hasDescription && !hasContent) {
      return toast.error("Please add some content (title, description, or blog content) before saving as draft");
    }
    
    setIsSaving(true);
    let loadingToast = toast.loading(isEditing ? "Updating draft...." : "Saving draft....");
    
    try {
      // Get editor content if editor is ready
      let content = null;
      if (editorRef.current?.isReady) {
        try {
          content = await editorRef.current.save();
          // Validate content structure
          if (!content || !content.blocks) {
            content = { time: Date.now(), blocks: [], version: '2.27.2' };
          }
        } catch (editorError) {
          console.warn("Editor save failed, continuing with empty content:", editorError);
          content = { time: Date.now(), blocks: [], version: '2.27.2' };
        }
      } else {
        // If editor not ready, do not save empty content
        toast.error("Editor is not ready. Please wait for the editor to load before saving.");
        setIsSaving(false);
        return;
      }

      // Ensure content is a single block, not an array of blocks
      const contentBlock = Array.isArray(content) ? (content[0] || { time: Date.now(), blocks: [], version: '2.27.2' }) : content;

      const blogObj = {
        title: title.trim() || "Untitled Draft",
        banner: banner.trim() || "",
        des: des.trim() || "",
        content: [contentBlock],
        tags: tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
        draft: true
      };

      // Use different endpoints for new vs existing blogs
      const isUpdate = isEditing && getBlogId();
      const url = isUpdate 
        ? `${import.meta.env.VITE_SERVER_DOMAIN}/api/update-blog/${getBlogId()}`
        : `${import.meta.env.VITE_SERVER_DOMAIN}/api/create-blog`;
      const method = isUpdate ? 'put' : 'post';
      const response = await axios[method](
        url,
        blogObj,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout for manual saves
        }
      );

      toast.dismiss(loadingToast);
      toast.success(isEditing ? "Draft updated successfully! 👍" : "Draft saved successfully! 👍");
      
      // Update the blog context with the saved draft data (but preserve local state)
      if (response.data.blog_id) {
        setBlog(prev => ({
          ...prev,
          blog_id: response.data.blog_id,
          // Don't update title, banner, des, tags from blogObj to preserve user input
          content: blogObj.content
        }));
      }
      
      // Update save status
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      setSaveError(null);
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
      
      // Clear session storage draft since it's now saved to database
      clearSessionDraft();
      
      setTimeout(() => {
        navigate("/dashboard/blogs?tab=draft");
      }, 500);
    } catch (error) {
      toast.dismiss(loadingToast);
      
      let errorMessage = isEditing ? "Failed to update draft" : "Failed to save draft";
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save drafts.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || "Invalid draft data";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Save timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error("Draft save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishEvent = async () => {
    console.log("Publish button clicked in BlogEditor");
    console.log("Current blog state:", blog);
    console.log("Editor ref ready:", editorRef.current?.isReady);
    
    // Validate blog_id if present
    const blogIdToCheck = getBlogId();
    if (blogIdToCheck && !isValidBlogId(blogIdToCheck)) {
      toast.error("Draft has an invalid blog ID. Please start a new draft.");
      clearSessionDraft();
      navigate("/admin/editor");
      return;
    }

    // Validate all required fields for publishing
    if (!banner) {
      console.log("Validation failed: No banner");
      return toast.error("Upload a blog banner to publish it");
    }
    if (!title.trim()) {
      console.log("Validation failed: No title");
      return toast.error("Write blog title to publish it");
    }
    if (!des.trim()) {
      console.log("Validation failed: No description");
      return toast.error("Write blog description to publish it");
    }
    if (des.trim().length > 200) {
      console.log("Validation failed: Description too long");
      return toast.error("Description cannot exceed 200 characters");
    }
    if (!tags.length) {
      console.log("Validation failed: No tags");
      return toast.error("Add at least one tag to publish it");
    }
    
    try {
      if (!editorRef.current?.isReady) {
        console.log("Editor not ready");
        throw new Error("Editor not ready");
      }
      
      const data = await editorRef.current.save();
      console.log("Editor save data:", data);
      
      if (!data.blocks?.length) {
        console.log("Validation failed: No content blocks");
        return toast.error("Write something in your blog to publish it");
      }
      
      const blogData = {
        title: title.trim(),
        banner: banner.trim(),
        content: [{
          time: data.time || Date.now(),
          blocks: Array.isArray(data.blocks) ? data.blocks : [],
          version: data.version || '2.27.2'
        }],
        tags: tags.map(tag => tag.trim().toLowerCase()),
        des: des.trim(),
        id: getBlogId()
      };
      
      console.log("Setting blog data for publish form:", blogData);
      // Update blog context for publish form but preserve local state
      setBlog(prev => ({
        ...prev,
        ...blogData,
        // Keep the current local state values
        title: title.trim(),
        banner: banner.trim(),
        des: des.trim(),
        tags: tags.map(tag => tag.trim().toLowerCase())
      }));
      setEditorState("publish");
      saveToSessionDraft(blogData);
      sessionStorage.setItem("refresh_drafts", "1");
    } catch (err) {
      console.error("Error in handlePublishEvent:", err);
      toast.error("Failed to save blog content");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving) {
          handleSaveDraft();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSaving]);

  // Cancel auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Place this after all hooks and before the return statement
  if (!authChecked || !blog) {
    return <div style={{textAlign: 'center', marginTop: '3rem'}}>Loading editor...</div>;
  }

  return (
    <>
      <nav className="navbar"></nav>
      <Toaster />
      <AnimationWrapper>
        <section className="w-full py-8 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 sm:mb-8 ml-0 sm:ml-28">
            <button
              className="btn-dark py-2 w-full sm:w-auto text-sm sm:text-base"
              onClick={handleSaveDraft}
              disabled={isSaving}
              title="Save draft (Ctrl+S / Cmd+S)"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              className="btn-dark py-2 w-full sm:w-auto text-sm sm:text-base"
              onClick={handlePublishEvent}
              disabled={!title.trim() || !des.trim() || isSaving || isAutoSaving}
              title={!title.trim() || !des.trim() ? "Complete all required fields to publish" : isSaving || isAutoSaving ? "Please wait for save to complete" : "Publish blog"}
            >
              Publish
            </button>
            {/* Save status indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {autoSaveStatus === 'saving' && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                  Auto-saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Saved
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-600" title={saveError}>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Save failed
                </span>
              )}
              {lastSaved && autoSaveStatus === 'idle' && (
                <span className="text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="mx-auto max-w-[900px] md:max-w-[700px] w-full">
            <div className="relative w-full aspect-video hover:opacity-80 bg-white border-l border-gray-200 rounded-lg max-w-full max-h-[300px] md:max-h-[400px] sm:max-h-[500px] overflow-hidden">
              <label htmlFor="uploadBanner">
                <img
                  src={banner || defaultBanner}
                  alt="Blog banner"
                  className="w-full h-auto max-h-[300px] md:max-h-[400px] sm:max-h-[500px] object-contain rounded-lg mx-auto bg-white transition-all duration-200"
                  onError={handleError}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                  <span className="text-white text-base md:text-lg">Upload Banner</span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg z-10">
                    <span className="text-white text-base md:text-lg animate-pulse">Uploading...</span>
                  </div>
                )}
              </label>
              <input
                type="file"
                id="uploadBanner"
                accept="image/*"
                hidden
                onChange={handleBannerUpload}
              />
            </div>
            <textarea
              placeholder="Blog Title"
              className="text-2xl md:text-3xl sm:text-4xl font-medium w-full h-16 md:h-18 sm:h-20 outline-none rounded-lg p-3 md:p-4 sm:p-4 bg-gray-50 resize-none mt-6 md:mt-8 sm:mt-10 leading-tight placeholder:opacity-40"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              maxLength={100}
            ></textarea>
            <div className="text-right text-xs md:text-sm sm:text-sm text-gray-500 mt-1">
              {title.length}/100 characters
            </div>
            <textarea
              value={des}
              placeholder="Blog Description"
              className="text-sm md:text-base sm:text-lg w-full h-16 md:h-18 sm:h-20 outline-none bg-gray-50 rounded-lg p-3 md:p-4 sm:p-4 resize-none mt-3 md:mt-4 sm:mt-4 leading-tight placeholder:opacity-40"
              onChange={handleDescriptionChange}
              maxLength={200}
            />
            <div className="text-right text-xs md:text-sm sm:text-sm text-gray-500 mt-1">
              {des.length}/200 characters
            </div>
            <div className="mt-3 md:mt-4 sm:mt-4">
              <label className="block text-xs md:text-base sm:text-base font-medium text-gray-700 mb-1">
                Tags (Press Enter to add, max 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, idx) => (
                  <div
                    key={tag + idx}
                    className="flex items-center bg-gray-100 text-gray-800 text-xs md:text-base sm:text-base px-2 md:px-3 sm:px-3 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                className="w-full px-3 md:px-4 sm:px-4 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 outline-none text-xs md:text-base sm:text-base"
                maxLength={20}
              />
              <div className="text-right text-xs md:text-sm sm:text-sm text-gray-500 mt-1">
                {tags.length}/5 tags • {tagInput.length}/20 characters
              </div>
            </div>
            <hr className="w-full opacity-10 my-4 md:my-5 sm:my-5" />
            <div ref={textEditorRef} className="font-gelasio overflow-x-auto"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor; 