import React, { useState, useContext, useEffect } from "react";
import { uploadImage } from "../common/cloudinary";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

const AdminAdManagement = () => {
  const { userAuth } = useContext(UserContext);
  const [banners, setBanners] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingLinkValue, setEditingLinkValue] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const urlRegex = /^https?:\/\/.+/;

  // Fetch all banners
  const fetchBanners = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banners`, {
        headers: { Authorization: `Bearer ${userAuth.access_token}` },
      });
      setBanners(res.data.banners || []);
    } catch (err) {
      setBanners([]);
      setError("Failed to fetch banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image file.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const imageUrl = await uploadImage(selectedFile, userAuth.access_token);
      // Save banner to backend
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banner`,
        { imageUrl },
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setSuccess("Banner uploaded and saved successfully!");
      setSelectedFile(null);
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetVisible = async (id) => {
    setActionLoading(id + "-visible");
    setError("");
    setSuccess("");
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banner/${id}`,
        { visible: true },
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setSuccess("Banner set as visible.");
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to set visible.");
    } finally {
      setActionLoading("");
    }
  };

  const handleHide = async (id) => {
    setActionLoading(id + "-hide");
    setError("");
    setSuccess("");
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banner/${id}/hide`,
        {},
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setSuccess("Banner hidden.");
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to hide banner.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner? This action cannot be undone.")) return;
    setActionLoading(id + "-delete");
    setError("");
    setSuccess("");
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banner/${id}`,
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setSuccess("Banner deleted.");
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete banner.");
    } finally {
      setActionLoading("");
    }
  };

  const handleEditLink = (id, currentLink) => {
    setEditingLinkId(id);
    setEditingLinkValue(currentLink || "");
    setError("");
    setSuccess("");
  };

  const handleSaveLink = async (id) => {
    setActionLoading(id + "-link");
    setError("");
    setSuccess("");
    if (editingLinkValue && !urlRegex.test(editingLinkValue)) {
      setError("Invalid link URL. Must start with http:// or https://");
      setActionLoading("");
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_DOMAIN}/api/admin/ad-banner/${id}`,
        { link: editingLinkValue },
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );
      setSuccess("Banner link updated.");
      setEditingLinkId(null);
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update link.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded shadow mt-6">
      <h1 className="text-2xl font-bold mb-4">Ad Management</h1>
      <div className="mb-6">
        <label className="block font-medium mb-2">Upload New Banner Image:</label>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        <button
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
        >
          {uploading ? <Loader size="small" /> : "Upload & Save"}
        </button>
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {success && <div className="mt-2 text-green-600">{success}</div>}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">All Ad Banners</h2>
        {loading ? (
          <Loader size="medium" />
        ) : banners.length === 0 ? (
          <div className="text-gray-500 italic mb-2">No banners uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Image</th>
                  <th className="p-2 border">Link</th>
                  <th className="p-2 border">Visible</th>
                  <th className="p-2 border">Views</th>
                  <th className="p-2 border">Clicks</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner._id} className={banner.visible ? "bg-green-50" : ""}>
                    <td className="p-2 border">
                      <img src={banner.imageUrl} alt="Ad Banner" className="w-32 max-h-24 object-contain rounded border" />
                    </td>
                    <td className="p-2 border">
                      {editingLinkId === banner._id ? (
                        <>
                          <input
                            type="text"
                            value={editingLinkValue}
                            onChange={e => setEditingLinkValue(e.target.value)}
                            className="border px-2 py-1 rounded w-40"
                          />
                          <button
                            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                            onClick={() => handleSaveLink(banner._id)}
                            disabled={actionLoading === banner._id + "-link"}
                          >Save</button>
                          <button
                            className="ml-2 px-2 py-1 bg-gray-300 rounded"
                            onClick={() => setEditingLinkId(null)}
                          >Cancel</button>
                        </>
                      ) : (
                        <>
                          <span>{banner.link || <span className="text-gray-400">(none)</span>}</span>
                          <button
                            className="ml-2 px-2 py-1 bg-yellow-400 rounded"
                            onClick={() => handleEditLink(banner._id, banner.link)}
                          >Edit</button>
                        </>
                      )}
                    </td>
                    <td className="p-2 border text-center font-bold">
                      {banner.visible ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                    </td>
                    <td className="p-2 border text-center">{banner.views}</td>
                    <td className="p-2 border text-center">{banner.clicks}</td>
                    <td className="p-2 border">
                      {banner.visible ? null : (
                        <button
                          className="px-2 py-1 bg-green-500 text-white rounded mr-2"
                          onClick={() => handleSetVisible(banner._id)}
                          disabled={actionLoading === banner._id + "-visible"}
                        >Set Visible</button>
                      )}
                      <button
                        className="px-2 py-1 bg-gray-400 text-white rounded mr-2"
                        onClick={() => handleHide(banner._id)}
                        disabled={actionLoading === banner._id + "-hide" || !banner.visible}
                      >Hide</button>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded"
                        onClick={() => handleDelete(banner._id)}
                        disabled={actionLoading === banner._id + "-delete"}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Analytics Pie Chart for visible banner */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Visible Banner Analytics</h2>
        {banners.length > 0 && banners.find(b => b.visible) ? (
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Views", value: banners.find(b => b.visible).views },
                    { name: "Clicks", value: banners.find(b => b.visible).clicks },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell key="cell-0" fill={COLORS[0]} />
                  <Cell key="cell-1" fill={COLORS[1]} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-gray-500 italic">No visible banner for analytics.</div>
        )}
      </div>
    </div>
  );
};

export default AdminAdManagement; 