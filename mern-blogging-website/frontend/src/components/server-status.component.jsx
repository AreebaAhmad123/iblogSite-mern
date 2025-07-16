import { useState, useEffect } from 'react';
import axios from 'axios';

const ServerStatus = ({ children }) => {
    const [serverStatus, setServerStatus] = useState('checking');
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkServer = async () => {
            try {
                const response = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + '/api/new-notification', {
                    timeout: 5000,
                    headers: {
                        'Authorization': 'Bearer test'
                    }
                });
                setServerStatus('connected');
            } catch (err) {
                if (err.code === 'ERR_NETWORK' || err.message.includes('ECONNREFUSED')) {
                    setServerStatus('disconnected');
                    setError('Server is not running. Please start the server on port 3000.');
                } else if (err.response?.status === 401) {
                    setServerStatus('connected');
                } else {
                    setServerStatus('error');
                    setError('Server connection error: ' + err.message);
                }
            }
        };

        checkServer();
    }, []);

    if (serverStatus === 'checking') {
        return <div className="text-center p-4">Checking server connection...</div>;
    }

    if (serverStatus === 'disconnected') {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-xl font-bold text-red-800 mb-2">Server Connection Error</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="text-sm text-gray-600">
                    <p>To fix this:</p>
                    <ol className="list-decimal list-inside mt-2">
                        <li>Open a terminal</li>
                        <li>Navigate to the server directory: <code className="bg-gray-100 px-1 rounded">cd mern-blogging-website/server</code></li>
                        <li>Start the server: <code className="bg-gray-100 px-1 rounded">npm start</code></li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            </div>
        );
    }

    if (serverStatus === 'error') {
        return (
            <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="text-xl font-bold text-yellow-800 mb-2">Server Error</h2>
                <p className="text-yellow-600">{error}</p>
            </div>
        );
    }

    return children;
};

export default ServerStatus; 