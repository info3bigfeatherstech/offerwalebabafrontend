import React from "react";

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse flex flex-col">
    <div className="h-52 sm:h-56 bg-gray-200" />
    <div className="p-4 space-y-3 flex-1">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
    <div className="px-4 pb-4">
      <div className="h-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

export default SkeletonCard;
