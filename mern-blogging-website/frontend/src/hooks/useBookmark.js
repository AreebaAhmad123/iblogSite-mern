import { useState, useContext } from 'react';
import { UserContext } from '../App';
import axios from '../common/axios-config';
import { toast } from 'react-toastify';

export const useBookmark = () => {
  const [bookmarking, setBookmarking] = useState(false);
  const { userAuth, setUserAuth } = useContext(UserContext);

  const handleBookmark = async (blogId, event) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!userAuth?.access_token || bookmarking) return;
    
    setBookmarking(true);
    
    try {
      const isBookmarked = userAuth?.bookmarked_blogs?.includes(blogId);
      const url = isBookmarked ? "/unbookmark-blog" : "/bookmark-blog";
      
      await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/api" + url,
        { blog_id: blogId }
      );
      
      // Fetch latest user profile and update userAuth
      const { data: user } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/api/get-profile",
        { username: userAuth.username }
      );
      
      setUserAuth(user);
      
      return { success: true, isBookmarked: !isBookmarked };
    } catch (err) {
      toast.error("Failed to update bookmark. Please try again.");
      console.error("Bookmark error:", err);
      return { success: false, error: err };
    } finally {
      setTimeout(() => {
        setBookmarking(false);
      }, 300);
    }
  };

  const isBookmarked = (blogId) => {
    return userAuth?.bookmarked_blogs?.includes(blogId) || false;
  };

  return {
    handleBookmark,
    isBookmarked,
    bookmarking
  };
}; 