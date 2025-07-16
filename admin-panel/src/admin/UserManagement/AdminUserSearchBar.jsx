import React from "react";

export default function AdminUserSearchBar({ value, onChange, searching }) {
  return (
    <div className="relative w-full md:w-96">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search users by name, username, or email..."
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 shadow-sm focus:outline-none dark:bg-[#3a3a3a] dark:placeholder-gray-300 focus:ring-2 focus:ring-black"
        style={{ backgroundColor: 'var(--color-bg)', ...(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? { backgroundColor: '#3a3a3a' } : {}) }}
      />
      <span className="absolute left-3 top-2.5 text-gray-400">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth="2"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"/>
        </svg>
      </span>
      {searching && <span className="absolute right-3 top-2.5 text-black animate-pulse">Searching...</span>}
    </div>
  );
} 