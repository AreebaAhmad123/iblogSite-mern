import { useState, useContext } from 'react';
import { UserContext } from '../App';
import axios from '../common/axios-config';

export const useLike = () => {
  const [loading, setLoading] = useState(false);
  const { userAuth } = useContext(UserContext);

  const handleLike = async (blogId, currentLikes, isCurrentlyLiked, onLikeToggle) => {
    if (loading || !userAuth?.access_token) return;

    setLoading(true);
    
    // Optimistically update UI
    const newLikes = currentLikes + (isCurrentlyLiked ? -1 : 1);
    const newLikedState = !isCurrentlyLiked;

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/api/like-blog",
        { blog_id: blogId },
        {
          headers: {
            'Authorization': `Bearer ${userAuth.access_token}`
          }
        }
      );
      
      if (onLikeToggle) {
        onLikeToggle(data.liked, blogId);
      }
      
      return { success: true, likes: newLikes, isLiked: newLikedState };
    } catch (err) {
      // Revert on error
      return { 
        success: false, 
        likes: currentLikes, 
        isLiked: isCurrentlyLiked,
        error: err 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLike,
    loading
  };
}; 