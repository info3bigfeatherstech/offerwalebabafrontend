// ADMIN_TABS/CustomersTab.jsx
import React, { useState } from 'react';
import { useGetAllUsersQuery } from '../../ADMIN_REDUX_MANAGEMENT/userAnalyticsApi';

const CustomersTab = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]); // Array of IDs
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  const { data, isLoading, error, isFetching } = useGetAllUsersQuery({
    page,
    limit: 10,
    search: searchTerm,
    role: roleFilter,
  });

  const users = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // --- Handlers ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const shareToWhatsApp = (user) => {
    const message = `Hello ${user.name},\nCheck out our latest collection at: ${window.location.origin}`;
    const phone = user.phone || ""; 
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleBulkWhatsApp = () => {
    if (selectedUsers.length === 0) return;
    alert(`Opening WhatsApp broadcast for ${selectedUsers.length} users...`);
    // Note: WhatsApp API doesn't support multi-send in one click, 
    // usually we loop or use a business API. For now, we target the first or prompt.
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading Customers...</div>;

  return (
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="user">Customer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
            {selectedUsers.length > 0 && (
              <button 
                onClick={handleBulkWhatsApp}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.499-5.688-1.447l-6.305 1.65zm6.59-3.407c1.558.925 3.11 1.411 4.704 1.412 5.384 0 9.762-4.378 9.765-9.761.001-2.609-1.015-5.059-2.863-6.909-1.848-1.849-4.301-2.866-6.911-2.867-5.385 0-9.764 4.379-9.767 9.762-.001 1.745.456 3.447 1.32 4.957l-.821 3.003 3.073-.807z"/></svg>
                Bulk Message ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  onChange={handleSelectAll}
                  checked={selectedUsers.length === users.length && users.length > 0}
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleSelectUser(user._id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {user.name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                   </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md font-medium">🛒 {user.cartItemsCount || 0}</span>
                    <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-md font-medium">❤️ {user.wishlistCount || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => shareToWhatsApp(user)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Share to WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button 
                      onClick={() => { setActiveUser(user); setShowUserModal(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Omitted for brevity, use similar styling) */}

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
        <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomersTab;
// import React, { useState } from 'react';
// import { useGetAllUsersQuery } from '../../ADMIN_REDUX_MANAGEMENT/userAnalyticsApi';

// const CustomersTab = () => {
//   const [page, setPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [roleFilter, setRoleFilter] = useState('');
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showUserModal, setShowUserModal] = useState(false);

//   const { data, isLoading, error, isFetching } = useGetAllUsersQuery({
//     page,
//     limit: 10,
//     search: searchTerm,
//     role: roleFilter,
//   });

//   const users = data?.data || [];
//   const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//     setPage(1);
//   };

//   const handleRoleChange = (e) => {
//     setRoleFilter(e.target.value);
//     setPage(1);
//   };

//   const viewUserDetails = (user) => {
//     setSelectedUser(user);
//     setShowUserModal(true);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading customers...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     console.error('[CustomersTab] Error:', error);
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
//         <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//         <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Customers</h3>
//         <p className="text-red-600">{error?.data?.message || 'Please try again later'}</p>
//         <button 
//           onClick={() => window.location.reload()} 
//           className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header & Filters */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center space-x-4">
//             <h2 className="text-xl font-bold text-gray-900">Customer Base</h2>
//             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
//               {pagination.total} users
//             </span>
//           </div>
          
//           {/* Role Filter - Mobile Optimized */}
//           <select
//             value={roleFilter}
//             onChange={handleRoleChange}
//             className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
//           >
//             <option value="">All Roles</option>
//             <option value="user">Customer</option>
//             <option value="wholesaler">Wholesaler</option>
//             <option value="admin">Admin</option>
//           </select>
//         </div>

//         {/* Search Bar */}
//         <div className="mt-4 relative">
//           <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//           </svg>
//           <input
//             type="text"
//             placeholder="Search by name, email or phone..."
//             value={searchTerm}
//             onChange={handleSearch}
//             className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
//           />
//         </div>
//       </div>

//       {/* Mobile Card View (shows on mobile) */}
//       <div className="block lg:hidden space-y-4">
//         {users.map((user) => (
//           <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//             <div className="flex items-start justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
//                   {user.name?.charAt(0).toUpperCase() || 'U'}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-semibold text-gray-900 truncate">{user.name || 'N/A'}</h3>
//                   <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                   {user.phone && <p className="text-xs text-gray-400 mt-1">{user.phone}</p>}
//                 </div>
//               </div>
//               <button
//                 onClick={() => viewUserDetails(user)}
//                 className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </button>
//             </div>
            
//             <div className="mt-3 flex flex-wrap gap-2">
//               <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
//                 {user.isVerified ? '✓ Verified' : '⏳ Pending'}
//               </span>
//               <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
//                 {user.role || 'Customer'}
//               </span>
//               <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
//                 🛒 {user.cartItemsCount || 0} items
//               </span>
//               <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-xs">
//                 ❤️ {user.wishlistCount || 0} items
//               </span>
//             </div>
            
//             <div className="mt-3 text-xs text-gray-400">
//               Joined: {new Date(user.createdAt).toLocaleDateString()}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Desktop Table View (hidden on mobile) */}
//       <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full min-w-[800px]">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart/Wishlist</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
//               <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {users.map((user) => (
//               <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
//                       {user.name?.charAt(0).toUpperCase() || 'U'}
//                     </div>
//                     <div className="min-w-0">
//                       <div className="font-medium text-gray-900 truncate max-w-[200px]">{user.name || 'N/A'}</div>
//                       <div className="text-sm text-gray-500 truncate max-w-[200px]">{user.email}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4">
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
//                     {user.isVerified ? 'Verified' : 'Pending'}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-700 capitalize">{user.role || 'Customer'}</td>
//                 <td className="px-6 py-4">
//                   <div className="flex gap-2 text-xs">
//                     <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full">🛒 {user.cartItemsCount || 0}</span>
//                     <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full">❤️ {user.wishlistCount || 0}</span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
//                 <td className="px-6 py-4 text-right">
//                   <button
//                     onClick={() => viewUserDetails(user)}
//                     className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
//                     title="View Details"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Loading more indicator */}
//       {isFetching && (
//         <div className="flex justify-center py-4">
//           <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
//         </div>
//       )}

//       {/* Pagination */}
//       {pagination.totalPages > 1 && (
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//           <div className="text-sm text-gray-500">
//             Showing {users.length} of {pagination.total} users
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={() => setPage(p => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Previous
//             </button>
//             <div className="flex items-center gap-1">
//               {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
//                 let pageNum;
//                 if (pagination.totalPages <= 5) {
//                   pageNum = i + 1;
//                 } else if (page <= 3) {
//                   pageNum = i + 1;
//                 } else if (page >= pagination.totalPages - 2) {
//                   pageNum = pagination.totalPages - 4 + i;
//                 } else {
//                   pageNum = page - 2 + i;
//                 }
                
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setPage(pageNum)}
//                     className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
//                       page === pageNum
//                         ? 'bg-blue-600 text-white'
//                         : 'text-gray-700 hover:bg-gray-100'
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               })}
//             </div>
//             <button
//               onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
//               disabled={page === pagination.totalPages}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {users.length === 0 && !isFetching && (
//         <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
//           <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
//           <p className="text-gray-500">Try adjusting your search or filters</p>
//         </div>
//       )}

//       {/* User Details Modal */}
//       {showUserModal && selectedUser && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowUserModal(false)}>
//           <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//             <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
//               <h3 className="text-xl font-bold text-gray-900">Customer Details</h3>
//               <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
//                   {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
//                 </div>
//                 <div>
//                   <h4 className="text-lg font-semibold text-gray-900">{selectedUser.name || 'N/A'}</h4>
//                   <p className="text-gray-500">{selectedUser.email}</p>
//                   {selectedUser.phone && <p className="text-gray-500">{selectedUser.phone}</p>}
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Role</p>
//                   <p className="font-medium capitalize">{selectedUser.role || 'Customer'}</p>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Status</p>
//                   <p className={`font-medium ${selectedUser.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
//                     {selectedUser.isVerified ? 'Verified' : 'Pending'}
//                   </p>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Cart Items</p>
//                   <p className="font-medium">{selectedUser.cartItemsCount || 0}</p>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Wishlist Items</p>
//                   <p className="font-medium">{selectedUser.wishlistCount || 0}</p>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Joined</p>
//                   <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <p className="text-xs text-gray-500">Last Active</p>
//                   <p className="font-medium">{new Date(selectedUser.lastActive).toLocaleDateString()}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomersTab;

// // ADMIN_TABS/CustomersTab.jsx
// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// // Assuming you have a slice for customers
// // import { fetchAllCustomers } from "../ADMIN_REDUX_MANAGEMENT/adminCustomerSlice"; 

// const CustomersTab = () => {
//   const dispatch = useDispatch();
//   const { customers, loading } = useSelector((s) => s.adminCustomers || { customers: [] });

//   const [searchTerm, setSearchTerm] = useState("");

// //   useEffect(() => {
// //     dispatch(fetchAllCustomers());
// //   }, [dispatch]);

//   const filteredCustomers = customers.filter((user) =>
//     user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.email?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading customers...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <h2 className="text-xl font-bold text-gray-900">Customer Base</h2>
//             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
//               {customers.length} users
//             </span>
//           </div>
//         </div>
//         <div className="mt-4 relative">
//           <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//           </svg>
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
//               <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredCustomers.map((user) => (
//               <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
//                       {user.name?.charAt(0).toUpperCase() || "U"}
//                     </div>
//                     <div className="min-w-0">
//                       <div className="font-medium text-gray-900 truncate">{user.name}</div>
//                       <div className="text-sm text-gray-500 truncate">{user.email}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4">
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     user.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
//                   }`}>
//                     {user.isVerified ? "Verified" : "Pending"}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-700 capitalize">
//                   {user.role || "Customer"}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-600">
//                   {new Date(user.createdAt).toLocaleDateString()}
//                 </td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                     </svg>
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {filteredCustomers.length === 0 && (
//           <div className="text-center py-16">
//             <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
//             <p className="text-gray-500">Try adjusting your search terms</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CustomersTab;