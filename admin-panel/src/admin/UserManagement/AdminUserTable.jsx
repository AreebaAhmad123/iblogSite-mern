import React from "react";
import AdminUserTableRow from "./AdminUserTableRow";

export default function AdminUserTable({ users, userAuth, actionLoading, superAdmin, handlePromoteDemote, handleActivateDeactivate, handleDeleteUser, selectedUserIds, onSelectUser, onSelectAll }) {
  // Defensive: always use an array
  const safeUsers = Array.isArray(users) ? users : [];
  const validUsers = safeUsers.filter(u => u && u._id);
  if (users && Array.isArray(users)) {
    users.forEach((u, i) => { if (!u || !u._id) console.warn('Invalid user at index', i, u); });
  } else if (users !== undefined) {
    console.warn('users is not an array:', users);
  }
  return (
    <div className="overflow-x-auto rounded-2xl shadow-lg bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            {superAdmin && (
              <th className="p-4 font-medium">
                <input
                  type="checkbox"
                  checked={safeUsers.length > 0 && selectedUserIds.length === safeUsers.length}
                  onChange={e => onSelectAll(e.target.checked)}
                  aria-label="Select all users"
                />
              </th>
            )}
            <th className="p-4 font-medium rounded-tl-2xl">#</th>
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Role</th>
            <th className="p-4 font-medium text-center rounded-tr-2xl">Action</th>
          </tr>
        </thead>
        <tbody>
          {validUsers.map((user, idx) => {
            console.log('Rendering user row:', user);
            return (
              <AdminUserTableRow
                key={user._id}
                user={user}
                userAuth={userAuth}
                actionLoading={actionLoading}
                superAdmin={superAdmin}
                handlePromoteDemote={handlePromoteDemote}
                handleActivateDeactivate={handleActivateDeactivate}
                handleDeleteUser={handleDeleteUser}
                rowIndex={idx}
                serial={idx + 1}
                isSelected={selectedUserIds.includes(user._id)}
                onSelectUser={onSelectUser}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 