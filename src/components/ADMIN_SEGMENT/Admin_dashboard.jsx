
// ADMIN_SEGMENT/Admin_dashboard.jsx
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams }                       from "react-router-dom";
import { useSelector }                           from "react-redux";
import { TAB_REGISTRY }                          from "./TabRegistry";

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab]       = useState(searchParams.get("tab") || "products");

  // Badge counts — read from Redux, no fetching here
  const productsBadge = useSelector((s) => s.adminGetProducts?.products?.length || 0);
  const archivedBadge = useSelector((s) => s.adminArchived?.products?.length    || 0);

  const BADGE_MAP = {
    products: productsBadge,
    archived: archivedBadge,
  };

  // Sync tab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Find active tab component
  const activeTabConfig = TAB_REGISTRY.find((t) => t.id === activeTab);
  const TabComponent    = activeTabConfig?.component ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8">

          {/* Top bar — logo only, StatsCards now lives in ProductsTab */}
          <div className="flex items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
                <p className="text-sm text-gray-500">Manage your products</p>
              </div>
            </div>
          </div>

          {/* Tab bar — driven entirely by TAB_REGISTRY */}
          <div className="flex space-x-6">
            {TAB_REGISTRY.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`pb-4 px-1 font-medium cursor-pointer text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                  {BADGE_MAP[tab.id] != null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {BADGE_MAP[tab.id]}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {TabComponent && <TabComponent onSwitchTab={handleTabChange} />}
        </Suspense>
      </div>

    </div>
  );
};

export default AdminDashboard;
// working code but trying to separarte tabs routes and make it independent 
// // ADMIN_SEGMENT/Admin_dashboard.jsx

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";

// import ProductsTab      from "./ADMIN_TABS/ProductsTab";
// import AnalyticsTab     from "./ADMIN_TABS/AnalyticsTab";
// import ArchivedTab      from "./ADMIN_TABS/ArchivedTab";
// import StatsCards       from "./TOPBAR/StatsCards";
// import ProductModal     from "./PRODUCT_MODAL_SEGMENT/ProductModal";
// import EditProductModal from "./PRODUCT_MODAL_SEGMENT/EditProductModal";

// import { fetchCategories }    from "./ADMIN_REDUX_MANAGEMENT/categoriesSlice";
// import { 
//   fetchProducts, 
//   optimisticUpdateProduct,
//   fetchLowStockProducts 
// } from "./ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice";
// import { fetchArchivedProducts } from "./ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";
// import {
//   softDeleteProduct,
//   toggleFeaturedProduct,
//   changeProductStatus,
//   clearErrors,
// } from "./ADMIN_REDUX_MANAGEMENT/adminEditProductSlice";
// import { restoreArchivedProduct, hardDeleteArchivedProduct } from "./ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";

// import { toast } from "react-toastify";

// const AdminDashboard = () => {
//   const dispatch = useDispatch();

//   const { products, loading: productsLoading, error: productsError } =
//     useSelector((state) => state.adminGetProducts);

//   // Get low stock data from the slice
//   const { 
//     products: lowStockProducts, 
//     total: lowStockTotal,
//     loading: lowStockLoading 
//   } = useSelector((state) => state.adminGetProducts.lowStockProducts || { 
//     products: [], 
//     total: 0,
//     loading: false 
//   });

//   const { products: archivedProducts, loading: archivedLoading } =
//     useSelector((state) => state.adminArchived);

//   const { actionLoading, actionError, deleteLoading, deleteSuccess } =
//     useSelector((state) => state.adminEditProduct);

//   const { categories } = useSelector((state) => state.categories);

//   const [searchParams, setSearchParams] = useSearchParams();
//   const [activeTab,    setActiveTab]    = useState(searchParams.get("tab") || "products");

//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal,    setShowEditModal]    = useState(false);
//   const [selectedProduct,  setSelectedProduct]  = useState(null);

//   const [brands, setBrands] = useState([
//     "Sony", "Samsung", "Apple", "Nike", "Adidas", "Generic",
//   ]);

//   // ── Initial fetch ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     dispatch(fetchProducts({ page: 1, limit: 50 }));
//     dispatch(fetchCategories());
//     // Fetch low stock products count for the stat card
//     dispatch(fetchLowStockProducts({ page: 1, limit: 1 })); // We only need the total count
//   }, [dispatch]);

//   useEffect(() => {
//     if (activeTab === "archived") dispatch(fetchArchivedProducts());
//   }, [activeTab, dispatch]);

//   // ── Error handling ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (productsError) toast.error(`Failed to load products: ${productsError}`);
//   }, [productsError]);

//   useEffect(() => {
//     if (actionError) {
//       toast.error(`Action failed: ${actionError}`);
//       dispatch(clearErrors());
//     }
//   }, [actionError, dispatch]);

//   useEffect(() => {
//     if (deleteSuccess) {
//       toast.success("Product archived successfully");
//       dispatch(fetchArchivedProducts());
//       // Refresh low stock count when products change
//       dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
//     }
//   }, [deleteSuccess, dispatch]);

//   // ── URL tab sync ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const tabFromUrl = searchParams.get("tab");
//     if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
//   }, [searchParams]);

//   const handleTabChange = (tab) => { setActiveTab(tab); setSearchParams({ tab }); };

//   // ── Product actions ───────────────────────────────────────────────────────
//   const handleSoftDelete = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm(`Archive "${product.name}"? It will be hidden from the website.`)) {
//       dispatch(softDeleteProduct(product.slug))
//         .unwrap()
//         .catch(() => {
//           dispatch(fetchProducts({ page: 1, limit: 50 }));
//           dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
//           toast.error("Failed to archive product");
//         });
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     const product = archivedProducts?.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm(`⚠️ Permanently delete "${product.name}"? This cannot be undone!`)) {
//       dispatch(hardDeleteArchivedProduct(product.slug));
//     }
//   };

//   const handleRestore = (productId) => {
//     const product = archivedProducts?.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(restoreArchivedProduct(product.slug));
//   };

//   const toggleFeatured = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: !product.isFeatured }));
//     dispatch(toggleFeaturedProduct({ product }))
//       .unwrap()
//       .catch(() => {
//         dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: product.isFeatured }));
//         toast.error("Failed to toggle featured");
//       });
//   };

//   const changeStatus = (productId, newStatus) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     const prevStatus = product.status;
//     dispatch(optimisticUpdateProduct({ _id: productId, status: newStatus }));
//     dispatch(changeProductStatus({ product, status: newStatus }))
//       .unwrap()
//       .catch(() => {
//         dispatch(optimisticUpdateProduct({ _id: productId, status: prevStatus }));
//         toast.error("Failed to change status");
//       });
//   };

//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // ── Derived stats ─────────────────────────────────────────────────────────
//   const activeProducts   = products.filter((p) => p.status   === "active").length;
//   const featuredProducts = products.filter((p) => p.isFeatured).length;
//   // Use the total from the low stock API response for the stat card
//   const lowStockCount = lowStockTotal || 0;

//   const formatIndianRupee = (amount) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency", currency: "INR",
//       minimumFractionDigits: 0, maximumFractionDigits: 0,
//     }).format(amount);

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || Number(sale) >= Number(base)) return 0;
//     return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

//       {/* Action Loading Overlay */}
//       {(actionLoading || deleteLoading) && (
//         <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
//             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-sm font-medium text-gray-700">Processing...</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Manage your products</p>
//               </div>
//             </div>

//             <StatsCards
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts?.length || 0}
//               // Use the low stock count from the API
//               lowStockProducts={lowStockCount}
//               onViewArchived={() => handleTabChange("archived")}
//             />
//           </div>

//           <div className="flex space-x-6">
//             {[
//               { id: "products",  name: "Products",  icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
//               { id: "analytics", name: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
//               { id: "archived",  name: "Archived",  icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
//             ].map((tab) => (
//               <button key={tab.id} onClick={() => handleTabChange(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}>
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === "products" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {products.length}
//                     </span>
//                   )}
//                   {tab.id === "archived" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProducts?.length || 0}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="max-w-7xl mx-auto p-8">
//         {activeTab === "products" && (
//           <ProductsTab
//             products={products}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={productsLoading}
//             actionLoading={actionLoading}
//             // Pass low stock products if you want to show them in a separate section
//             lowStockProducts={lowStockProducts}
//             lowStockLoading={lowStockLoading}
//             onCategoryChange={fetchCategories}
//           />
//         )}
//         {activeTab === "analytics" && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}
//         {activeTab === "archived" && (
//           <ArchivedTab
//             products={archivedProducts || []}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={archivedLoading}
//           />
//         )}
//       </div>

//       {/* Create Product Modal */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => {
//             setShowProductModal(false);
//             dispatch(fetchProducts({ page: 1, limit: 50 }));
//             dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {/* Edit Product Modal */}
//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//             dispatch(fetchProducts({ page: 1, limit: 50 }));
//             dispatch(fetchLowStockProducts());
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;

// FIX THE ARCHIEVD SOFTDELETE ISSUE 
// // ADMIN_SEGMENT/Admin_dashboard.jsx

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";

// import ProductsTab      from "./ADMIN_TABS/ProductsTab";
// import AnalyticsTab     from "./ADMIN_TABS/AnalyticsTab";
// import ArchivedTab      from "./ADMIN_TABS/ArchivedTab";
// import StatsCards       from "./TOPBAR/StatsCards";
// import ProductModal     from "./PRODUCT_MODAL_SEGMENT/ProductModal";
// import EditProductModal from "./PRODUCT_MODAL_SEGMENT/EditProductModal";

// import { fetchCategories }    from "./ADMIN_REDUX_MANAGEMENT/categoriesSlice";
// import { fetchProducts, optimisticUpdateProduct } from "./ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice";
// import { fetchArchivedProducts } from "./ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";
// import {
//   softDeleteProduct,
//   toggleFeaturedProduct,
//   changeProductStatus,
//   clearErrors,
// } from "./ADMIN_REDUX_MANAGEMENT/adminEditProductSlice";
// import { restoreArchivedProduct, hardDeleteArchivedProduct } from "./ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";

// import { toast } from "react-toastify";

// const AdminDashboard = () => {
//   const dispatch = useDispatch();

//   const { products, loading: productsLoading, error: productsError } =
//     useSelector((state) => state.adminGetProducts);

//   const { archivedList: archivedProducts, loading: archivedLoading } =
//     useSelector((state) => state.adminArchived);

//   const { actionLoading, actionError, deleteLoading, deleteSuccess } =
//     useSelector((state) => state.adminEditProduct);

//   const { categories } = useSelector((state) => state.categories);

//   const [searchParams, setSearchParams] = useSearchParams();
//   const [activeTab,    setActiveTab]    = useState(searchParams.get("tab") || "products");

//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal,    setShowEditModal]    = useState(false);
//   const [selectedProduct,  setSelectedProduct]  = useState(null);

//   const [brands, setBrands] = useState([
//     "Sony", "Samsung", "Apple", "Nike", "Adidas", "Generic",
//   ]);

//   // ── Initial fetch ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     dispatch(fetchProducts({ page: 1, limit: 50 }));
//     dispatch(fetchCategories());
//   }, [dispatch]);

//   useEffect(() => {
//     if (activeTab === "archived") dispatch(fetchArchivedProducts());
//   }, [activeTab, dispatch]);

//   // ── Error handling ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (productsError) toast.error(`Failed to load products: ${productsError}`);
//   }, [productsError]);

//   useEffect(() => {
//     if (actionError) {
//       toast.error(`Action failed: ${actionError}`);
//       dispatch(clearErrors());
//     }
//   }, [actionError, dispatch]);

//   useEffect(() => {
//     if (deleteSuccess) {
//       toast.success("Product archived successfully");
//       dispatch(fetchProducts({ page: 1, limit: 50 }));
//     }
//   }, [deleteSuccess, dispatch]);

//   // ── URL tab sync ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const tabFromUrl = searchParams.get("tab");
//     if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
//   }, [searchParams]);

//   const handleTabChange = (tab) => { setActiveTab(tab); setSearchParams({ tab }); };

//   // ── Product actions ───────────────────────────────────────────────────────
//   const handleSoftDelete = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm(`Archive "${product.name}"? It will be hidden from the website.`)) {
//       dispatch(softDeleteProduct(product.slug));
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm(`⚠️ Permanently delete "${product.name}"? This cannot be undone!`)) {
//       dispatch(hardDeleteArchivedProduct(product.slug));
//     }
//   };

//   const handleRestore = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(restoreArchivedProduct(product.slug));
//   };

//   // Optimistic: featured flips instantly, reverts on failure
//   const toggleFeatured = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: !product.isFeatured }));
//     dispatch(toggleFeaturedProduct({ product }))
//       .unwrap()
//       .catch(() => {
//         dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: product.isFeatured }));
//         toast.error("Failed to toggle featured");
//       });
//   };

//   // Optimistic: status changes instantly, reverts on failure
//   const changeStatus = (productId, newStatus) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     const prevStatus = product.status;
//     dispatch(optimisticUpdateProduct({ _id: productId, status: newStatus }));
//     dispatch(changeProductStatus({ product, status: newStatus }))
//       .unwrap()
//       .catch(() => {
//         dispatch(optimisticUpdateProduct({ _id: productId, status: prevStatus }));
//         toast.error("Failed to change status");
//       });
//   };

//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // ── Derived stats ─────────────────────────────────────────────────────────
//   const activeProducts   = products.filter((p) => p.status   === "active").length;
//   const featuredProducts = products.filter((p) => p.isFeatured).length;

//   const formatIndianRupee = (amount) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency", currency: "INR",
//       minimumFractionDigits: 0, maximumFractionDigits: 0,
//     }).format(amount);

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || Number(sale) >= Number(base)) return 0;
//     return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

//       {/* Action Loading Overlay */}
//       {(actionLoading || deleteLoading) && (
//         <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
//             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-sm font-medium text-gray-700">Processing...</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Manage your products</p>
//               </div>
//             </div>

//             <StatsCards
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts}
//               onViewArchived={() => handleTabChange("archived")}
//             />
//           </div>

//           <div className="flex space-x-6">
//             {[
//               { id: "products",  name: "Products",  icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
//               { id: "analytics", name: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
//               { id: "archived",  name: "Archived",  icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
//             ].map((tab) => (
//               <button key={tab.id} onClick={() => handleTabChange(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}>
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === "products" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {products.length}
//                     </span>
//                   )}
//                   {tab.id === "archived" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProducts}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="max-w-7xl mx-auto p-8">
//         {activeTab === "products" && (
//           <ProductsTab
//             products={products}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={productsLoading}
//             actionLoading={actionLoading}
//           />
//         )}
//         {activeTab === "analytics" && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}
//         {activeTab === "archived" && (
//           <ArchivedTab
//             products={archivedProducts}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={archivedLoading}
//           />
//         )}
//       </div>

//       {/* Create Product Modal */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => {
//             setShowProductModal(false);
//             dispatch(fetchProducts({ page: 1, limit: 50 }));
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {/* Edit Product Modal */}
//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//             dispatch(fetchProducts({ page: 1, limit: 50 }));
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;
// start again 

// // ADMIN_SEGMENT/Admin_dashboard.jsx

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";

// import ProductsTab from "./ADMIN_TABS/ProductsTab";
// import AnalyticsTab from "./ADMIN_TABS/AnalyticsTab";
// import ArchivedTab from "./ADMIN_TABS/ArchivedTab";
// import StatsCards from "./TOPBAR/StatsCards";
// import ProductModal from "./PRODUCT_MODAL_SEGMENT/ProductModal";
// import EditProductModal from "./PRODUCT_MODAL_SEGMENT/EditProductModal";

// import {
//   fetchAllProducts,
//   fetchArchivedProducts,
//   softDeleteProduct,
//   hardDeleteProduct,
//   restoreProduct,
//   toggleFeaturedProduct,
//   changeProductStatus,
//   clearErrors,
// } from "./ADMIN_REDUX_MANAGEMENT/adminProductsSlice";

// import { fetchCategories } from "./ADMIN_REDUX_MANAGEMENT/categoriesSlice";
// import { toast } from "react-toastify";

// const AdminDashboard = () => {
//   const dispatch = useDispatch();

//   // ── Redux: products ──────────────────────────────────────────
//   const {
//     products,
//     productsLoading,
//     productsLoaded,
//     archivedProducts,
//     archivedLoading,
//     archivedLoaded,
//     actionError,
//     actionLoading,
//   } = useSelector((state) => state.adminProducts);

//   // ── Redux: categories ────────────────────────────────────────
//   const {
//     categories,
//     loaded: categoriesLoaded,
//     loading: categoriesLoading,
//   } = useSelector((state) => state.categories);

//   // ── URL tab param ────────────────────────────────────────────
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [activeTab, setActiveTab] = useState(
//     searchParams.get("tab") || "products"
//   );

//   // ── Modal state ──────────────────────────────────────────────
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);

//   // ── Brands local state ───────────────────────────────────────
//   const [brands, setBrands] = useState([
//     "Sony", "Samsung", "Apple", "Nike", "Adidas", "Generic",
//   ]);

//   // ── FIX: fetch products on mount (only once) ─────────────────
//   useEffect(() => {
//     dispatch(fetchAllProducts());
//     dispatch(fetchCategories());
//   }, []); // ← empty deps: runs ONCE on mount, no race condition

//   // ── Fetch archived only when tab first opens ─────────────────
//   useEffect(() => {
//     if (activeTab === "archived" && !archivedLoaded) {
//       dispatch(fetchArchivedProducts());
//     }
//   }, [activeTab]);

//   // ── Sync tab with URL ────────────────────────────────────────
//   useEffect(() => {
//     const tabFromUrl = searchParams.get("tab");
//     if (tabFromUrl && tabFromUrl !== activeTab) {
//       setActiveTab(tabFromUrl);
//     }
//   }, [searchParams]);

//   // ── Show actionError as alert (status/featured change failed) ─
//   useEffect(() => {
//     if (actionError) {
//       toast.error(`❌ Action failed: ${actionError}`);
//       dispatch(clearErrors());
//     }
//   }, [actionError]);

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setSearchParams({ tab });
//   };

//   // ── Product actions ──────────────────────────────────────────
//   const handleSoftDelete = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm("Archive this product? It will be hidden from the website.")) {
//       dispatch(softDeleteProduct(product.slug));
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm("⚠️ Permanently delete? This cannot be undone!")) {
//       dispatch(hardDeleteProduct(product.slug));
//     }
//   };

//   const handleRestore = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(restoreProduct(product.slug));
//   };

//   const toggleFeatured = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     // Pass FULL product object — thunk uses product.slug + variant skus from Redux state
//     // This avoids GET /admin/products/${slug} call which was hitting wrong route
//     dispatch(toggleFeaturedProduct({ product }));
//   };

//   const changeStatus = (productId, newStatus) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     // Pass FULL product object — thunk uses product.slug + variant skus from Redux state
//     dispatch(changeProductStatus({ product, status: newStatus }));
//   };

//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // ── Derived stats ────────────────────────────────────────────
//   const activeProducts = products.filter((p) => p.status === "active").length;
//   const featuredProducts = products.filter((p) => p.isFeatured).length;

//   const formatIndianRupee = (amount) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || sale >= base) return 0;
//     return Math.round(((base - sale) / base) * 100);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

//       {/* Action Loading Overlay (for status/featured changes) */}
//       {actionLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
//             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-sm font-medium text-gray-700">Updating...</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Craft your products with precision</p>
//               </div>
//             </div>

//             <StatsCards
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts.length}
//               onViewArchived={() => handleTabChange("archived")}
//             />
//           </div>

//           <div className="flex space-x-6">
//             {[
//               { id: "products", name: "Products", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
//               { id: "analytics", name: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
//               { id: "archived", name: "Archived", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => handleTabChange(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === "products" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {products.length}
//                     </span>
//                   )}
//                   {tab.id === "archived" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProducts.length}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-8">
//         {activeTab === "products" && (
//           <ProductsTab
//             products={products}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={productsLoading}
//           />
//         )}
//         {activeTab === "analytics" && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}
//         {activeTab === "archived" && (
//           <ArchivedTab
//             products={archivedProducts}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={archivedLoading}
//           />
//         )}
//       </div>

//       {/* Modals */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => setShowProductModal(false)}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;

// Fixed some issue like we cant able to change the status getting the issue >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// // ADMIN_SEGMENT/Admin_dashboard.jsx

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";

// import ProductsTab from "./ADMIN_TABS/ProductsTab";
// import AnalyticsTab from "./ADMIN_TABS/AnalyticsTab";
// import ArchivedTab from "./ADMIN_TABS/ArchivedTab";
// import StatsCards from "./TOPBAR/StatsCards";
// import ProductModal from "./PRODUCT_MODAL_SEGMENT/ProductModal";
// import EditProductModal from "./PRODUCT_MODAL_SEGMENT/EditProductModal";

// import {
//   fetchAllProducts,
//   fetchArchivedProducts,
//   softDeleteProduct,
//   hardDeleteProduct,
//   restoreProduct,
//   toggleFeaturedProduct,
//   changeProductStatus,
//   clearErrors,
// } from "./ADMIN_REDUX_MANAGEMENT/adminProductsSlice";

// import { fetchCategories } from "./ADMIN_REDUX_MANAGEMENT/categoriesSlice";

// const AdminDashboard = () => {
//   const dispatch = useDispatch();

//   // ── Redux: products ──────────────────────────────────────────
//   const {
//     products,
//     productsLoading,
//     productsLoaded,
//     archivedProducts,
//     archivedLoading,
//     archivedLoaded,
//     actionError,
//     actionLoading,
//   } = useSelector((state) => state.adminProducts);

//   // ── Redux: categories ────────────────────────────────────────
//   const {
//     categories,
//     loaded: categoriesLoaded,
//     loading: categoriesLoading,
//   } = useSelector((state) => state.categories);

//   // ── URL tab param ────────────────────────────────────────────
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [activeTab, setActiveTab] = useState(
//     searchParams.get("tab") || "products"
//   );

//   // ── Modal state ──────────────────────────────────────────────
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);

//   // ── Brands local state ───────────────────────────────────────
//   const [brands, setBrands] = useState([
//     "Sony", "Samsung", "Apple", "Nike", "Adidas", "Generic",
//   ]);

//   // ── FIX: fetch products on mount (only once) ─────────────────
//   useEffect(() => {
//     dispatch(fetchAllProducts());
//     dispatch(fetchCategories());
//   }, []); // ← empty deps: runs ONCE on mount, no race condition

//   // ── Fetch archived only when tab first opens ─────────────────
//   useEffect(() => {
//     if (activeTab === "archived" && !archivedLoaded) {
//       dispatch(fetchArchivedProducts());
//     }
//   }, [activeTab]);

//   // ── Sync tab with URL ────────────────────────────────────────
//   useEffect(() => {
//     const tabFromUrl = searchParams.get("tab");
//     if (tabFromUrl && tabFromUrl !== activeTab) {
//       setActiveTab(tabFromUrl);
//     }
//   }, [searchParams]);

//   // ── Show actionError as alert (status/featured change failed) ─
//   useEffect(() => {
//     if (actionError) {
//       alert(`❌ Action failed: ${actionError}`);
//       dispatch(clearErrors());
//     }
//   }, [actionError]);

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setSearchParams({ tab });
//   };

//   // ── Product actions ──────────────────────────────────────────
//   const handleSoftDelete = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm("Archive this product? It will be hidden from the website.")) {
//       dispatch(softDeleteProduct(product.slug));
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     if (window.confirm("⚠️ Permanently delete? This cannot be undone!")) {
//       dispatch(hardDeleteProduct(product.slug));
//     }
//   };

//   const handleRestore = (productId) => {
//     const product = archivedProducts.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(restoreProduct(product.slug));
//   };

//   const toggleFeatured = (productId) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(toggleFeaturedProduct({ slug: product.slug, isFeatured: product.isFeatured }));
//   };

//   const changeStatus = (productId, newStatus) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;
//     dispatch(changeProductStatus({ slug: product.slug, status: newStatus }));
//   };

//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // ── Derived stats ────────────────────────────────────────────
//   const activeProducts = products.filter((p) => p.status === "active").length;
//   const featuredProducts = products.filter((p) => p.isFeatured).length;

//   const formatIndianRupee = (amount) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || sale >= base) return 0;
//     return Math.round(((base - sale) / base) * 100);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

//       {/* Action Loading Overlay (for status/featured changes) */}
//       {actionLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
//             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-sm font-medium text-gray-700">Updating...</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Craft your products with precision</p>
//               </div>
//             </div>

//             <StatsCards
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts.length}
//               onViewArchived={() => handleTabChange("archived")}
//             />
//           </div>

//           <div className="flex space-x-6">
//             {[
//               { id: "products", name: "Products", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
//               { id: "analytics", name: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
//               { id: "archived", name: "Archived", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => handleTabChange(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === "products" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {products.length}
//                     </span>
//                   )}
//                   {tab.id === "archived" && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProducts.length}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-8">
//         {activeTab === "products" && (
//           <ProductsTab
//             products={products}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={productsLoading}
//           />
//         )}
//         {activeTab === "analytics" && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}
//         {activeTab === "archived" && (
//           <ArchivedTab
//             products={archivedProducts}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             loading={archivedLoading}
//           />
//         )}
//       </div>

//       {/* Modals */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => setShowProductModal(false)}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//           }}
//           brands={brands}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;

// CODE UPSIDE API INTEGRATION>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// import React, { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom'; // Import this
// import ProductsTab from './ADMIN_TABS/ProductsTab';
// import AnalyticsTab from './ADMIN_TABS/AnalyticsTab';
// import ArchivedTab from './ADMIN_TABS/ArchivedTab';
// import StatsCards from './TOPBAR/StatsCards';
// import ProductModal from './PRODUCT_MODAL_SEGMENT/ProductModal';
// import EditProductModal from './PRODUCT_MODAL_SEGMENT/EditProductModal';

// const AdminDashboard = () => {
//   // ========== URL PARAMS FOR TAB ==========
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'products');
  
//   // ========== TRACK API CALLS (VERIFICATION CODE) ==========
//   const [apiCalls, setApiCalls] = useState({
//     products: true, // Initially loaded
//     analytics: false,
//     archived: false
//   });
  
//   // Track which tabs have been loaded
//   const [loadedTabs, setLoadedTabs] = useState({
//     products: true, // Products already loaded
//     analytics: false,
//     archived: false
//   });

//   // ========== VERIFICATION FUNCTION ==========
//   const simulateApiCall = (tabName) => {
//     console.log(`%c🚀 API CALL: ${tabName} data fetched at ${new Date().toLocaleTimeString()}`, 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
//     setApiCalls(prev => ({ ...prev, [tabName]: true }));
//   };

//   // ========== SIMULATE API CALLS WHEN TABS ARE LOADED ==========
//   useEffect(() => {
//     if (loadedTabs.analytics && !apiCalls.analytics) {
//       simulateApiCall('analytics');
//       // Yahan actual API call karo
//       // fetchAnalyticsData();
//     }
//     if (loadedTabs.archived && !apiCalls.archived) {
//       simulateApiCall('archived');
//       // Yahan actual API call karo
//       // fetchArchivedData();
//     }
//   }, [loadedTabs.analytics, loadedTabs.archived, apiCalls.analytics, apiCalls.archived]);

//   // ========== SYNC TAB WITH URL ==========
//   useEffect(() => {
//     const tabFromUrl = searchParams.get('tab');
//     if (tabFromUrl && tabFromUrl !== activeTab) {
//       setActiveTab(tabFromUrl);
//     }
//   }, [searchParams]);

//   // ========== HANDLE TAB CHANGE ==========
//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setSearchParams({ tab });
    
//     // Mark tab as loaded when first visited
//     if (!loadedTabs[tab]) {
//       setLoadedTabs(prev => ({ ...prev, [tab]: true }));
//     }
//   };

//   // ========== STATE ==========
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
  
//   // Products Data (your existing data)
//   const [products, setProducts] = useState([
//     {
//       _id: '1',
//       name: 'Premium Wireless Headphones',
//       title: 'Noise Cancelling Bluetooth Headphones',
//       description: 'Experience crystal clear sound with 40h battery life',
//       brand: 'Sony',
//       category: { _id: '1', name: 'Electronics' },
//       price: { base: 29999, sale: 19999, costPrice: 15000 },
//       inventory: { quantity: 45, lowStockThreshold: 5, trackInventory: true },
//       shipping: { weight: 0.5, dimensions: { length: 20, width: 15, height: 8 } },
//       images: [],
//       attributes: [{ id: '1', key: 'Battery Life', value: '40 hours' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 1247 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '2',
//       name: 'Premium Cotton T-Shirt',
//       title: 'Premium Quality Cotton T-Shirt',
//       description: '100% organic cotton, comfortable fit',
//       brand: 'Nike',
//       category: { _id: '2', name: 'Clothing' },
//       price: { base: 3999, sale: 2499, costPrice: 1200 },
//       inventory: { quantity: 128, lowStockThreshold: 10, trackInventory: true },
//       shipping: { weight: 0.2, dimensions: { length: 30, width: 20, height: 2 } },
//       images: [],
//       attributes: [{ id: '2', key: 'Material', value: 'Cotton' }, { id: '3', key: 'Size', value: 'S,M,L,XL' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 3456 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '3',
//       name: 'Smart Watch Series 5',
//       title: 'Fitness Tracker Smart Watch',
//       description: 'Track your heart rate, steps, and sleep quality',
//       brand: 'Samsung',
//       category: { _id: '1', name: 'Electronics' },
//       price: { base: 15999, sale: 12999, costPrice: 10000 },
//       inventory: { quantity: 8, lowStockThreshold: 10, trackInventory: true },
//       shipping: { weight: 0.3, dimensions: { length: 10, width: 10, height: 5 } },
//       images: [],
//       attributes: [{ id: '4', key: 'Display', value: '1.5 inches' }, { id: '5', key: 'Battery', value: '7 days' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 892 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '4',
//       name: 'Running Shoes',
//       title: 'Lightweight Running Shoes',
//       description: 'Professional running shoes with cushioning',
//       brand: 'Adidas',
//       category: { _id: '2', name: 'Clothing' },
//       price: { base: 8999, sale: 5999, costPrice: 3500 },
//       inventory: { quantity: 56, lowStockThreshold: 15, trackInventory: true },
//       shipping: { weight: 0.8, dimensions: { length: 35, width: 25, height: 15 } },
//       images: [],
//       attributes: [{ id: '6', key: 'Size', value: '7-12' }, { id: '7', key: 'Color', value: 'Black/Red' }],
//       isFeatured: false,
//       status: 'active',
//       soldInfo: { enabled: true, count: 2341 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '5',
//       name: 'Coffee Maker',
//       title: 'Automatic Espresso Machine',
//       description: 'Make barista-quality coffee at home',
//       brand: 'Generic',
//       category: { _id: '4', name: 'Home & Garden' },
//       price: { base: 24999, sale: 19999, costPrice: 15000 },
//       inventory: { quantity: 23, lowStockThreshold: 8, trackInventory: true },
//       shipping: { weight: 3.5, dimensions: { length: 40, width: 30, height: 35 } },
//       images: [],
//       attributes: [{ id: '8', key: 'Capacity', value: '1.5L' }, { id: '9', key: 'Power', value: '1500W' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 567 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '6',
//       name: 'Old Product (Archived)',
//       title: 'This product is archived',
//       description: 'Example of archived product',
//       brand: 'Generic',
//       category: { _id: '3', name: 'Books' },
//       price: { base: 999, sale: 499, costPrice: 200 },
//       inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//       shipping: { weight: 0.1, dimensions: { length: 10, width: 10, height: 1 } },
//       images: [],
//       attributes: [],
//       isFeatured: false,
//       status: 'archived',
//       soldInfo: { enabled: false, count: 0 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
//     }
//   ]);

//   const [categories, setCategories] = useState([
//     { _id: '1', name: 'Electronics' },
//     { _id: '2', name: 'Clothing' },
//     { _id: '3', name: 'Books' },
//     { _id: '4', name: 'Home & Garden' }
//   ]);

//   const [brands, setBrands] = useState([
//     'Sony', 'Samsung', 'Apple', 'Nike', 'Adidas', 'Generic'
//   ]);

//   // ========== VERIFICATION UI ==========
//   const VerificationBadge = () => (
//     <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
//       <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 API Calls Status</h4>
//       <div className="space-y-1">
//         <div className="flex items-center justify-between text-xs">
//           <span>Products API:</span>
//           <span className={`ml-2 px-2 py-0.5 rounded-full ${apiCalls.products ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
//             {apiCalls.products ? '✅ Called' : '⏳ Pending'}
//           </span>
//         </div>
//         <div className="flex items-center justify-between text-xs">
//           <span>Analytics API:</span>
//           <span className={`ml-2 px-2 py-0.5 rounded-full ${apiCalls.analytics ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
//             {apiCalls.analytics ? '✅ Called' : '⏳ Pending'}
//           </span>
//         </div>
//         <div className="flex items-center justify-between text-xs">
//           <span>Archived API:</span>
//           <span className={`ml-2 px-2 py-0.5 rounded-full ${apiCalls.archived ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
//             {apiCalls.archived ? '✅ Called' : '⏳ Pending'}
//           </span>
//         </div>
//       </div>
//       <p className="text-[10px] text-gray-400 mt-2">Check Console for API logs</p>
//     </div>
//   );

//   // ========== HELPER FUNCTIONS ==========
//   const formatIndianRupee = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || sale >= base) return 0;
//     return Math.round(((base - sale) / base) * 100);
//   };

//   // ========== PRODUCT ACTIONS ==========
//   const handleAddProduct = (newProduct) => {
//     setProducts([newProduct, ...products]);
//   };

//   const handleEditProduct = (updatedProduct) => {
//     setProducts(prev => prev.map(p => 
//       p._id === updatedProduct._id ? updatedProduct : p
//     ));
//   };

//   const handleSoftDelete = (productId) => {
//     if (window.confirm('Archive this product? It will be hidden from the website.')) {
//       setProducts(prev => prev.map(p => 
//         p._id === productId ? { ...p, status: 'archived' } : p
//       ));
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     if (window.confirm('⚠️ Permanently delete? This cannot be undone!')) {
//       setProducts(prev => prev.filter(p => p._id !== productId));
//     }
//   };

//   const handleRestore = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: 'draft' } : p
//     ));
//   };

//   const toggleFeatured = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, isFeatured: !p.isFeatured } : p
//     ));
//   };

//   const changeStatus = (productId, newStatus) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: newStatus } : p
//     ));
//   };

//   // Handle edit click
//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // Stats calculations
//   const totalProducts = products.length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const archivedProducts = products.filter(p => p.status === 'archived').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p => 
//     p.status === 'active' && p.inventory?.quantity < p.inventory?.lowStockThreshold
//   ).length;

//   // Filtered lists
//   const activeProductsList = products.filter(p => p.status !== 'archived');
//   const archivedProductsList = products.filter(p => p.status === 'archived');

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Verification Badge - Shows API call status */}
//       <VerificationBadge />
      
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Craft your products with precision</p>
//               </div>
//             </div>
            
//             {/* Stats Pills */}
//             <StatsCards 
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts}
//               onViewArchived={() => handleTabChange('archived')}
//             />
//           </div>
          
//           {/* Navigation Tabs - UPDATED with handleTabChange */}
//           <div className="flex space-x-6">
//             {[
//               { id: 'products', name: 'Products', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
//               { id: 'analytics', name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
//               { id: 'archived', name: 'Archived', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' }
//             ].map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => handleTabChange(tab.id)} // UPDATED
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === 'products' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {activeProductsList.length}
//                     </span>
//                   )}
//                   {tab.id === 'archived' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProductsList.length}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-8">
//         {/* Tab Content - SAME AS BEFORE */}
//         {activeTab === 'products' && (
//           <ProductsTab
//             products={activeProductsList}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />
//         )}

//         {activeTab === 'analytics' && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}

//         {activeTab === 'archived' && (
//           <ArchivedTab
//             products={archivedProductsList}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />
//         )}
//       </div>

//       {/* Modals - SAME AS BEFORE */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => setShowProductModal(false)}
//           onSave={handleAddProduct}
//           categories={categories}
//           brands={brands}
//           setCategories={setCategories}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//           }}
//           onSave={handleEditProduct}
//           categories={categories}
//           brands={brands}
//           setCategories={setCategories}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;

// import React, { useState } from 'react';
// import ProductsTab from './ProductsTab';
// import AnalyticsTab from './AnalyticsTab';
// import ArchivedTab from './ArchivedTab';
// import StatsCards from './StatsCards';
// import ProductModal from './ProductModal';
// import EditProductModal from './EditProductModal';

// const AdminDashboard = () => {
//   // ========== STATE ==========
//   const [activeTab, setActiveTab] = useState('products');
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
  
//   // Products Data
//   const [products, setProducts] = useState([
//     {
//       _id: '1',
//       name: 'Premium Wireless Headphones',
//       title: 'Noise Cancelling Bluetooth Headphones',
//       description: 'Experience crystal clear sound with 40h battery life',
//       brand: 'Sony',
//       category: { _id: '1', name: 'Electronics' },
//       price: { base: 29999, sale: 19999, costPrice: 15000 },
//       inventory: { quantity: 45, lowStockThreshold: 5, trackInventory: true },
//       shipping: { weight: 0.5, dimensions: { length: 20, width: 15, height: 8 } },
//       images: [],
//       attributes: [{ id: '1', key: 'Battery Life', value: '40 hours' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 1247 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '2',
//       name: 'Premium Cotton T-Shirt',
//       title: 'Premium Quality Cotton T-Shirt',
//       description: '100% organic cotton, comfortable fit',
//       brand: 'Nike',
//       category: { _id: '2', name: 'Clothing' },
//       price: { base: 3999, sale: 2499, costPrice: 1200 },
//       inventory: { quantity: 128, lowStockThreshold: 10, trackInventory: true },
//       shipping: { weight: 0.2, dimensions: { length: 30, width: 20, height: 2 } },
//       images: [],
//       attributes: [{ id: '2', key: 'Material', value: 'Cotton' }, { id: '3', key: 'Size', value: 'S,M,L,XL' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 3456 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '3',
//       name: 'Smart Watch Series 5',
//       title: 'Fitness Tracker Smart Watch',
//       description: 'Track your heart rate, steps, and sleep quality',
//       brand: 'Samsung',
//       category: { _id: '1', name: 'Electronics' },
//       price: { base: 15999, sale: 12999, costPrice: 10000 },
//       inventory: { quantity: 8, lowStockThreshold: 10, trackInventory: true },
//       shipping: { weight: 0.3, dimensions: { length: 10, width: 10, height: 5 } },
//       images: [],
//       attributes: [{ id: '4', key: 'Display', value: '1.5 inches' }, { id: '5', key: 'Battery', value: '7 days' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 892 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '4',
//       name: 'Running Shoes',
//       title: 'Lightweight Running Shoes',
//       description: 'Professional running shoes with cushioning',
//       brand: 'Adidas',
//       category: { _id: '2', name: 'Clothing' },
//       price: { base: 8999, sale: 5999, costPrice: 3500 },
//       inventory: { quantity: 56, lowStockThreshold: 15, trackInventory: true },
//       shipping: { weight: 0.8, dimensions: { length: 35, width: 25, height: 15 } },
//       images: [],
//       attributes: [{ id: '6', key: 'Size', value: '7-12' }, { id: '7', key: 'Color', value: 'Black/Red' }],
//       isFeatured: false,
//       status: 'active',
//       soldInfo: { enabled: true, count: 2341 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '5',
//       name: 'Coffee Maker',
//       title: 'Automatic Espresso Machine',
//       description: 'Make barista-quality coffee at home',
//       brand: 'Generic',
//       category: { _id: '4', name: 'Home & Garden' },
//       price: { base: 24999, sale: 19999, costPrice: 15000 },
//       inventory: { quantity: 23, lowStockThreshold: 8, trackInventory: true },
//       shipping: { weight: 3.5, dimensions: { length: 40, width: 30, height: 35 } },
//       images: [],
//       attributes: [{ id: '8', key: 'Capacity', value: '1.5L' }, { id: '9', key: 'Power', value: '1500W' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 567 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '6',
//       name: 'Old Product (Archived)',
//       title: 'This product is archived',
//       description: 'Example of archived product',
//       brand: 'Generic',
//       category: { _id: '3', name: 'Books' },
//       price: { base: 999, sale: 499, costPrice: 200 },
//       inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//       shipping: { weight: 0.1, dimensions: { length: 10, width: 10, height: 1 } },
//       images: [],
//       attributes: [],
//       isFeatured: false,
//       status: 'archived',
//       soldInfo: { enabled: false, count: 0 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
//     }
//   ]);

//   const [categories, setCategories] = useState([
//     { _id: '1', name: 'Electronics' },
//     { _id: '2', name: 'Clothing' },
//     { _id: '3', name: 'Books' },
//     { _id: '4', name: 'Home & Garden' }
//   ]);

//   const [brands, setBrands] = useState([
//     'Sony', 'Samsung', 'Apple', 'Nike', 'Adidas', 'Generic'
//   ]);

//   // ========== HELPER FUNCTIONS ==========
//   const formatIndianRupee = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || sale >= base) return 0;
//     return Math.round(((base - sale) / base) * 100);
//   };

//   // ========== PRODUCT ACTIONS ==========
//   const handleAddProduct = (newProduct) => {
//     setProducts([newProduct, ...products]);
//   };

//   const handleEditProduct = (updatedProduct) => {
//     setProducts(prev => prev.map(p => 
//       p._id === updatedProduct._id ? updatedProduct : p
//     ));
//   };

//   const handleSoftDelete = (productId) => {
//     if (window.confirm('Archive this product? It will be hidden from the website.')) {
//       setProducts(prev => prev.map(p => 
//         p._id === productId ? { ...p, status: 'archived' } : p
//       ));
//     }
//   };

//   const handlePermanentDelete = (productId) => {
//     if (window.confirm('⚠️ Permanently delete? This cannot be undone!')) {
//       setProducts(prev => prev.filter(p => p._id !== productId));
//     }
//   };

//   const handleRestore = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: 'draft' } : p
//     ));
//   };

//   const toggleFeatured = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, isFeatured: !p.isFeatured } : p
//     ));
//   };

//   const changeStatus = (productId, newStatus) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: newStatus } : p
//     ));
//   };

//   // Handle edit click
//   const openEditModal = (product) => {
//     setSelectedProduct(product);
//     setShowEditModal(true);
//   };

//   // Stats calculations
//   const totalProducts = products.length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const archivedProducts = products.filter(p => p.status === 'archived').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p => 
//     p.status === 'active' && p.inventory?.quantity < p.inventory?.lowStockThreshold
//   ).length;

//   // Filtered lists
//   const activeProductsList = products.filter(p => p.status !== 'archived');
//   const archivedProductsList = products.filter(p => p.status === 'archived');

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Craft your products with precision</p>
//               </div>
//             </div>
            
//             {/* Stats Pills */}
//             <StatsCards 
//               activeProducts={activeProducts}
//               featuredProducts={featuredProducts}
//               archivedProducts={archivedProducts}
//               onViewArchived={() => setActiveTab('archived')}
//             />
//           </div>
          
//           {/* Navigation Tabs */}
//           <div className="flex space-x-6">
//             {[
//               { id: 'products', name: 'Products', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
//               { id: 'analytics', name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
//               { id: 'archived', name: 'Archived', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' }
//             ].map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === 'products' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {activeProductsList.length}
//                     </span>
//                   )}
//                   {tab.id === 'archived' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProductsList.length}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-8">
//         {/* Tab Content */}
//         {activeTab === 'products' && (
//           <ProductsTab
//             products={activeProductsList}
//             archivedProducts={archivedProducts}
//             categories={categories}
//             brands={brands}
//             onAddClick={() => setShowProductModal(true)}
//             onEdit={openEditModal}
//             onDelete={handleSoftDelete}
//             onToggleFeatured={toggleFeatured}
//             onChangeStatus={changeStatus}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />
//         )}

//         {activeTab === 'analytics' && (
//           <AnalyticsTab products={products} categories={categories} />
//         )}

//         {activeTab === 'archived' && (
//           <ArchivedTab
//             products={archivedProductsList}
//             onRestore={handleRestore}
//             onPermanentDelete={handlePermanentDelete}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />
//         )}
//       </div>

//       {/* Modals */}
//       {showProductModal && (
//         <ProductModal
//           onClose={() => setShowProductModal(false)}
//           onSave={handleAddProduct}
//           categories={categories}
//           brands={brands}
//           setCategories={setCategories}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//       {showEditModal && selectedProduct && (
//         <EditProductModal
//           product={selectedProduct}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProduct(null);
//           }}
//           onSave={handleEditProduct}
//           categories={categories}
//           brands={brands}
//           setCategories={setCategories}
//           setBrands={setBrands}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;

// // AdminDashboard.jsx
// import React, { useState } from 'react';
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';
// import { format, subDays } from 'date-fns';
// import { Download, TrendingUp, IndianRupee, Package, AlertTriangle } from 'lucide-react';

// const AdminDashboard = () => {
//   // ================= STATE MANAGEMENT =================
//   const [activeTab, setActiveTab] = useState('products'); // 'products', 'analytics', 'archived'
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

//   // Form State with ALL new fields
//   const [formData, setFormData] = useState({
//     name: '',
//     title: '',
//     description: '',
//     brand: 'Generic',
//     category: '',
//     price: {
//       base: '',
//       sale: '',
//       costPrice: ''
//     },
//     inventory: {
//       quantity: 0,
//       lowStockThreshold: 5,
//       trackInventory: true
//     },
//     shipping: {
//       weight: 0,
//       dimensions: {
//         length: null,
//         width: null,
//         height: null
//       }
//     },
//     soldInfo: {
//       enabled: false,
//       count: 0
//     },
//     fomo: {
//       enabled: false,
//       type: 'viewing_now',
//       viewingNow: 0,
//       productLeft: 0,
//       customMessage: ''
//     },
//     images: [],
//     attributes: [],
//     isFeatured: false,
//     status: 'draft'
//   });

//   // Image upload state
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [draggedImageIndex, setDraggedImageIndex] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);

//   // Products Data with archived products
//   const [products, setProducts] = useState([
//     {
//       _id: '1',
//       name: 'Premium Wireless Headphones',
//       title: 'Noise Cancelling Bluetooth Headphones',
//       description: 'Experience crystal clear sound with 40h battery life',
//       brand: 'Sony',
//       category: { _id: '1', name: 'Electronics' },
//       price: { 
//         base: 29999,
//         sale: 19999,
//         costPrice: 15000 
//       },
//       inventory: { 
//         quantity: 45, 
//         lowStockThreshold: 5,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 0.5,
//         dimensions: {
//           length: 20,
//           width: 15,
//           height: 8
//         }
//       },
//       images: [],
//       attributes: [{ id: '1', key: 'Battery Life', value: '40 hours' }],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 1247 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '2',
//       name: 'Premium Cotton T-Shirt',
//       title: 'Premium Quality Cotton T-Shirt',
//       description: '100% organic cotton, comfortable fit',
//       brand: 'Nike',
//       category: { _id: '2', name: 'Clothing' },
//       price: { 
//         base: 3999,
//         sale: 2499,
//         costPrice: 1200 
//       },
//       inventory: { 
//         quantity: 128, 
//         lowStockThreshold: 10,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 0.2,
//         dimensions: {
//           length: 30,
//           width: 20,
//           height: 2
//         }
//       },
//       images: [],
//       attributes: [
//         { id: '2', key: 'Material', value: 'Cotton' },
//         { id: '3', key: 'Size', value: 'S, M, L, XL' }
//       ],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 3456 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '3',
//       name: 'Smart Watch Series 5',
//       title: 'Fitness Tracker Smart Watch',
//       description: 'Track your heart rate, steps, and sleep quality',
//       brand: 'Samsung',
//       category: { _id: '1', name: 'Electronics' },
//       price: { 
//         base: 15999,
//         sale: 12999,
//         costPrice: 10000 
//       },
//       inventory: { 
//         quantity: 8, 
//         lowStockThreshold: 10,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 0.3,
//         dimensions: {
//           length: 10,
//           width: 10,
//           height: 5
//         }
//       },
//       images: [],
//       attributes: [
//         { id: '4', key: 'Display', value: '1.5 inches' },
//         { id: '5', key: 'Battery', value: '7 days' }
//       ],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 892 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '4',
//       name: 'Running Shoes',
//       title: 'Lightweight Running Shoes',
//       description: 'Professional running shoes with cushioning',
//       brand: 'Adidas',
//       category: { _id: '2', name: 'Clothing' },
//       price: { 
//         base: 8999,
//         sale: 5999,
//         costPrice: 3500 
//       },
//       inventory: { 
//         quantity: 56, 
//         lowStockThreshold: 15,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 0.8,
//         dimensions: {
//           length: 35,
//           width: 25,
//           height: 15
//         }
//       },
//       images: [],
//       attributes: [
//         { id: '6', key: 'Size', value: '7-12' },
//         { id: '7', key: 'Color', value: 'Black/Red' }
//       ],
//       isFeatured: false,
//       status: 'active',
//       soldInfo: { enabled: true, count: 2341 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     {
//       _id: '5',
//       name: 'Coffee Maker',
//       title: 'Automatic Espresso Machine',
//       description: 'Make barista-quality coffee at home',
//       brand: 'Generic',
//       category: { _id: '4', name: 'Home & Garden' },
//       price: { 
//         base: 24999,
//         sale: 19999,
//         costPrice: 15000 
//       },
//       inventory: { 
//         quantity: 23, 
//         lowStockThreshold: 8,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 3.5,
//         dimensions: {
//           length: 40,
//           width: 30,
//           height: 35
//         }
//       },
//       images: [],
//       attributes: [
//         { id: '8', key: 'Capacity', value: '1.5L' },
//         { id: '9', key: 'Power', value: '1500W' }
//       ],
//       isFeatured: true,
//       status: 'active',
//       soldInfo: { enabled: true, count: 567 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date().toISOString()
//     },
//     // Add an archived product example
//     {
//       _id: '6',
//       name: 'Old Product (Archived)',
//       title: 'This product is archived',
//       description: 'Example of archived product',
//       brand: 'Generic',
//       category: { _id: '3', name: 'Books' },
//       price: { 
//         base: 999,
//         sale: 499,
//         costPrice: 200 
//       },
//       inventory: { 
//         quantity: 0, 
//         lowStockThreshold: 5,
//         trackInventory: true 
//       },
//       shipping: {
//         weight: 0.1,
//         dimensions: {
//           length: 10,
//           width: 10,
//           height: 1
//         }
//       },
//       images: [],
//       attributes: [],
//       isFeatured: false,
//       status: 'archived',
//       soldInfo: { enabled: false, count: 0 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
//     }
//   ]);

//   const [categories, setCategories] = useState([
//     { _id: '1', name: 'Electronics' },
//     { _id: '2', name: 'Clothing' },
//     { _id: '3', name: 'Books' },
//     { _id: '4', name: 'Home & Garden' }
//   ]);

//   const [brands, setBrands] = useState([
//     'Sony', 'Samsung', 'Apple', 'Nike', 'Adidas', 'Generic'
//   ]);

//   // Modal states
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
  
//   const [newCategory, setNewCategory] = useState('');
//   const [newBrand, setNewBrand] = useState('');
//   const [customMessage, setCustomMessage] = useState('');
//   const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });

//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   // Filter states
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterCategory, setFilterCategory] = useState('all');

//   // Analytics date range
//   const [dateRange, setDateRange] = useState('week');
//   const [startDate, setStartDate] = useState(subDays(new Date(), 7));
//   const [endDate, setEndDate] = useState(new Date());

//   // ================= HELPER FUNCTIONS =================
//   const showToast = (message, type = 'success') => {
//     setToast({ show: true, message, type });
//     setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
//   };

//   const formatIndianRupee = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   // Calculate discount percentage for strikethrough
//   const getDiscountPercentage = (base, sale) => {
//     if (!base || !sale || sale >= base) return 0;
//     return Math.round(((base - sale) / base) * 100);
//   };

//   // ================= IMAGE HANDLING =================
//   const handleImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = [...formData.images];
    
//     files.forEach((file, index) => {
//       if (newImages.length < 5) {
//         const reader = new FileReader();
//         const imageId = `img-${Date.now()}-${index}`;
        
//         setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
        
//         reader.onloadstart = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 10 }));
//         };
        
//         reader.onprogress = (progress) => {
//           if (progress.lengthComputable) {
//             const percent = (progress.loaded / progress.total) * 90 + 10;
//             setUploadProgress(prev => ({ ...prev, [imageId]: percent }));
//           }
//         };
        
//         reader.onloadend = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));
//           setTimeout(() => {
//             setUploadProgress(prev => {
//               const newProgress = { ...prev };
//               delete newProgress[imageId];
//               return newProgress;
//             });
//           }, 500);
          
//           newImages.push({
//             id: imageId,
//             url: reader.result,
//             file: file,
//             name: file.name,
//             size: file.size,
//             isMain: newImages.length === 0
//           });
          
//           setFormData(prev => ({
//             ...prev,
//             images: newImages
//           }));
//         };
        
//         reader.readAsDataURL(file);
//       }
//     });
//   };

//   const removeImage = (imageId) => {
//     const newImages = formData.images.filter(img => img.id !== imageId);
//     if (formData.images.find(img => img.id === imageId)?.isMain && newImages.length > 0) {
//       newImages[0].isMain = true;
//     }
//     setFormData(prev => ({ ...prev, images: newImages }));
//   };

//   const setMainImage = (imageId) => {
//     setFormData(prev => ({
//       ...prev,
//       images: prev.images.map(img => ({
//         ...img,
//         isMain: img.id === imageId
//       }))
//     }));
//   };

//   const handleImageDragStart = (e, index) => {
//     setDraggedImageIndex(index);
//     e.dataTransfer.effectAllowed = 'move';
//   };

//   const handleImageDragOver = (e, index) => {
//     e.preventDefault();
//     if (draggedImageIndex === null || draggedImageIndex === index) return;
    
//     const newImages = [...formData.images];
//     const draggedImage = newImages[draggedImageIndex];
//     newImages.splice(draggedImageIndex, 1);
//     newImages.splice(index, 0, draggedImage);
//     newImages.forEach((img, idx) => { img.isMain = idx === 0; });
    
//     setFormData(prev => ({ ...prev, images: newImages }));
//     setDraggedImageIndex(index);
//   };

//   const handleImageDragEnd = () => {
//     setDraggedImageIndex(null);
//     setIsDragging(false);
//   };

//   // ================= ATTRIBUTES HANDLING =================
//   const addAttribute = () => {
//     if (newAttribute.key && newAttribute.value) {
//       setFormData(prev => ({
//         ...prev,
//         attributes: [...prev.attributes, { ...newAttribute, id: Date.now() }]
//       }));
//       setNewAttribute({ key: '', value: '' });
//       setShowAttributeModal(false);
//     }
//   };

//   const removeAttribute = (attributeId) => {
//     setFormData(prev => ({
//       ...prev,
//       attributes: prev.attributes.filter(attr => attr.id !== attributeId)
//     }));
//   };

//   // ================= CATEGORY & BRAND HANDLING =================
//   const handleAddCategory = () => {
//     if (newCategory.trim()) {
//       const newCat = { _id: Date.now().toString(), name: newCategory };
//       setCategories([...categories, newCat]);
//       setFormData(prev => ({ ...prev, category: newCat._id }));
//       setNewCategory('');
//       setShowCategoryModal(false);
//     }
//   };

//   const handleAddBrand = () => {
//     if (newBrand.trim()) {
//       setBrands([...brands, newBrand]);
//       setFormData(prev => ({ ...prev, brand: newBrand }));
//       setNewBrand('');
//       setShowBrandModal(false);
//     }
//   };

//   // ================= FOMO CUSTOM MESSAGE =================
//   const handleCustomMessageSave = () => {
//     if (customMessage.trim()) {
//       setFormData(prev => ({
//         ...prev,
//         fomo: { ...prev.fomo, customMessage }
//       }));
//       setCustomMessage('');
//       setShowCustomMessageModal(false);
//     }
//   };

//   // ================= FORM HANDLING =================
//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [parent, child] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
//       }));
//     } else if (name.includes('shipping.dimensions.')) {
//       const dimension = name.split('.')[2];
//       setFormData(prev => ({
//         ...prev,
//         shipping: {
//           ...prev.shipping,
//           dimensions: {
//             ...prev.shipping.dimensions,
//             [dimension]: value
//           }
//         }
//       }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       title: '',
//       description: '',
//       brand: 'Generic',
//       category: '',
//       price: { base: '', sale: '', costPrice: '' },
//       inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//       shipping: {
//         weight: "",
//         dimensions: {
//           length: "",
//           width: "",
//           height: ""
//         }
//       },
//       soldInfo: { enabled: false, count: 0 },
//       fomo: { enabled: false, type: 'viewing_now', viewingNow: 0, productLeft: 0, customMessage: '' },
//       images: [],
//       attributes: [],
//       isFeatured: false,
//       status: 'draft'
//     });
//     setIsEditing(false);
//     setSelectedProduct(null);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     const categoryObj = categories.find(c => c._id === formData.category);

//     if (isEditing && selectedProduct) {
//       setProducts(prev => prev.map(p => 
//         p._id === selectedProduct._id 
//           ? { 
//               ...formData, 
//               _id: selectedProduct._id, 
//               category: categoryObj, 
//               createdAt: selectedProduct.createdAt,
//               // Ensure all nested objects exist
//               inventory: { ...formData.inventory },
//               shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions } },
//               soldInfo: { ...formData.soldInfo },
//               fomo: { ...formData.fomo }
//             }
//           : p
//       ));
//       showToast('Product updated successfully! 🎉');
//     } else {
//       const newProduct = {
//         ...formData,
//         _id: Date.now().toString(),
//         category: categoryObj,
//         createdAt: new Date().toISOString(),
//         // Ensure all nested objects exist
//         inventory: { ...formData.inventory },
//         shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions } },
//         soldInfo: { ...formData.soldInfo },
//         fomo: { ...formData.fomo }
//       };
//       setProducts([newProduct, ...products]);
//       showToast('Product created successfully! 🚀');
//     }

//     resetForm();
//     setShowProductModal(false);
//   };

//   // ================= PRODUCT ACTIONS =================
//   const handleEdit = (product) => {
//     setSelectedProduct(product);
//     setIsEditing(true);
//     setFormData({
//       name: product.name || '',
//       title: product.title || '',
//       description: product.description || '',
//       brand: product.brand || 'Generic',
//       category: product.category?._id || '',
//       price: {
//         base: product.price?.base || '',
//         sale: product.price?.sale || '',
//         costPrice: product.price?.costPrice || ''
//       },
//       inventory: {
//         quantity: product.inventory?.quantity || 0,
//         lowStockThreshold: product.inventory?.lowStockThreshold || 5,
//         trackInventory: product.inventory?.trackInventory !== undefined ? product.inventory.trackInventory : true
//       },
//       shipping: {
//         weight: product.shipping?.weight || 0,
//         dimensions: {
//           length: product.shipping?.dimensions?.length || 0,
//           width: product.shipping?.dimensions?.width || 0,
//           height: product.shipping?.dimensions?.height || 0
//         }
//       },
//       soldInfo: {
//         enabled: product.soldInfo?.enabled || false,
//         count: product.soldInfo?.count || 0
//       },
//       fomo: {
//         enabled: product.fomo?.enabled || false,
//         type: product.fomo?.type || 'viewing_now',
//         viewingNow: product.fomo?.viewingNow || 0,
//         productLeft: product.fomo?.productLeft || 0,
//         customMessage: product.fomo?.customMessage || ''
//       },
//       images: product.images || [],
//       attributes: product.attributes || [],
//       isFeatured: product.isFeatured || false,
//       status: product.status || 'draft'
//     });
//     setShowProductModal(true);
//   };

//   // SOFT DELETE - Move to archive
//   const handleSoftDelete = (productId) => {
//     if (window.confirm('Are you sure you want to archive this product? It will be hidden from the website.')) {
//       setProducts(prev => prev.map(p => 
//         p._id === productId ? { ...p, status: 'archived' } : p
//       ));
//       showToast('Product moved to archive! 📦');
//     }
//   };

//   // PERMANENT DELETE (only from Archived tab)
//   const handlePermanentDelete = (productId) => {
//     if (window.confirm('⚠️ This will permanently delete the product. This action cannot be undone!')) {
//       setProducts(prev => prev.filter(p => p._id !== productId));
//       showToast('Product permanently deleted! 🗑️');
//     }
//   };

//   // RESTORE from archive
//   const handleRestore = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: 'draft' } : p
//     ));
//     showToast('Product restored to drafts! 🔄');
//   };

//   const toggleFeatured = (productId) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, isFeatured: !p.isFeatured } : p
//     ));
//     showToast('Featured status updated! ⭐');
//   };

//   const changeStatus = (productId, newStatus) => {
//     setProducts(prev => prev.map(p => 
//       p._id === productId ? { ...p, status: newStatus } : p
//     ));
//     showToast(`Product status changed to ${newStatus}! 📋`);
//   };

//   // ================= FILTERS =================
//   const activeProductsList = products.filter(p => p.status !== 'archived');
//   const archivedProductsList = products.filter(p => p.status === 'archived');

//   const filteredProducts = activeProductsList.filter(product => {
//     const matchesSearch = 
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
//     const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
//     const matchesCategory = filterCategory === 'all' || product.category?._id === filterCategory;
    
//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   // Stats
//   const totalProducts = products.length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const archivedProducts = products.filter(p => p.status === 'archived').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p => 
//     p.status === 'active' && 
//     p.inventory?.quantity < p.inventory?.lowStockThreshold
//   ).length;

//   // Analytics calculations
//   const totalRevenue = products.reduce((sum, p) => {
//     const price = p.price.sale || p.price.base;
//     return sum + (price * (p.soldInfo?.count || 0));
//   }, 0);

//   const totalOrders = products.reduce((sum, p) => sum + (p.soldInfo?.count || 0), 0);
  
//   const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
//   const totalProfit = products.reduce((sum, p) => {
//     const revenue = (p.price.sale || p.price.base) * (p.soldInfo?.count || 0);
//     const cost = (p.price.costPrice || 0) * (p.soldInfo?.count || 0);
//     return sum + (revenue - cost);
//   }, 0);

//   const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

//   // Top selling products
//   const topSelling = [...products]
//     .filter(p => p.soldInfo?.enabled)
//     .sort((a, b) => b.soldInfo.count - a.soldInfo.count)
//     .slice(0, 5);

//   // Mock analytics data
//   const salesData = [
//     { date: 'Mon', revenue: 45000, orders: 45 },
//     { date: 'Tue', revenue: 52000, orders: 52 },
//     { date: 'Wed', revenue: 48000, orders: 48 },
//     { date: 'Thu', revenue: 61000, orders: 61 },
//     { date: 'Fri', revenue: 58000, orders: 58 },
//     { date: 'Sat', revenue: 72000, orders: 72 },
//     { date: 'Sun', revenue: 55000, orders: 55 }
//   ];

//   const topProducts = topSelling.map(p => ({
//     name: p.name,
//     units: p.soldInfo?.count || 0
//   }));

//   const categoryDistribution = categories.map(cat => ({
//     name: cat.name,
//     value: products.filter(p => p.category?._id === cat._id).length
//   })).filter(c => c.value > 0);

//   const lowStockProducts = products
//     .filter(p => p.status === 'active' && p.inventory?.quantity < p.inventory?.lowStockThreshold)
//     .map(p => ({
//       id: p._id,
//       name: p.name,
//       sku: p._id,
//       stock: p.inventory?.quantity || 0,
//       reorderLevel: p.inventory?.lowStockThreshold || 5
//     }));

//   const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

//   // Get date range data for charts
//   const getDateRangeData = () => {
//     switch(dateRange) {
//       case 'week':
//         return salesData;
//       case 'month':
//         return salesData; // In real app, would have more data
//       case 'year': {
//         const monthlyData = {};
//         salesData.forEach(item => {
//           const month = format(new Date(), 'MMM yyyy');
//           if (!monthlyData[month]) {
//             monthlyData[month] = { date: month, revenue: 0, orders: 0 };
//           }
//           monthlyData[month].revenue += item.revenue || 0;
//           monthlyData[month].orders += item.orders || 0;
//         });
//         return Object.values(monthlyData);
//       }
//       default:
//         return salesData;
//     }
//   };

//   const chartData = getDateRangeData();

//   const handleExport = (format) => {
//     alert(`Exporting as ${format}...`);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Toast Notification */}
//       {toast.show && (
//         <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 ${
//           toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
//         } text-white`}>
//           <div className="flex items-center space-x-3">
//             {toast.type === 'success' ? (
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             ) : (
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             )}
//             <span className="font-medium">{toast.message}</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
//         <div className="max-w-7xl mx-auto px-8">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Product Forge</h1>
//                 <p className="text-sm text-gray-500">Craft your products with precision</p>
//               </div>
//             </div>
            
//             {/* Stats Pills */}
//             <div className="flex items-center space-x-3">
//               <div className="px-4 py-2 bg-blue-50 rounded-xl flex items-center space-x-2">
//                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
//                 <span className="text-sm font-medium text-blue-700">{activeProducts} Live</span>
//               </div>
//               <div className="px-4 py-2 bg-purple-50 rounded-xl flex items-center space-x-2">
//                 <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                 </svg>
//                 <span className="text-sm font-medium text-purple-700">{featuredProducts} Featured</span>
//               </div>
//               <div className="px-4 py-2 bg-gray-50 rounded-xl flex items-center space-x-2">
//                 <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                 </svg>
//                 <span className="text-sm font-medium text-gray-700">{archivedProducts} Archived</span>
//               </div>
//             </div>
//           </div>
          
//           {/* Navigation Tabs - MODULAR SYSTEM */}
//           <div className="flex space-x-6">
//             {[
//               { id: 'products', name: 'Products', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
//               { id: 'analytics', name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
//               { id: 'archived', name: 'Archived', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' }
//             ].map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
//                   activeTab === tab.id
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 <span className="flex items-center space-x-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
//                   </svg>
//                   <span>{tab.name}</span>
//                   {tab.id === 'products' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {activeProductsList.length}
//                     </span>
//                   )}
//                   {tab.id === 'archived' && (
//                     <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
//                       {archivedProductsList.length}
//                     </span>
//                   )}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-8">
//         {/* MODULAR TAB RENDERING SYSTEM */}
//         {activeTab === 'products' && (
//           /* ================= PRODUCTS TAB ================= */
//           <div className="space-y-6">
//             {/* Stats Cards - INCLUDING ARCHIVED STATS */}
//             <div className="grid grid-cols-5 gap-6">
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Total Products</p>
//                     <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className="mt-4 text-sm text-green-600 flex items-center">
//                   <span>↑ 12% from last month</span>
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Active Products</p>
//                     <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className="mt-4 text-sm text-gray-500">
//                   {((activeProducts / totalProducts) * 100).toFixed(1)}% of inventory
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Archived</p>
//                     <p className="text-3xl font-bold text-gray-900">{archivedProducts}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                     </svg>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setActiveTab('archived')}
//                   className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
//                 >
//                   View archived products →
//                 </button>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Featured</p>
//                     <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
//                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Low Stock</p>
//                     <p className="text-3xl font-bold text-gray-900">{lowStock}</p>
//                   </div>
//                   <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Filters Bar with Add Button */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//               <div className="flex gap-4">
//                 <div className="flex-1 relative">
//                   <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                   <input
//                     type="text"
//                     placeholder="Search products..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <select
//                   value={filterStatus}
//                   onChange={(e) => setFilterStatus(e.target.value)}
//                   className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="draft">Draft</option>
//                   <option value="active">Active</option>
//                 </select>
//                 <select
//                   value={filterCategory}
//                   onChange={(e) => setFilterCategory(e.target.value)}
//                   className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="all">All Categories</option>
//                   {categories.map(cat => (
//                     <option key={cat._id} value={cat._id}>{cat.name}</option>
//                   ))}
//                 </select>
//                 <button
//                   onClick={() => {
//                     resetForm();
//                     setShowProductModal(true);
//                   }}
//                   className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                   </svg>
//                   <span>Add Product</span>
//                 </button>
//               </div>
//             </div>

//             {/* Products Table with Strikethrough Pricing */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 border-b border-gray-200">
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredProducts.map((product) => {
//                     const discountPercentage = getDiscountPercentage(product.price.base, product.price.sale);
//                     const isLowStock = product.inventory?.quantity < product.inventory?.lowStockThreshold;
                    
//                     return (
//                       <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
//                         <td className="px-6 py-4">
//                           <div>
//                             <div className="font-medium text-gray-900">{product.name}</div>
//                             <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                             {product.category?.name || 'Uncategorized'}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-sm">
//                           {product.brand === 'Generic' ? (
//                             <span className="text-gray-400">—</span>
//                           ) : (
//                             <span className="font-medium text-gray-700">{product.brand}</span>
//                           )}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm">
//                             <span className="text-gray-400 line-through text-xs mr-2">
//                               {formatIndianRupee(product.price.base)}
//                             </span>
//                             <span className="font-bold text-gray-900">
//                               {formatIndianRupee(product.price.sale || product.price.base)}
//                             </span>
//                             {discountPercentage > 0 && (
//                               <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                                 {discountPercentage}% OFF
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center space-x-2">
//                             <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
//                               {product.inventory?.quantity || 0}
//                             </span>
//                             {isLowStock && (
//                               <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
//                                 Low
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <select
//                             value={product.status}
//                             onChange={(e) => changeStatus(product._id, e.target.value)}
//                             className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 ${
//                               product.status === 'active' ? 'bg-green-100 text-green-700' :
//                               product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
//                               'bg-gray-100 text-gray-700'
//                             }`}
//                           >
//                             <option value="draft">Draft</option>
//                             <option value="active">Active</option>
//                           </select>
//                         </td>
//                         <td className="px-6 py-4">
//                           <button
//                             onClick={() => toggleFeatured(product._id)}
//                             className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
//                               product.isFeatured 
//                                 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
//                                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                             }`}
//                           >
//                             {product.isFeatured ? 'Featured' : 'Regular'}
//                           </button>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                             <button
//                               onClick={() => handleEdit(product)}
//                               className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                               title="Edit"
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                               </svg>
//                             </button>
//                             <button
//                               onClick={() => handleSoftDelete(product._id)}
//                               className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                               title="Archive"
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
              
//               {filteredProducts.length === 0 && (
//                 <div className="text-center py-16">
//                   <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//                   </svg>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//                   <p className="text-gray-500">Click "Add Product" to create your first product</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {activeTab === 'analytics' && (
//           /* ================= ANALYTICS TAB ================= */
//           <div className="space-y-6">
//             {/* Header with Date Range */}
//             <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
//               <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
              
//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
//                   <button
//                     onClick={() => setDateRange('week')}
//                     className={`px-3 py-1 text-sm rounded-md transition-colors ${
//                       dateRange === 'week' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                   >
//                     Week
//                   </button>
//                   <button
//                     onClick={() => setDateRange('month')}
//                     className={`px-3 py-1 text-sm rounded-md transition-colors ${
//                       dateRange === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                   >
//                     Month
//                   </button>
//                   <button
//                     onClick={() => setDateRange('year')}
//                     className={`px-3 py-1 text-sm rounded-md transition-colors ${
//                       dateRange === 'year' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
//                     }`}
//                   >
//                     Year
//                   </button>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => handleExport('csv')}
//                     className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
//                   >
//                     <Download className="w-4 h-4" />
//                     Export
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Revenue Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
//                     <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
//                     <IndianRupee className="w-5 h-5 text-green-600" />
//                   </div>
//                 </div>
//                 <p className="text-xs text-green-600 mt-2">↑ 12.5% from last period</p>
//               </div>

//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
//                     <p className="text-2xl font-bold text-gray-900">₹{avgOrderValue.toFixed(2)}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
//                     <TrendingUp className="w-5 h-5 text-blue-600" />
//                   </div>
//                 </div>
//                 <p className="text-xs text-blue-600 mt-2">↑ 5.2% from last period</p>
//               </div>

//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Total Orders</p>
//                     <p className="text-2xl font-bold text-gray-900">
//                       {totalOrders}
//                     </p>
//                   </div>
//                   <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
//                     <Package className="w-5 h-5 text-purple-600" />
//                   </div>
//                 </div>
//                 <p className="text-xs text-purple-600 mt-2">↑ 8.1% from last period</p>
//               </div>

//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
//                     <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
//                     <AlertTriangle className="w-5 h-5 text-red-600" />
//                   </div>
//                 </div>
//                 <p className="text-xs text-red-600 mt-2">Requires attention</p>
//               </div>
//             </div>

//             {/* Charts Grid */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Sales Trend Line Chart */}
//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
//                 <div className="h-80 w-full">
//                   {chartData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height="100%" minWidth={300}>
//                       <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="date" />
//                         <YAxis yAxisId="left" />
//                         <YAxis yAxisId="right" orientation="right" />
//                         <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
//                         <Legend />
//                         <Line
//                           yAxisId="left"
//                           type="monotone"
//                           dataKey="revenue"
//                           stroke="#4F46E5"
//                           name="Revenue (₹)"
//                           strokeWidth={2}
//                           dot={{ r: 4 }}
//                           activeDot={{ r: 6 }}
//                         />
//                         <Line
//                           yAxisId="right"
//                           type="monotone"
//                           dataKey="orders"
//                           stroke="#10B981"
//                           name="Orders"
//                           strokeWidth={2}
//                           dot={{ r: 4 }}
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <div className="flex items-center justify-center h-full text-gray-500">
//                       No data available for the selected period
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Top Products Bar Chart */}
//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Selling Products</h3>
//                 <div className="h-80 w-full">
//                   {topProducts && topProducts.length > 0 ? (
//                     <ResponsiveContainer width="100%" height="100%" minWidth={300}>
//                       <BarChart 
//                         data={topProducts} 
//                         layout="vertical"
//                         margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
//                       >
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis type="number" />
//                         <YAxis 
//                           dataKey="name" 
//                           type="category" 
//                           width={90}
//                           tick={{ fontSize: 12 }}
//                         />
//                         <Tooltip />
//                         <Legend />
//                         <Bar dataKey="units" fill="#4F46E5" name="Units Sold" radius={[0, 4, 4, 0]} />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <div className="flex items-center justify-center h-full text-gray-500">
//                       No product data available
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Category Distribution Pie Chart */}
//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
//                 <div className="h-80 w-full">
//                   {categoryDistribution && categoryDistribution.length > 0 ? (
//                     <ResponsiveContainer width="100%" height="100%" minWidth={300}>
//                       <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
//                         <Pie
//                           data={categoryDistribution}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
//                           outerRadius={80}
//                           fill="#8884d8"
//                           dataKey="value"
//                         >
//                           {categoryDistribution.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <div className="flex items-center justify-center h-full text-gray-500">
//                       No category data available
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Low Stock Alerts */}
//               <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
//                 <div className="space-y-3 max-h-80 overflow-y-auto">
//                   {lowStockProducts.length > 0 ? (
//                     lowStockProducts.map((product) => (
//                       <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
//                         <div className="flex items-center gap-3">
//                           <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
//                           <div className="min-w-0">
//                             <p className="font-medium text-gray-900 truncate">{product.name}</p>
//                             <p className="text-sm text-gray-500">SKU: {product.sku}</p>
//                           </div>
//                         </div>
//                         <div className="text-right flex-shrink-0">
//                           <p className="font-medium text-red-600">{product.stock} units left</p>
//                           <p className="text-xs text-gray-500">Reorder at: {product.reorderLevel}</p>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       No low stock items
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Custom Date Range Picker */}
//             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Date Range Analysis</h3>
//               <div className="flex flex-wrap gap-4 items-end">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//                   <input
//                     type="date"
//                     value={format(startDate, 'yyyy-MM-dd')}
//                     onChange={(e) => setStartDate(new Date(e.target.value))}
//                     className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//                   <input
//                     type="date"
//                     value={format(endDate, 'yyyy-MM-dd')}
//                     onChange={(e) => setEndDate(new Date(e.target.value))}
//                     className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <button 
//                   onClick={() => {
//                     showToast('Custom range applied! 📅');
//                   }}
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                 >
//                   Apply Range
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'archived' && (
//           /* ================= ARCHIVED TAB ================= */
//           <div className="space-y-6">
//             {/* Archived Header */}
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">Archived Products</h2>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Products in archive are hidden from your store. You can restore or permanently delete them.
//                 </p>
//               </div>
//               <div className="bg-gray-100 px-4 py-2 rounded-xl">
//                 <span className="text-sm font-medium text-gray-700">
//                   {archivedProductsList.length} Archived Items
//                 </span>
//               </div>
//             </div>

//             {/* Archived Products Table */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 border-b border-gray-200">
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {archivedProductsList.map((product) => {
//                     const discountPercentage = getDiscountPercentage(product.price.base, product.price.sale);
                    
//                     return (
//                       <tr key={product._id} className="hover:bg-gray-50 transition-colors">
//                         <td className="px-6 py-4">
//                           <div>
//                             <div className="font-medium text-gray-900">{product.name}</div>
//                             <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                             {product.category?.name || 'Uncategorized'}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-sm">
//                           {product.brand === 'Generic' ? (
//                             <span className="text-gray-400">—</span>
//                           ) : (
//                             <span className="font-medium text-gray-700">{product.brand}</span>
//                           )}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm">
//                             <span className="text-gray-400 line-through text-xs mr-2">
//                               {formatIndianRupee(product.price.base)}
//                             </span>
//                             <span className="font-bold text-gray-900">
//                               {formatIndianRupee(product.price.sale || product.price.base)}
//                             </span>
//                             {discountPercentage > 0 && (
//                               <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                                 {discountPercentage}% OFF
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-500">
//                           {new Date(product.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center space-x-2">
//                             <button
//                               onClick={() => handleRestore(product._id)}
//                               className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-xl hover:bg-green-200 transition-colors flex items-center space-x-1"
//                             >
//                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                               </svg>
//                               <span>Restore</span>
//                             </button>
//                             <button
//                               onClick={() => handlePermanentDelete(product._id)}
//                               className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center space-x-1"
//                             >
//                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                               </svg>
//                               <span>Delete</span>
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
              
//               {archivedProductsList.length === 0 && (
//                 <div className="text-center py-16">
//                   <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                   </svg>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No archived products</h3>
//                   <p className="text-gray-500">Products you archive will appear here</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ================= CREATE/EDIT PRODUCT MODAL ================= */}
//       {showProductModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//           <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">
//             {/* Modal Header */}
//             <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   {isEditing ? 'Edit Product' : 'Create New Product'}
//                 </h2>
//                 <p className="text-sm text-gray-500 mt-1">
//                   {isEditing ? 'Update your product details' : 'Fill in the details to create something amazing'}
//                 </p>
//               </div>
//               <button
//                 onClick={() => {
//                   resetForm();
//                   setShowProductModal(false);
//                 }}
//                 className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
//               >
//                 <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {/* Modal Body - Form */}
//             <form onSubmit={handleSubmit} className="p-6">
//               <div className="grid grid-cols-3 gap-6">
//                 {/* Left Column - Basic Info */}
//                 <div className="col-span-2 space-y-6">
//                   {/* Basic Details Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50">
//                       <h3 className="font-semibold text-gray-900">Essential Details</h3>
//                     </div>
//                     <div className="p-4 space-y-4">
//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Product Name <span className="text-red-400">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             value={formData.name}
//                             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                             placeholder="e.g., Premium Wireless Headphones"
//                             required
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Title <span className="text-red-400">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             name="title"
//                             value={formData.title}
//                             onChange={handleInputChange}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                             placeholder="e.g., Noise Cancelling Headphones"
//                             required
//                           />
//                         </div>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Description <span className="text-red-400">*</span>
//                         </label>
//                         <textarea
//                           name="description"
//                           value={formData.description}
//                           onChange={handleInputChange}
//                           rows="3"
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
//                           placeholder="Describe your product in detail..."
//                           required
//                         />
//                       </div>

//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Category
//                           </label>
//                           <div className="flex gap-2">
//                             <select
//                               name="category"
//                               value={formData.category}
//                               onChange={handleInputChange}
//                               className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                             >
//                               <option value="">Select category</option>
//                               {categories.map(cat => (
//                                 <option key={cat._id} value={cat._id}>{cat.name}</option>
//                               ))}
//                             </select>
//                             <button
//                               type="button"
//                               onClick={() => setShowCategoryModal(true)}
//                               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                             >
//                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Brand
//                           </label>
//                           <div className="flex gap-2">
//                             <select
//                               name="brand"
//                               value={formData.brand}
//                               onChange={handleInputChange}
//                               className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                             >
//                               {brands.map(brand => (
//                                 <option key={brand} value={brand}>{brand}</option>
//                               ))}
//                             </select>
//                             <button
//                               type="button"
//                               onClick={() => setShowBrandModal(true)}
//                               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                             >
//                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Pricing Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50">
//                       <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
//                     </div>
//                     <div className="p-4">
//                       <div className="grid grid-cols-3 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             MRP / Base Price (₹)
//                           </label>
//                           <input
//                             type="number"
//                             value={formData.price.base}
//                             onChange={(e) => setFormData({
//                               ...formData,
//                               price: { ...formData.price, base: e.target.value }
//                             })}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                             placeholder="29999"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Sale Price (₹)
//                           </label>
//                           <input
//                             type="number"
//                             value={formData.price.sale}
//                             onChange={(e) => setFormData({
//                               ...formData,
//                               price: { ...formData.price, sale: e.target.value }
//                             })}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                             placeholder="19999"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Cost Price (₹)
//                           </label>
//                           <input
//                             type="number"
//                             value={formData.price.costPrice}
//                             onChange={(e) => setFormData({
//                               ...formData,
//                               price: { ...formData.price, costPrice: e.target.value }
//                             })}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                             placeholder="15000"
//                           />
//                         </div>
//                       </div>
                      
//                       {/* Price Preview */}
//                       {formData.price.base && formData.price.sale && (
//                         <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                           <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
//                           <div className="flex items-center space-x-3">
//                             <span className="text-gray-400 line-through">
//                               {formatIndianRupee(formData.price.base)}
//                             </span>
//                             <span className="text-lg font-bold text-gray-900">
//                               {formatIndianRupee(formData.price.sale)}
//                             </span>
//                             {formData.price.sale < formData.price.base && (
//                               <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                                 {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* NEW: Inventory Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                       <h3 className="font-semibold text-gray-900">Inventory Management</h3>
//                       <button
//                         type="button"
//                         onClick={() => setFormData(prev => ({
//                           ...prev,
//                           inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory }
//                         }))}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                           formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'
//                         }`}
//                       >
//                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                           formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'
//                         }`} />
//                       </button>
//                     </div>
//                     {formData.inventory.trackInventory && (
//                       <div className="p-4">
//                         <div className="grid grid-cols-2 gap-4">
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                               Quantity in Stock
//                             </label>
//                             <input
//                               type="number"
//                               value={formData.inventory.quantity}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 }
//                               })}
//                               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                               placeholder="0"
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                               Low Stock Threshold
//                             </label>
//                             <input
//                               type="number"
//                               value={formData.inventory.lowStockThreshold}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 }
//                               })}
//                               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                               placeholder="5"
//                             />
//                           </div>
//                         </div>
//                         <p className="text-xs text-gray-500 mt-2">
//                           Low stock alert will show when quantity is below threshold
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   {/* NEW: Shipping Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50">
//                       <h3 className="font-semibold text-gray-900">Shipping Details</h3>
//                     </div>
//                     <div className="p-4 space-y-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Weight (kg)
//                         </label>
//                         <input
//                           type="number"
//                           step="0.1"
//                           value={formData.shipping.weight ?? ""}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 }
//                           })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="0.5"
//                         />
//                       </div>
                      
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Dimensions (cm)
//                         </label>
//                         <div className="grid grid-cols-3 gap-2">
//                           <div>
//                             <input
//                               type="number"
//                               value={formData.shipping.dimensions.length ?? ""}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 shipping: {
//                                   ...formData.shipping,
//                                   dimensions: { ...formData.shipping.dimensions, length: parseFloat(e.target.value) }
//                                 }
//                               })}
//                               className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                               placeholder="Length"
//                             />
//                           </div>
//                           <div>
//                             <input
//                               type="number"
//                               value={formData.shipping.dimensions.width ?? ""}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 shipping: {
//                                   ...formData.shipping,
//                                   dimensions: { ...formData.shipping.dimensions, width: parseFloat(e.target.value) }
//                                 }
//                               })}
//                               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                               placeholder="Width"
//                             />
//                           </div>
//                           <div>
//                             <input
//                               type="number"
//                               value={formData.shipping.dimensions.height ?? ""}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 shipping: {
//                                   ...formData.shipping,
//                                   dimensions: { ...formData.shipping.dimensions, height: parseFloat(e.target.value) }
//                                 }
//                               })}
//                               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                               placeholder="Height"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Attributes Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                       <h3 className="font-semibold text-gray-900">Product Attributes</h3>
//                       <button
//                         type="button"
//                         onClick={() => setShowAttributeModal(true)}
//                         className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
//                       >
//                         + Add Attribute
//                       </button>
//                     </div>
//                     <div className="p-4">
//                       {formData.attributes.length === 0 ? (
//                         <p className="text-center text-gray-500 py-4">No attributes added yet</p>
//                       ) : (
//                         <div className="space-y-2">
//                           {formData.attributes.map((attr) => (
//                             <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//                               <div className="flex items-center space-x-2">
//                                 <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
//                                 <span className="text-sm text-gray-600">{attr.value}</span>
//                               </div>
//                               <button
//                                 type="button"
//                                 onClick={() => removeAttribute(attr.id)}
//                                 className="text-gray-400 hover:text-red-500"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Right Column - Images & Marketing */}
//                 <div className="space-y-6">
//                   {/* Image Upload Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50">
//                       <h3 className="font-semibold text-gray-900">Product Gallery</h3>
//                       <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
//                     </div>
//                     <div className="p-4">
//                       <label className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
//                         isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
//                       }`}
//                       onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                       onDragLeave={() => setIsDragging(false)}
//                       onDrop={(e) => {
//                         e.preventDefault();
//                         setIsDragging(false);
//                         handleImageUpload({ target: { files: e.dataTransfer.files } });
//                       }}>
//                         <input
//                           type="file"
//                           multiple
//                           accept="image/*"
//                           onChange={handleImageUpload}
//                           className="hidden"
//                           disabled={formData.images.length >= 5}
//                         />
//                         <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                         </svg>
//                         <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
//                       </label>

//                       {formData.images.length > 0 && (
//                         <div className="mt-4 space-y-2">
//                           {formData.images.map((image, index) => (
//                             <div
//                               key={image.id}
//                               draggable
//                               onDragStart={(e) => handleImageDragStart(e, index)}
//                               onDragOver={(e) => handleImageDragOver(e, index)}
//                               onDragEnd={handleImageDragEnd}
//                               className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 ${
//                                 image.isMain ? 'border-blue-500' : 'border-transparent'
//                               }`}
//                             >
//                               <div className="w-12 h-12 rounded overflow-hidden bg-white">
//                                 <img src={image.url} alt="" className="w-full h-full object-cover" />
//                               </div>
//                               <div className="flex-1 text-xs truncate">{image.name}</div>
//                               <div className="flex items-center space-x-1">
//                                 {!image.isMain && (
//                                   <button
//                                     type="button"
//                                     onClick={() => setMainImage(image.id)}
//                                     className="p-1 text-gray-500 hover:text-blue-600"
//                                     title="Make main"
//                                   >
//                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                                     </svg>
//                                   </button>
//                                 )}
//                                 <button
//                                   type="button"
//                                   onClick={() => removeImage(image.id)}
//                                   className="p-1 text-gray-500 hover:text-red-600"
//                                 >
//                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                   </svg>
//                                 </button>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Marketing Card */}
//                   <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                     <div className="p-4 border-b border-gray-100 bg-gray-50">
//                       <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
//                     </div>
//                     <div className="p-4 space-y-4">
//                       {/* Featured Toggle */}
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm font-medium text-gray-700">Featured Product</span>
//                         <button
//                           type="button"
//                           onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
//                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                             formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'
//                           }`}
//                         >
//                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                             formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
//                           }`} />
//                         </button>
//                       </div>

//                       {/* Status */}
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//                         <select
//                           name="status"
//                           value={formData.status}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                         >
//                           <option value="draft">Draft</option>
//                           <option value="active">Active</option>
//                           <option value="archived">Archived</option>
//                         </select>
//                       </div>

//                       {/* Sold Info */}
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium text-gray-700">Sold Info</span>
//                           <button
//                             type="button"
//                             onClick={() => setFormData(prev => ({
//                               ...prev,
//                               soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled }
//                             }))}
//                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                               formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'
//                             }`}
//                           >
//                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                               formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'
//                             }`} />
//                           </button>
//                         </div>
//                         {formData.soldInfo.enabled && (
//                           <input
//                             type="number"
//                             value={formData.soldInfo.count}
//                             onChange={(e) => setFormData(prev => ({
//                               ...prev,
//                               soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 }
//                             }))}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             placeholder="Number sold"
//                           />
//                         )}
//                       </div>

//                       {/* FOMO */}
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium text-gray-700">FOMO</span>
//                           <button
//                             type="button"
//                             onClick={() => setFormData(prev => ({
//                               ...prev,
//                               fomo: { ...prev.fomo, enabled: !prev.fomo.enabled }
//                             }))}
//                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                               formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'
//                             }`}
//                           >
//                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                               formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'
//                             }`} />
//                           </button>
//                         </div>
//                         {formData.fomo.enabled && (
//                           <div className="space-y-2">
//                             <select
//                               value={formData.fomo.type}
//                               onChange={(e) => setFormData(prev => ({
//                                 ...prev,
//                                 fomo: { ...prev.fomo, type: e.target.value }
//                               }))}
//                               className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             >
//                               <option value="viewing_now">Viewing Now</option>
//                               <option value="product_left">Product Left</option>
//                               <option value="custom">Custom</option>
//                             </select>

//                             {formData.fomo.type === 'viewing_now' && (
//                               <input
//                                 type="number"
//                                 value={formData.fomo.viewingNow}
//                                 onChange={(e) => setFormData(prev => ({
//                                   ...prev,
//                                   fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 }
//                                 }))}
//                                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                                 placeholder="Viewing now"
//                               />
//                             )}

//                             {formData.fomo.type === 'product_left' && (
//                               <input
//                                 type="number"
//                                 value={formData.fomo.productLeft}
//                                 onChange={(e) => setFormData(prev => ({
//                                   ...prev,
//                                   fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 }
//                                 }))}
//                                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                                 placeholder="Items left"
//                               />
//                             )}

//                             {formData.fomo.type === 'custom' && (
//                               <div className="flex gap-2">
//                                 <input
//                                   type="text"
//                                   value={formData.fomo.customMessage}
//                                   readOnly
//                                   placeholder="Custom message"
//                                   className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                                 />
//                                 <button
//                                   type="button"
//                                   onClick={() => {
//                                     setCustomMessage(formData.fomo.customMessage || '');
//                                     setShowCustomMessageModal(true);
//                                   }}
//                                   className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
//                                 >
//                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                                   </svg>
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Submit Buttons */}
//                   <div className="flex gap-3">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         resetForm();
//                         setShowProductModal(false);
//                       }}
//                       className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700"
//                     >
//                       {isEditing ? 'Update' : 'Create'}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ================= MODALS ================= */}
      
//       {/* Category Modal */}
//       {showCategoryModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
//             <input
//               type="text"
//               value={newCategory}
//               onChange={(e) => setNewCategory(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Electronics"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowCategoryModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddCategory}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Brand Modal */}
//       {showBrandModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h3>
//             <input
//               type="text"
//               value={newBrand}
//               onChange={(e) => setNewBrand(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Apple"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowBrandModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddBrand}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Custom Message Modal */}
//       {showCustomMessageModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Enter FOMO Message</h3>
//             <textarea
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               rows="3"
//               placeholder="e.g., Only 5 left in stock!"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowCustomMessageModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCustomMessageSave}
//                 className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Attribute Modal */}
//       {showAttributeModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add Attribute</h3>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 value={newAttribute.key}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Key (e.g., Material)"
//               />
//               <input
//                 type="text"
//                 value={newAttribute.value}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Value (e.g., Cotton)"
//               />
//             </div>
//             <div className="flex justify-end gap-3 mt-6">
//               <button
//                 onClick={() => setShowAttributeModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={addAttribute}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;