import React, { useState } from 'react';

const ArchivedTab = ({ 
  products, 
  onRestore, 
  onPermanentDelete,
  formatIndianRupee,
  getDiscountPercentage,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading archived products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search archived products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const mainVariant = product.variants?.[0] || {};
              const basePrice = mainVariant.price?.base || 0;
              const salePrice = mainVariant.price?.sale;
              
              return (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {salePrice ? (
                        <>
                          <span className="text-gray-400 line-through text-xs mr-2">
                            {formatIndianRupee(basePrice)}
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatIndianRupee(salePrice)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-900">
                          {formatIndianRupee(basePrice)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onRestore(product._id)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => onPermanentDelete(product._id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
            <p className="text-gray-500">Archived products will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedTab;

// import React from 'react';

// const ArchivedTab = ({ products, onRestore, onPermanentDelete, formatIndianRupee, getDiscountPercentage }) => {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Archived Products</h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Products in archive are hidden from your store. You can restore or permanently delete them.
//           </p>
//         </div>
//         <div className="bg-gray-100 px-4 py-2 rounded-xl">
//           <span className="text-sm font-medium text-gray-700">
//             {products.length} Archived Items
//           </span>
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {products.map((product) => {
//               const discountPercentage = getDiscountPercentage(product.price.base, product.price.sale);
              
//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{product.name}</div>
//                       <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                       {product.category?.name || 'Uncategorized'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-sm">
//                     {product.brand === 'Generic' ? (
//                       <span className="text-gray-400">—</span>
//                     ) : (
//                       <span className="font-medium text-gray-700">{product.brand}</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm">
//                       <span className="text-gray-400 line-through text-xs mr-2">
//                         {formatIndianRupee(product.price.base)}
//                       </span>
//                       <span className="font-bold text-gray-900">
//                         {formatIndianRupee(product.price.sale || product.price.base)}
//                       </span>
//                       {discountPercentage > 0 && (
//                         <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                           {discountPercentage}% OFF
//                         </span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-500">
//                     {new Date(product.createdAt).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <button
//                         onClick={() => onRestore(product._id)}
//                         className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-xl hover:bg-green-200 transition-colors flex items-center space-x-1"
//                       >
//                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                         </svg>
//                         <span>Restore</span>
//                       </button>
//                       <button
//                         onClick={() => onPermanentDelete(product._id)}
//                         className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center space-x-1"
//                       >
//                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                         </svg>
//                         <span>Delete</span>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
        
//         {products.length === 0 && (
//           <div className="text-center py-16">
//             <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
//             <p className="text-gray-500">Products you archive will appear here</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ArchivedTab;