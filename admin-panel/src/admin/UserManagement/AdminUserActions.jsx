import React from "react";

export default function AdminUserActions({ user, isSelf, isSuper, isAdmin, superAdmin, actionLoading, handlePromoteDemote, handleActivateDeactivate, handleDeleteUser }) {
  if (isSelf) return <span className="text-gray-400">—</span>;
  if (isSuper) return <span className="text-yellow-700 font-seminormal" title="Super admin cannot be promoted or demoted">Super Admin</span>;
  const isLoading =
    actionLoading === user._id + (isAdmin ? "-demote" : "-promote") ||
    actionLoading === user._id + "-activate" ||
    actionLoading === user._id + "-deactivate" ||
    actionLoading === user._id + "-delete";
  const isActive = user.active !== false && !user.deleted;
  const isDeactivated = user.active === false && !user.deleted;
  const isDeleted = user.deleted;
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {/* Promote/Demote */}
      {isAdmin ? (
        <button
          className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-full hover:bg-red-200 focus:ring-2 focus:ring-red-300 transition disabled:opacity-50 shadow-md font-seminormal drop-shadow-sm"
          disabled={isLoading}
          onClick={() => handlePromoteDemote(user._id, false)}
          title={superAdmin ? "Demote from admin" : "Request demotion (super admin approval required)"}
        >
          {actionLoading === user._id + "-demote" ? "Demoting..." : superAdmin ? "Demote" : "Request Demote"}
        </button>
      ) : (
        <button
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-black border border-gray-300 rounded-full hover:bg-gray-200 focus:ring-2 focus:ring-black transition disabled:opacity-50 shadow-md font-normal drop-shadow-sm"
          disabled={isLoading}
          onClick={() => handlePromoteDemote(user._id, true)}
          title={superAdmin ? "Promote to admin" : "Request promotion (super admin approval required)"}
        >
          {actionLoading === user._id + "-promote" ? "Promoting..." : superAdmin ? "Promote" : "Request Promote"}
        </button>
      )}
      {/* Activate/Deactivate */}
      {isActive && (
        <button
          className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-300 transition disabled:opacity-50 shadow-md font-normal drop-shadow-sm"
          disabled={isLoading}
          onClick={() => handleActivateDeactivate(user._id, false)}
          title="Deactivate user"
        >
          {actionLoading === user._id + "-deactivate" ? "Deactivating..." : "Deactivate"}
        </button>
      )}
      {isDeactivated && (
        <button
          className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 border border-green-300 rounded-full hover:bg-green-200 focus:ring-2 focus:ring-green-300 transition disabled:opacity-50 shadow-md font-normal drop-shadow-sm"
          disabled={isLoading}
          onClick={() => handleActivateDeactivate(user._id, true)}
          title="Activate user"
        >
          {actionLoading === user._id + "-activate" ? "Activating..." : "Activate"}
        </button>
      )}
      {/* Delete */}
      {!isDeleted && (
        <button
          className="flex items-center gap-1 px-3 py-2 bg-red-200 text-red-800 border border-red-400 rounded-full hover:bg-red-300 focus:ring-2 focus:ring-red-400 transition disabled:opacity-50 shadow-md font-normal drop-shadow-sm"
          disabled={isLoading}
          onClick={() => handleDeleteUser(user._id)}
          title="Delete user"
        >
          {actionLoading === user._id + "-delete" ? "Deleting..." : "Delete"}
        </button>
      )}
    </div>
  );
} 