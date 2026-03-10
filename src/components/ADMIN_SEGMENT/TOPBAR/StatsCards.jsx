import React, { useState } from 'react';
import BulkUploadTab from '../ADMIN_TABS/BulkUploadTab';

const StatsCards = ({ activeProducts, featuredProducts, archivedProducts, onViewArchived }) => {
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-3">
        <div className="px-4 py-2 bg-blue-50 rounded-xl flex items-center space-x-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-blue-700">{activeProducts} Live</span>
        </div>
        <div className="px-4 py-2 bg-purple-50 rounded-xl flex items-center space-x-2">
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-purple-700">{featuredProducts} Featured</span>
        </div>
        <button 
          onClick={onViewArchived}
          className="px-4 py-2 bg-gray-50 rounded-xl flex items-center space-x-2 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{archivedProducts} Archived</span>
        </button>
        
        {/* Bulk Upload Button */}
        <button
          onClick={() => setShowBulkUploadModal(true)}
          className="px-4 py-2 bg-green-50 rounded-xl flex items-center space-x-2 hover:bg-green-100 transition-colors group"
        >
          <svg className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-medium text-green-700">Bulk Upload</span>
        </button>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowBulkUploadModal(false)}
          />
          
          {/* Modal Center Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Upload Products
                </h2>
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <BulkUploadTab onClose={() => setShowBulkUploadModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatsCards;
// import React from 'react';

// const StatsCards = ({ activeProducts, featuredProducts, archivedProducts, onViewArchived }) => {
//   return (
//     <div className="flex items-center space-x-3">
//       <div className="px-4 py-2 bg-blue-50 rounded-xl flex items-center space-x-2">
//         <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
//         <span className="text-sm font-medium text-blue-700">{activeProducts} Live</span>
//       </div>
//       <div className="px-4 py-2 bg-purple-50 rounded-xl flex items-center space-x-2">
//         <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
//           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//         </svg>
//         <span className="text-sm font-medium text-purple-700">{featuredProducts} Featured</span>
//       </div>
//       <button 
//         onClick={onViewArchived}
//         className="px-4 py-2 bg-gray-50 rounded-xl flex items-center space-x-2 hover:bg-gray-100 transition-colors"
//       >
//         <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//         </svg>
//         <span className="text-sm font-medium text-gray-700">{archivedProducts} Archived</span>
//       </button>
//     </div>
//   );
// };

// export default StatsCards;