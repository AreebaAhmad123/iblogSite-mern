import React from "react";

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };
  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  // Show up to 5 page numbers
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(5, totalPages);
    if (end === totalPages) start = Math.max(1, totalPages - 4);
  }
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const showingStart = (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, total);

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-6 gap-2">
      <div className="text-gray-500 text-sm md:ml-2 md:mb-0 mb-2">
        Showing {showingStart} out of {total} entries
      </div>
      <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow border">
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          onClick={handlePrev}
          disabled={page === 1}
        >
          &#8592;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-all ${p === page ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          onClick={handleNext}
          disabled={page === totalPages}
        >
          &#8594;
        </button>
      </div>
    </div>
  );
} 