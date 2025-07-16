import { createContext, useState } from "react";

export const BlogContext = createContext({});

const BlogPage = () => {
  const [blog, setBlog] = useState(null);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

  return (
    <BlogContext.Provider value={{ 
      blog, 
      setBlog, 
      totalParentCommentsLoaded, 
      setTotalParentCommentsLoaded 
    }}>
      {/* This is just a context provider for admin components */}
    </BlogContext.Provider>
  );
};

export default BlogPage; 