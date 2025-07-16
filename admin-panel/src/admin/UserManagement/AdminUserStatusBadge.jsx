import React from "react";

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Deactivated: "bg-yellow-100 text-yellow-700",
  Deleted: "bg-red-100 text-red-700",
};

export default function AdminUserStatusBadge({ user }) {
  if (user.deleted) {
    return <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 border border-gray-300">Deleted</span>;
  }
  if (user.active === false) {
    return <span className="inline-block px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Deactivated</span>;
  }
  return <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">Active</span>;
} 