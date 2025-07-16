import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import { createContext } from "react";
import Loader, { EditorErrorBoundary } from "../components/loader.component";
import axios from "axios";

const blogStructure = {
    title: '',
    banner: '',
    content: [{ time: Date.now(), blocks: [], version: '2.27.2' }],
    tags: [],
    des: '',
    author: { personal_info: {} }
}

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
                    'Content-Type': 'application/json'
                };

                const response = await axios.post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/api/get-blog",
                    {
                        blog_id,
                        draft: true,
                        mode: 'edit'
                    },
                    { 
                        headers, 
                        signal: abortController.signal,
                        timeout: 10000 // 10 second timeout
                    }
                );

                if (isMounted) {
                    if (response.data.blog) {
                        const fetchedBlog = response.data.blog;

                        // Ensure content has the correct structure
                        let formattedContent;
                        if (!fetchedBlog.content) {
                            formattedContent = [{
                                time: Date.now(),
                                blocks: [],
                                version: '2.27.2'
                            }];
                        } else if (!Array.isArray(fetchedBlog.content)) {
                            // Handle old format where content was an object
                            formattedContent = [{
                                time: Date.now(),
                                blocks: fetchedBlog.content.blocks || [],
                                version: '2.27.2'
                            }];
                        } else if (fetchedBlog.content.length === 0) {
                            formattedContent = [{
                                time: Date.now(),
                                blocks: [],
                                version: '2.27.2'
                            }];
                        } else {
                            // Ensure each content item has the required fields
                            formattedContent = fetchedBlog.content.map(content => {
                                return {
                                    time: content.time || Date.now(),
                                    blocks: Array.isArray(content.blocks) ? content.blocks : [],
                                    version: content.version || '2.27.2'
                                };
                            });
                        }

                        const formattedBlog = {
                            ...fetchedBlog,
                            content: formattedContent
                        };

                        setBlog(formattedBlog);
                        setError(null);
                    } else {
                        setError("Blog not found or you don't have permission to edit this blog.");
                        setBlog(null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    if (err.response) {
                        if (err.response.status === 401) {
                            setError("Authentication expired. Please log in again.");
                        } else if (err.response.status === 403) {
                            setError("You don't have permission to edit this blog.");
                        } else if (err.response.status === 404) {
                            setError("Blog not found.");
                        } else {
                            setError("Failed to load blog. Please try again.");
                        }
                    } else if (err.code === 'ECONNABORTED') {
                        setError("Request timed out. Please check your connection and try again.");
                    } else {
                        setError("Failed to load blog. Please try again.");
                    }
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

    // Check if user is authenticated
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
        <EditorErrorBoundary>
            <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
                <div className="editor-page">
                    {editorState === "editor" && blog && userAuth && <BlogEditor />}
                    {editorState === "publish" && blog && userAuth && <PublishForm />}
                </div>
            </EditorContext.Provider>
        </EditorErrorBoundary>
    );
}

export default Editor;
