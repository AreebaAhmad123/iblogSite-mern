import { useState, useContext, useEffect } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import InPageNavigation from '../components/inpage-navigation.component';
import Loader from '../components/loader.component';
// Add Recharts imports
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminUtilities = () => {
  const { userAuth } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  // Add state for analytics history
  const [dbMaintenanceHistory, setDbMaintenanceHistory] = useState([]);
  const [dbMaintenanceLatest, setDbMaintenanceLatest] = useState(null);
  const [loadingDbHistory, setLoadingDbHistory] = useState(false);
  const [systemHealthHistory, setSystemHealthHistory] = useState([]);
  const [systemHealthLatest, setSystemHealthLatest] = useState(null);
  const [loadingHealthHistory, setLoadingHealthHistory] = useState(false);
  // Add new state for all system health metrics history
  const [cpuHistory, setCpuHistory] = useState([]);
  const [diskHistory, setDiskHistory] = useState([]);
  const [networkHistory, setNetworkHistory] = useState([]);
  const [responseTimeHistory, setResponseTimeHistory] = useState([]);
  const [errorRateHistory, setErrorRateHistory] = useState([]);

  const handleCleanup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/cleanup-unused-banners`,
        {},
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clean up images.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemHealthCheck = async () => {
    setLoadingHealth(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/system-health`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleDatabaseMaintenance = async () => {
    setLoadingDb(true);
    setDbStats(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/database-maintenance`,
        {},
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setDbStats(res.data);
    } catch (err) {
      setDbStats(null);
      setError('Failed to perform database maintenance.');
    } finally {
      setLoadingDb(false);
    }
  };

  // Fetch DB maintenance history
  const fetchDbMaintenanceHistory = async () => {
    setLoadingDbHistory(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/database-maintenance-history`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setDbMaintenanceHistory(res.data.history || []);
    } catch (err) {
      setDbMaintenanceHistory([]);
    } finally {
      setLoadingDbHistory(false);
    }
  };
  // Fetch latest DB maintenance
  const fetchDbMaintenanceLatest = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/database-maintenance-latest`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setDbMaintenanceLatest(res.data.latest || null);
    } catch (err) {
      setDbMaintenanceLatest(null);
    }
  };
  // Fetch system health history
  const fetchSystemHealthHistory = async () => {
    setLoadingHealthHistory(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/system-health-history`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSystemHealthHistory(res.data.history || []);
    } catch (err) {
      setSystemHealthHistory([]);
    } finally {
      setLoadingHealthHistory(false);
    }
  };
  // Fetch latest system health
  const fetchSystemHealthLatest = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/system-health-latest`,
        { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
      );
      setSystemHealthLatest(res.data.latest || null);
    } catch (err) {
      setSystemHealthLatest(null);
    }
  };

  // Fetch all system health metric histories
  const fetchAllSystemHealthHistories = async () => {
    const metrics = ['memory', 'cpu', 'disk', 'network', 'response_time', 'error_rate'];
    const setters = [setSystemHealthHistory, setCpuHistory, setDiskHistory, setNetworkHistory, setResponseTimeHistory, setErrorRateHistory];
    await Promise.all(metrics.map(async (metric, idx) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/system-health-history?metric=${metric}`,
          { headers: { 'Authorization': `Bearer ${userAuth.access_token}` } }
        );
        setters[idx](res.data.history || []);
      } catch (err) {
        setters[idx]([]);
      }
    }));
  };

  // Fetch analytics history on mount
  useEffect(() => {
    fetchDbMaintenanceHistory();
    fetchDbMaintenanceLatest();
    fetchAllSystemHealthHistories();
    fetchSystemHealthLatest();
  }, [userAuth.access_token]);

  // Prepare chart data for database maintenance
  const prepareDbMaintenanceChartData = () => {
    console.log('dbMaintenanceHistory:', dbMaintenanceHistory);
    return dbMaintenanceHistory.slice(0, 10).map(log => {
      let dateStr = '';
      if (log.date && !isNaN(new Date(log.date))) {
        dateStr = new Date(log.date).toLocaleDateString();
      } else if (log.timestamp && !isNaN(new Date(log.timestamp))) {
        dateStr = new Date(log.timestamp).toLocaleDateString();
      }
      // Support both flattened and nested cleanedRecords
      let cleanedRecords = 0;
      if (typeof log.cleanedRecords === 'object' && log.cleanedRecords !== null) {
        cleanedRecords = log.cleanedRecords.orphanedComments || 0;
      } else if (typeof log.cleanedRecords === 'number') {
        cleanedRecords = log.cleanedRecords;
      } else if (typeof log.orphanedComments === 'number') {
        cleanedRecords = log.orphanedComments;
      }
      return {
        date: dateStr,
        cleanedRecords,
        sizeReduction: typeof log.sizeReduction === 'number' ? log.sizeReduction : 0,
        optimizedIndexes: log.optimizedIndexes || 0
      };
    });
  };
  // Prepare chart data for each metric
  const prepareMetricChartData = (history, valueKey = 'value') => {
    return history.slice(0, 10).map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(),
      value: log[valueKey] || log.value || 0,
      status: log.status || 'normal',
      ...log.details
    }));
  };
  // Prepare system health status data for pie chart
  const prepareSystemHealthStatusData = () => {
    const statusCounts = systemHealthHistory.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  // Prepare data for RadarChart in System Health
  const prepareSystemHealthRadarData = () => {
    const metrics = ['memory', 'cpu', 'disk', 'network', 'response_time', 'error_rate'];
    const data = metrics.map(metric => {
      const log = systemHealthHistory.find(h => h.metric === metric);
      return {
        metric: metric.charAt(0).toUpperCase() + metric.slice(1),
        value: log ? log.value : 0
      };
    });
    return data;
  };

  return (
    <div className="w-full max-w-full md:max-w-4xl mx-auto p-2 xs:p-3 sm:p-4 md:p-8">
      <h1 className="text-2xl font-medium mb-6">Admin Utilities</h1>
      
      <InPageNavigation routes={["Image Cleanup", "Database Maintenance", "System Health"]} defaultActiveIndex={0}>
        {/* Image Cleanup Tab */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-medium mb-4">Image Cleanup</h2>
            <p className="text-gray-600 mb-4">Remove unused banner images from the server to free up storage space.</p>
            <button
              className="btn-dark px-4 py-2 rounded mb-4"
              onClick={handleCleanup}
              disabled={loading}
            >
              {loading ? 'Cleaning up...' : 'Clean Up Unused Banner Images'}
            </button>
            {result && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700">Successfully deleted {result.deletedCount} unused images.</p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Database Maintenance Tab */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-medium mb-4">Database Maintenance</h2>
            <p className="text-gray-600 mb-4">Optimize indexes and clean up orphaned records in the database.</p>
            <button
              className="btn-dark px-4 py-2 rounded mb-4"
              onClick={handleDatabaseMaintenance}
              disabled={loadingDb}
            >
              {loadingDb ? 'Performing maintenance...' : 'Run Database Maintenance'}
            </button>
            {loadingDb && <Loader />}
            {dbStats && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium mb-2">Maintenance Results:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Optimized indexes: <span className="font-semibold">{dbStats.optimizedIndexes}</span></li>
                  <li>• Orphaned comments deleted: <span className="font-semibold">{dbStats.cleanedRecords?.orphanedComments}</span></li>
                  <li>• Blogs with missing authors deleted: <span className="font-semibold">{dbStats.cleanedRecords?.blogsWithMissingAuthors}</span></li>
                  <li>• Database size: <span className="font-semibold">{dbStats.sizeReduction || 'N/A'}</span></li>
                </ul>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {/* Analytics Charts */}
            {dbMaintenanceHistory.length > 0 && (
              <div className="space-y-6 mt-8">
                {/* Multi-Line Chart for Database Maintenance */}
                <div className="p-4 bg-white border border-gray-200 rounded">
                  <h4 className="font-medium mb-4">Maintenance Factors Over Time</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareDbMaintenanceChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cleanedRecords" stroke="#1976d2" name="Cleaned Records" strokeWidth={3} dot={{ r: 4, fill: '#1976d2', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="optimizedIndexes" stroke="#43e97b" name="Optimized Indexes" strokeWidth={3} dot={{ r: 4, fill: '#43e97b', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="sizeReduction" stroke="#ff6a00" name="Size Reduction (MB)" strokeWidth={3} dot={{ r: 4, fill: '#ff6a00', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* System Health Tab */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-medium mb-4">System Health</h2>
            <p className="text-gray-600 mb-4">Check the overall health and performance of the system.</p>
            <button
              className="btn-dark px-4 py-2 rounded mb-4"
              onClick={handleSystemHealthCheck}
              disabled={loadingHealth}
            >
              {loadingHealth ? 'Checking health...' : 'Check System Health'}
            </button>
            {loadingHealth && <Loader />}
            {systemHealth && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded border ${
                    systemHealth.serverStatus === 'Healthy' ? 'bg-green-50 border-green-200' :
                    systemHealth.serverStatus === 'Warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <h3 className={`font-medium mb-1 ${
                      systemHealth.serverStatus === 'Healthy' ? 'text-green-700' :
                      systemHealth.serverStatus === 'Warning' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>Server Status</h3>
                    <p className={`text-sm ${
                      systemHealth.serverStatus === 'Healthy' ? 'text-green-600' :
                      systemHealth.serverStatus === 'Warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{systemHealth.serverStatus}</p>
                  </div>
                  <div className={`p-4 rounded border ${
                    systemHealth.databaseStatus === 'Connected' ? 'bg-green-50 border-green-200' :
                    systemHealth.databaseStatus === 'Connecting' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <h3 className={`font-medium mb-1 ${
                      systemHealth.databaseStatus === 'Connected' ? 'text-green-700' :
                      systemHealth.databaseStatus === 'Connecting' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>Database Status</h3>
                    <p className={`text-sm ${
                      systemHealth.databaseStatus === 'Connected' ? 'text-green-600' :
                      systemHealth.databaseStatus === 'Connecting' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{systemHealth.databaseStatus}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="font-medium text-blue-700 mb-1">Memory Usage</h3>
                    <p className="text-sm text-blue-600">{systemHealth.memoryUsage}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                    <h3 className="font-medium text-purple-700 mb-1">Uptime</h3>
                    <p className="text-sm text-purple-600">{systemHealth.uptime}</p>
                  </div>
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded">
                    <h3 className="font-medium text-pink-700 mb-1">CPU Usage</h3>
                    <p className="text-sm text-pink-600">{systemHealth.cpuUsage}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-medium text-yellow-700 mb-1">Disk Usage</h3>
                    <p className="text-sm text-yellow-600" style={{wordBreak:'break-all'}}>{typeof systemHealth.diskUsage === 'string' ? systemHealth.diskUsage.split('\n')[1] : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-cyan-50 border border-cyan-200 rounded">
                    <h3 className="font-medium text-cyan-700 mb-1">Network Usage</h3>
                    <p className="text-sm text-cyan-600" style={{wordBreak:'break-all'}}>{typeof systemHealth.networkUsage === 'string' ? systemHealth.networkUsage.slice(0, 100) + '...' : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                    <h3 className="font-medium text-orange-700 mb-1">Response Time</h3>
                    <p className="text-sm text-orange-600">{systemHealth.responseTime}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-medium text-red-700 mb-1">Error Rate</h3>
                    <p className="text-sm text-red-600">{systemHealth.errorRate}</p>
                  </div>
                </div>
                {systemHealth.issues && systemHealth.issues.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-medium text-yellow-700 mb-2">Issues Found:</h3>
                    <ul className="space-y-1 text-sm text-yellow-600">
                      {systemHealth.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {systemHealth.issues && systemHealth.issues.length === 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-medium text-green-700 mb-2">All Systems Operational</h3>
                    <p className="text-sm text-green-600">No issues detected. All systems are running normally.</p>
                  </div>
                )}
              </div>
            )}
            {/* Analytics Charts */}
            <div className="space-y-6 mt-8">
              {/* RadarChart for System Health */}
              <div className="p-4 bg-white border border-gray-200 rounded">
                <h4 className="font-medium mb-4">System Health Metrics Radar</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart cx="50%" cy="50%" outerRadius={120} data={prepareSystemHealthRadarData()}
                    >
                    <PolarGrid stroke="#e0e7ff" strokeWidth={2} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: (d) => radarAxisColor(d), fontWeight: 'bold', fontSize: 15 }} />
                    <PolarRadiusAxis tick={{ fill: '#bdbdbd', fontWeight: 'bold' }} axisLine={false} />
                    <Radar name="Value" dataKey="value" stroke="url(#radarStrokeGradient)" fill="url(#radarFillGradient)" fillOpacity={0.8} strokeWidth={4} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="radarFillGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff6a00" />
                        <stop offset="50%" stopColor="#43e97b" />
                        <stop offset="100%" stopColor="#1976d2" />
                      </linearGradient>
                      <linearGradient id="radarStrokeGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff6a00" />
                        <stop offset="50%" stopColor="#43e97b" />
                        <stop offset="100%" stopColor="#1976d2" />
                      </linearGradient>
                    </defs>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </InPageNavigation>
    </div>
  );
};

export default AdminUtilities; 

function radarAxisColor(metric) {
  switch (metric) {
    case 'Memory': return '#ff6a00';
    case 'Cpu': return '#43e97b';
    case 'Disk': return '#1976d2';
    case 'Network': return '#ff4081';
    case 'Response_time': return '#ffd600';
    case 'Error_rate': return '#d500f9';
    default: return '#8884d8';
  }
} 