import { useContext, useEffect, useState, createContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component.jsx";
import PublishForm from "../components/publish-form.component.jsx";
import Loader, { EditorErrorBoundary } from "../components/loader.component.jsx";
import { UserContext } from "../App";

const blogStructure = {
    title: '',
    banner: '',
    content: [{ time: Date.now(), blocks: [], version: '2.27.2' }],
    tags: [],
    des: '',
    author: { personal_info: {} }
};

export const EditorContext = createContext({});

const Editor = () => {
    let { blog_id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(blogStructure);
    const [editorState, setEditorState] = useState("editor");
    const [textEditor, setTextEditor] = useState({ isReady: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { userAuth = {} } = useContext(UserContext);

    useEffect(() => {
        if (!blog_id) {
            setLoading(false);
            setBlog(blogStructure);
            return;
        }
        let isMounted = true;
        const abortController = new AbortController();
        const fetchBlog = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(userAuth.access_token ? { 'Authorization': `Bearer ${userAuth.access_token}` } : {})
                };
                const response = await fetch(
                    import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog",
                    {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ blog_id, draft: true, mode: 'edit' }),
                        signal: abortController.signal
                    }
                );
                const data = await response.json();
                if (isMounted) {
                    if (data.blog) {
                        let formattedContent;
                        if (!data.blog.content) {
                            formattedContent = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
                        } else if (Array.isArray(data.blog.content) && data.blog.content.length > 0) {
                            // Always use only the first content block
                            const first = data.blog.content[0];
                            formattedContent = [{
                                time: first.time || Date.now(),
                                blocks: Array.isArray(first.blocks) ? first.blocks : [],
                                version: first.version || '2.27.2'
                            }];
                        } else if (typeof data.blog.content === 'object' && data.blog.content !== null) {
                            formattedContent = [{
                                time: data.blog.content.time || Date.now(),
                                blocks: Array.isArray(data.blog.content.blocks) ? data.blog.content.blocks : [],
                                version: data.blog.content.version || '2.27.2'
                            }];
                        } else {
                            formattedContent = [{ time: Date.now(), blocks: [], version: '2.27.2' }];
                        }
                        setBlog({ ...data.blog, content: formattedContent });
                        setError(null);
                    } else {
                        setError("Blog not found or you don't have permission to edit this blog.");
                        setBlog(null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load blog. Please try again.");
                    setBlog(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchBlog();
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [blog_id, userAuth]);

    useEffect(() => {
        if (!userAuth.access_token) {
            navigate(`/login?next=/editor`, { replace: true });
        }
    }, [userAuth.access_token, navigate]);

    if (blog === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-6xl mb-4">📝</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Blog Not Found</h2>
                    <p className="text-gray-600 mb-6">The blog you're looking for doesn't exist or you don't have permission to edit it.</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => navigate("/editor")} 
                            className="btn-dark px-4 py-2"
                        >
                            Create New Blog
                        </button>
                        <button 
                            onClick={() => window.history.back()} 
                            className="btn-light px-4 py-2"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
            <div className="editor-page">
                {editorState === "editor" && blog && userAuth && (
                  <EditorErrorBoundary>
                    <BlogEditor />
                  </EditorErrorBoundary>
                )}
                {editorState === "publish" && blog && userAuth && <PublishForm />}
            </div>
        </EditorContext.Provider>
    );
};

export default Editor; 