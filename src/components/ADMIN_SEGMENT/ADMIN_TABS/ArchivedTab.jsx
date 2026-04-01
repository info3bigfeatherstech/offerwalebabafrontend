// ADMIN_TABS/ArchivedTab.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector }   from "react-redux";
import { toast }                      from "react-toastify";

import ProductDetailModal from "../Shared_components/ProductDetailModal";
import {
  fetchArchivedProducts,
  restoreArchivedProduct,
  hardDeleteArchivedProduct,
} from "../ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";

// ── Formatters ───────────────────────────────────────────────────────────────
const formatIndianRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);

const getDiscountPercentage = (base, sale) => {
  if (!base || !sale || Number(sale) >= Number(base)) return 0;
  return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100);
};

const ArchivedTab = () => {
  const dispatch = useDispatch();

  const { products: archivedProducts, loading } =
    useSelector((s) => s.adminArchived);

  const safeProducts = Array.isArray(archivedProducts) ? archivedProducts : [];

  const [searchTerm,        setSearchTerm]        = useState("");
  const [selectedProducts,  setSelectedProducts]  = useState([]);
  const [detailProduct,     setDetailProduct]     = useState(null);
  const [selectAll,         setSelectAll]         = useState(false);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchArchivedProducts());
  }, [dispatch]);

  const filteredProducts = safeProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── Selection ────────────────────────────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
      setSelectAll(false);
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleRestore = (productId) => {
    const product = safeProducts.find((p) => p._id === productId);
    if (!product) return;
    dispatch(restoreArchivedProduct(product.slug))
      .unwrap()
      .then(() => toast.success(`product restored`))
      .catch(() => toast.error("Failed to restore product"));
  };

  const handlePermanentDelete = (productId) => {
    const product = safeProducts.find((p) => p._id === productId);
    if (!product) return;
    if (window.confirm(`⚠️ Permanently delete "${product.name}"? This cannot be undone!`)) {
      dispatch(hardDeleteArchivedProduct(product.slug))
        .unwrap()
        .then(() => toast.success(`"${product.name}" permanently deleted`))
        .catch(() => toast.error("Failed to delete product"));
    }
  };

  const handleBulkRestore = () => {
    if (selectedProducts.length === 0) { alert("Please select products to restore"); return; }
    const toRestore  = safeProducts.filter((p) => selectedProducts.includes(p._id));
    const names      = toRestore.map((p) => p.name).join(", ");
    if (window.confirm(`Restore ${selectedProducts.length} product(s)?\n\n${names}`)) {
      selectedProducts.forEach((productId) => handleRestore(productId));
      setSelectedProducts([]);
      setSelectAll(false);
    }
  };

  const handleBulkPermanentDelete = () => {
    if (selectedProducts.length === 0) { alert("Please select products to permanently delete"); return; }
    const toDelete = safeProducts.filter((p) => selectedProducts.includes(p._id));
    const names    = toDelete.map((p) => p.name).join(", ");
    if (window.confirm(`⚠️ PERMANENTLY DELETE ${selectedProducts.length} product(s)?\n\nThis CANNOT be undone!\n\n${names}`)) {
      selectedProducts.forEach((productId) => {
        const product = safeProducts.find((p) => p._id === productId);
        if (product) {
          dispatch(hardDeleteArchivedProduct(product.slug));
        }
      });
      setSelectedProducts([]);
      setSelectAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading archived products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Archived Products</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {safeProducts.length} archived
            </span>
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex items-center space-x-3">
              <button onClick={handleBulkRestore}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restore ({selectedProducts.length})</span>
              </button>
              <button onClick={handleBulkPermanentDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Permanently Delete ({selectedProducts.length})</span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 relative">
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search archived products..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 w-12">
                <input type="checkbox"
                  checked={selectAll && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const mainVariant = product.variants?.[0] || {};
              const thumbUrl    = mainVariant.images?.find((img) => img.isMain)?.url
                               || mainVariant.images?.[0]?.url
                               || product.images?.[0]?.url
                               || null;
              return (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {typeof product.category === "object" ? product.category?.name || "Uncategorized" : "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!product.brand || product.brand === "Generic"
                      ? <span className="text-gray-400">—</span>
                      : <span className="font-medium text-gray-700">{product.brand}</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailProduct(product)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => handleRestore(product._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Restore Product">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button onClick={() => handlePermanentDelete(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Permanently Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
            <p className="text-gray-500">Products you archive will appear here</p>
          </div>
        )}
      </div>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          categories={[]}
          onClose={() => setDetailProduct(null)}
          formatIndianRupee={formatIndianRupee}
          getDiscountPercentage={getDiscountPercentage}
        />
      )}
    </div>
  );
};

export default ArchivedTab;
// try to make components 
// // ADMIN_TABS/ArchivedTab.jsx

// import React, { useState } from 'react';
// import ProductDetailModal from '../Shared_components/ProductDetailModal';

// const ArchivedTab = ({
//   products = [], // FIXED: Default to empty array
//   onRestore,
//   onPermanentDelete,
//   formatIndianRupee,
//   getDiscountPercentage,
//   loading,
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedProducts, setSelectedProducts] = useState([]);
//   const [detailProduct, setDetailProduct] = useState(null);
//   const [selectAll, setSelectAll] = useState(false);

//   // Ensure products is always an array
//   const safeProducts = Array.isArray(products) ? products : [];

//   // Filter products based on search
//   const filteredProducts = safeProducts.filter(product => {
//     const matchesSearch = 
//       product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
//     return matchesSearch;
//   });

//   // Handle select all
//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedProducts([]);
//     } else {
//       setSelectedProducts(filteredProducts.map(p => p._id));
//     }
//     setSelectAll(!selectAll);
//   };

//   // Handle single product selection
//   const handleSelectProduct = (productId) => {
//     if (selectedProducts.includes(productId)) {
//       setSelectedProducts(selectedProducts.filter(id => id !== productId));
//       setSelectAll(false);
//     } else {
//       setSelectedProducts([...selectedProducts, productId]);
//     }
//   };

//   // Handle bulk restore
//   const handleBulkRestore = () => {
//     if (selectedProducts.length === 0) {
//       alert('Please select products to restore');
//       return;
//     }
    
//     const productsToRestore = safeProducts.filter(p => selectedProducts.includes(p._id));
//     const productNames = productsToRestore.map(p => p.name).join(', ');
    
//     if (window.confirm(`Restore ${selectedProducts.length} product(s)?\n\n${productNames}`)) {
//       // Call restore for each selected product
//       selectedProducts.forEach(productId => {
//         const product = safeProducts.find(p => p._id === productId);
//         if (product) onRestore(product._id);
//       });
//       setSelectedProducts([]);
//       setSelectAll(false);
//     }
//   };

//   // Handle bulk permanent delete
//   const handleBulkPermanentDelete = () => {
//     if (selectedProducts.length === 0) {
//       alert('Please select products to permanently delete');
//       return;
//     }
    
//     const productsToDelete = safeProducts.filter(p => selectedProducts.includes(p._id));
//     const productNames = productsToDelete.map(p => p.name).join(', ');
    
//     if (window.confirm(`⚠️ PERMANENTLY DELETE ${selectedProducts.length} product(s)?\n\nThis action CANNOT be undone!\n\n${productNames}`)) {
//       // Call permanent delete for each selected product
//       selectedProducts.forEach(productId => {
//         const product = safeProducts.find(p => p._id === productId);
//         if (product) onPermanentDelete(product._id);
//       });
//       setSelectedProducts([]);
//       setSelectAll(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading archived products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
      
//       {/* Header with bulk actions */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <h2 className="text-xl font-bold text-gray-900">Archived Products</h2>
//             <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
//               {safeProducts.length} archived
//             </span>
//           </div>
          
//           {/* Bulk action buttons */}
//           {selectedProducts.length > 0 && (
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={handleBulkRestore}
//                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                     d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//                 <span>Restore ({selectedProducts.length})</span>
//               </button>
//               <button
//                 onClick={handleBulkPermanentDelete}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//                     d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                 </svg>
//                 <span>Permanently Delete ({selectedProducts.length})</span>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Search bar */}
//         <div className="mt-4 relative">
//           <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//           </svg>
//           <input
//             type="text"
//             placeholder="Search archived products..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
//           />
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               <th className="px-6 py-4 w-12">
//                 <input
//                   type="checkbox"
//                   checked={selectAll && filteredProducts.length > 0}
//                   onChange={handleSelectAll}
//                   className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
//                 />
//               </th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const mainVariant = product.variants?.[0] || {};
//               const thumbUrl = mainVariant.images?.find(img => img.isMain)?.url 
//                 || mainVariant.images?.[0]?.url 
//                 || product.images?.[0]?.url 
//                 || null;

//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
//                   <td className="px-6 py-4">
//                     <input
//                       type="checkbox"
//                       checked={selectedProducts.includes(product._id)}
//                       onChange={() => handleSelectProduct(product._id)}
//                       className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
//                     />
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-3">
//                       {thumbUrl ? (
//                         <img src={thumbUrl} alt={product.name}
//                           className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
//                       ) : (
//                         <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
//                           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                               d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                           </svg>
//                         </div>
//                       )}
//                       <div className="min-w-0">
//                         <div className="font-medium text-gray-900 truncate">{product.name}</div>
//                         <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                       {typeof product.category === 'object' ? product.category?.name || 'Uncategorized' : 'Uncategorized'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-sm">
//                     {!product.brand || product.brand === 'Generic' ? (
//                       <span className="text-gray-400">—</span>
//                     ) : (
//                       <span className="font-medium text-gray-700">{product.brand}</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-600">
//                     {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString() : 'Unknown'}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={() => setDetailProduct(product)}
//                         className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title="View Details"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                       </button>
//                       <button
//                         onClick={() => onRestore(product._id)}
//                         className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                         title="Restore Product"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                         </svg>
//                       </button>
//                       <button
//                         onClick={() => onPermanentDelete(product._id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Permanently Delete"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                         </svg>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredProducts.length === 0 && (
//           <div className="text-center py-16">
//             <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
//             <p className="text-gray-500">Products you archive will appear here</p>
//           </div>
//         )}
//       </div>

//       {/* Product Detail Modal */}
//       {detailProduct && (
//         <ProductDetailModal
//           product={detailProduct}
//           categories={[]}
//           onClose={() => setDetailProduct(null)}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default ArchivedTab;

// uper code have api intgration 

// import React, { useState } from 'react';

// const ArchivedTab = ({ 
//   products, 
//   onRestore, 
//   onPermanentDelete,
//   formatIndianRupee,
//   getDiscountPercentage,
//   loading
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');

//   const filteredProducts = products.filter(product => 
//     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     product.title?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-500">Loading archived products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search archived products..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const mainVariant = product.variants?.[0] || {};
//               const basePrice = mainVariant.price?.base || 0;
//               const salePrice = mainVariant.price?.sale;
              
//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{product.name}</div>
//                       <div className="text-sm text-gray-500">{product.title}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
//                       {product.category?.name || 'Uncategorized'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm">
//                       {salePrice ? (
//                         <>
//                           <span className="text-gray-400 line-through text-xs mr-2">
//                             {formatIndianRupee(basePrice)}
//                           </span>
//                           <span className="font-bold text-gray-900">
//                             {formatIndianRupee(salePrice)}
//                           </span>
//                         </>
//                       ) : (
//                         <span className="font-bold text-gray-900">
//                           {formatIndianRupee(basePrice)}
//                         </span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-500">
//                     {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString() : 'Unknown'}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <button
//                         onClick={() => onRestore(product._id)}
//                         className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
//                       >
//                         Restore
//                       </button>
//                       <button
//                         onClick={() => onPermanentDelete(product._id)}
//                         className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
//                       >
//                         Delete Permanently
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredProducts.length === 0 && (
//           <div className="text-center py-16">
//             <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
//             <p className="text-gray-500">Archived products will appear here</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ArchivedTab;

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