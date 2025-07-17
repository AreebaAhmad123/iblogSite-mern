import { useContext, useEffect } from "react";
import axios from "axios";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import AnimationWrapper from "../common/page-animation";
import CommentCard from "./comment-card.component";
import NoDataMessage from "./nodata.component";

export const fetchComments = async ({ skip = 0, blog_id, setParentCommentCountFun, comment_array = null }) => {
  try {
    console.log("Fetching comments for blog:", blog_id, "skip:", skip);
    const { data } = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog-comments", { blog_id, skip });
    
    console.log("Received comments data:", data);
    
    // Handle the response format from backend
    const comments = data.comments || [];
    
    if (!Array.isArray(comments)) {
      console.error("Invalid comments data received:", comments);
      return { results: [] };
    }

    // Ensure each comment has the required fields
    comments.forEach(comment => {
      comment.childrenLevel = 0;
      // Ensure commented_by has the required fields
      if (comment.commented_by && typeof comment.commented_by === 'object') {
        // Keep the original personal_info structure and add fallback properties
        comment.commented_by.fullname = comment.commented_by.personal_info?.fullname || 'Unknown User';
        comment.commented_by.username = comment.commented_by.personal_info?.username || 'unknown';
        comment.commented_by.profile_img = comment.commented_by.personal_info?.profile_img || '/src/imgs/user profile.png';
        comment.commented_by.role = comment.commented_by.role || 'user';
      }
    });

    setParentCommentCountFun(prevVal => prevVal + comments.length);

    if (comment_array === null) {
      return { results: comments };
    } else {
      return { results: [...comment_array, ...comments] };
    }
  } catch (err) {
    console.error("Error fetching comments:", err);
    if (err.response) {
      console.error("Error response:", err.response.data);
      console.error("Error status:", err.response.status);
    }
    return { results: [] };
  }
};

// Utility to build a nested comment tree from a flat array
function buildCommentTree(flatComments) {
  const idToCommentMap = {};
  const rootComments = [];

  // Initialize map and children arrays
  flatComments.forEach(comment => {
    idToCommentMap[comment._id] = { ...comment, children: [] };
  });

  // Build the tree
  flatComments.forEach(comment => {
    const parentId = comment.parent;
    if (parentId) {
      if (idToCommentMap[parentId]) {
        idToCommentMap[parentId].children.push(idToCommentMap[comment._id]);
      }
    } else {
      rootComments.push(idToCommentMap[comment._id]);
    }
  });

  return rootComments;
}

const CommentsContainer = () => {
  const context = useContext(BlogContext);
  
  useEffect(() => {
    console.log("CommentsContainer mounted with context:", context);
  }, [context]);

  if (!context || !context.blog) {
    console.log("No context or blog data available");
    return null;
  }

  const { 
    blog, 
    commentsWrapper, 
    setCommentsWrapper, 
    totalParentCommentsLoaded, 
    setTotalParentCommentsLoaded 
  } = context;

  const commentsArr = blog.comments?.results || [];
  const validCommentsArr = Array.isArray(commentsArr)
    ? buildCommentTree(commentsArr.filter(c => c && c._id))
    : [];
  const total_parent_comments = blog.activity?.total_comments || 0;

  console.log("CommentsContainer - blog data:", blog);
  console.log("CommentsContainer - comments array:", commentsArr);
  console.log("CommentsContainer - valid comments array:", validCommentsArr);
  console.log("CommentsContainer - total parent comments:", total_parent_comments);

  const loadMoreComments = async () => {
    try {
      const newCommentsArr = await fetchComments({ 
        skip: totalParentCommentsLoaded, 
        blog_id: blog.blog_id || blog._id, 
        setParentCommentCountFun: setTotalParentCommentsLoaded, 
        comment_array: commentsArr 
      });
      context.setBlog({ ...blog, comments: newCommentsArr });
    } catch (err) {
      console.error("Error loading more comments:", err);
    }
  };

  return (
    <section id="comments-section" className="w-full mt-12">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
        <span className="text-yellow-400 text-base">•</span> Comments
      </h2>
      <CommentField action="Comment" />
      <div className="flex flex-col gap-4">
        {validCommentsArr && validCommentsArr.length ?
          validCommentsArr.map((comment, i) => (
            <AnimationWrapper key={i}>
              <div className="bg-gray-50 rounded-xl p-5">
                <CommentCard 
                  index={i} 
                  leftVal={comment.childrenLevel || 0} 
                  commentData={comment} 
                />
              </div>
            </AnimationWrapper>
          )) : <NoDataMessage message="No Comments" />}
      </div>
      {total_parent_comments > 0 && total_parent_comments > totalParentCommentsLoaded ? (
        <button
          onClick={loadMoreComments}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2 mt-6 mx-auto"
        >
          Load More
        </button>
      ) : null}
    </section>
  );
};

export default CommentsContainer; 