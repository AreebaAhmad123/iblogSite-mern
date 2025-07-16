import React from "react";
import AdminUserStatusBadge from "./AdminUserStatusBadge";
import AdminUserActions from "./AdminUserActions";

const crownIcon = (
  <svg className="inline w-4 h-4 text-yellow-500 mr-1 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2.166 6.5l2.97 7.11a1 1 0 00.92.64h7.888a1 1 0 00.92-.64l2.97-7.11a.5.5 0 00-.82-.54l-3.13 2.61a1 1 0 01-1.32 0l-2.13-1.78-2.13 1.78a1 1 0 01-1.32 0l-3.13-2.61a.5.5 0 00-.82.54z" /></svg>
);
const adminIcon = (
  <svg className="w-4 h-4" style={{color: 'black'}} fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
);

export default function AdminUserTableRow(props) {
  const { user } = props;
  if (!user || !user._id) {
    console.warn('AdminUserTableRow: invalid user', user);
    return null;
  }
  const userAuth = props.userAuth;
  const actionLoading = props.actionLoading;
  const superAdmin = props.superAdmin;
  const handlePromoteDemote = props.handlePromoteDemote;
  const handleActivateDeactivate = props.handleActivateDeactivate;
  const handleDeleteUser = props.handleDeleteUser;
  const rowIndex = props.rowIndex;
  const serial = props.serial;
  const isSelected = props.isSelected;
  const onSelectUser = props.onSelectUser;

  const isSelf = user._id === userAuth._id;
  const isSuper = user.super_admin;
  const isAdmin = user.admin;
  const isSuperAdminRow = user.super_admin;
  const zebraClass = !isSuperAdminRow && rowIndex % 2 === 1 ? "bg-gray-50" : "";
  return (
    <tr
      className={`transition ${isSuperAdminRow ? "bg-yellow-50 border-l-4 border-yellow-400" : ""} ${zebraClass}`}
      style={isSuperAdminRow ? { boxShadow: '0 2px 8px 0 #ffe06633', backgroundColor: (typeof document !== 'undefined' && document.body.getAttribute('data-theme') === 'dark' ? '#3a3a3a' : '#fffbe6') } : {}}
    >
      {superAdmin && (
        <td className="p-4 align-middle text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onSelectUser(user._id, e.target.checked)}
            disabled={isSelf || isSuper}
            aria-label="Select user for bulk action"
            title={isSelf ? 'You cannot select yourself for bulk actions.' : isSuper ? 'Super admin cannot be selected for bulk actions.' : ''}
          />
        </td>
      )}
      <td className="p-4 align-middle font-medium">{serial}</td>
      <td className="p-4 align-middle font-medium flex items-center gap-2">
        {isSuperAdminRow && (
          <span title="Super Admin" className="mr-1">{crownIcon}</span>
        )}
        <span>{user.personal_info?.fullname || user.personal_info?.username}</span>
        {isSelf && <span className="ml-2 text-xs text-gray-400">(You)</span>}
      </td>
      <td className="p-4 align-middle break-all">{user.personal_info?.email}</td>
      <td className="p-4 align-middle">
        <AdminUserStatusBadge user={user} />
      </td>
      <td className="p-4 align-middle">
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full shadow-sm border ${isAdmin ? 'bg-white text-black border-black mr-2 drop-shadow-sm' : 'bg-gray-200 text-gray-500 border-gray-300'}`}
          title={isAdmin ? 'Admin' : 'User'}>
          {adminIcon}
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </td>
      <td className="p-4 align-middle text-center">
        <AdminUserActions
          user={user}
          isSelf={isSelf}
          isSuper={isSuper}
          isAdmin={isAdmin}
          superAdmin={superAdmin}
          actionLoading={actionLoading}
          handlePromoteDemote={handlePromoteDemote}
          handleActivateDeactivate={handleActivateDeactivate}
          handleDeleteUser={handleDeleteUser}
        />
      </td>
    </tr>
  );
} 