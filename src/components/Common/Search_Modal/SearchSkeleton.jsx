import React from 'react';

const SearchSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default SearchSkeleton;