// ADMIN_TABS/ProductsTab.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector }   from "react-redux";
import { toast }                      from "react-toastify";

import ProductDetailModal from "../Shared_components/ProductDetailModal";
import CategoryModal      from "../Shared_components/CategoryModal";
import StatsCards         from "../TOPBAR/StatsCards";
import ProductModal       from "../PRODUCT_MODAL_SEGMENT/ProductModal";
import EditProductModal   from "../PRODUCT_MODAL_SEGMENT/EditProductModal";

import { fetchCategories } from "../ADMIN_REDUX_MANAGEMENT/categoriesSlice";
import { fetchProducts, optimisticUpdateProduct,fetchLowStockProducts }from "../ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice";
import { fetchArchivedProducts } from "../ADMIN_REDUX_MANAGEMENT/adminArchivedSlice";
import {
  softDeleteProduct,
  toggleFeaturedProduct,
  changeProductStatus,
  clearErrors,
}from "../ADMIN_REDUX_MANAGEMENT/adminEditProductSlice";

// ── Formatters (no prop drilling needed) ─────────────────────────────────────
const formatIndianRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);

const getDiscountPercentage = (base, sale) => {
  if (!base || !sale || Number(sale) >= Number(base)) return 0;
  return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100);
};

// ── Default brands ────────────────────────────────────────────────────────────
const DEFAULT_BRANDS = ["Sony", "Samsung", "Apple", "Nike", "Adidas", "Generic"];

const ProductsTab = ({ onSwitchTab }) => {
  const dispatch = useDispatch();

  // ── Redux state ─────────────────────────────────────────────────────────────
  const { products, loading: productsLoading, error: productsError } =
    useSelector((s) => s.adminGetProducts);

  const {
    products: lowStockProducts,
    total:    lowStockTotal,
    loading:  lowStockLoading,
  } = useSelector((s) => s.adminGetProducts.lowStockProducts || {
    products: [], total: 0, loading: false,
  });

  const { products: archivedProducts } =
    useSelector((s) => s.adminArchived);

  const { actionLoading, actionError, deleteLoading, deleteSuccess } =
    useSelector((s) => s.adminEditProduct);

  const { categories } = useSelector((s) => s.categories);

  // ── Local state ──────────────────────────────────────────────────────────────
  const [brands,          setBrands]          = useState(DEFAULT_BRANDS);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [filterStatus,     setFilterStatus]     = useState("all");
  const [filterCategory,   setFilterCategory]   = useState("all");
  const [detailProduct,    setDetailProduct]    = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // ── Initial fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 30 }));
    dispatch(fetchCategories());
    dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
  }, [dispatch]);

  // ── Error handling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (productsError) toast.error(`Failed to load products: ${productsError}`);
  }, [productsError]);

  useEffect(() => {
    if (actionError) {
      toast.error(`Action failed: ${actionError}`);
      dispatch(clearErrors());
    }
  }, [actionError, dispatch]);

  useEffect(() => {
    if (deleteSuccess) {
      toast.success("Product archived successfully");
      dispatch(fetchArchivedProducts());
      dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
    }
  }, [deleteSuccess, dispatch]);

  // ── Refresh helpers ──────────────────────────────────────────────────────────
  const refreshProducts = () => {
    dispatch(fetchProducts({ page: 1, limit: 50 }));
    dispatch(fetchLowStockProducts({ page: 1, limit: 1 }));
  };

  // ── Product actions ──────────────────────────────────────────────────────────
  const handleSoftDelete = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    if (window.confirm(`Archive "${product.name}"? It will be hidden from the website.`)) {
      dispatch(softDeleteProduct(product.slug))
        .unwrap()
        .catch(() => {
          refreshProducts();
          toast.error("Failed to archive product");
        });
    }
  };

  const toggleFeatured = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: !product.isFeatured }));
    dispatch(toggleFeaturedProduct({ product }))
      .unwrap()
      .catch(() => {
        dispatch(optimisticUpdateProduct({ _id: productId, isFeatured: product.isFeatured }));
        toast.error("Failed to toggle featured");
      });
  };

  const changeStatus = (productId, newStatus) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    const prevStatus = product.status;
    dispatch(optimisticUpdateProduct({ _id: productId, status: newStatus }));
    dispatch(changeProductStatus({ product, status: newStatus }))
      .unwrap()
      .catch(() => {
        dispatch(optimisticUpdateProduct({ _id: productId, status: prevStatus }));
        toast.error("Failed to change status");
      });
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  // ── Category helpers ─────────────────────────────────────────────────────────
  const getCategoryName = (productCategory) => {
    if (!productCategory) return "Uncategorized";
    if (typeof productCategory === "object" && productCategory.name) return productCategory.name;
    const categoryId = typeof productCategory === "object" ? productCategory._id : productCategory;
    const found = categories.find(
      (cat) => cat._id === categoryId || cat._id?.toString() === categoryId?.toString()
    );
    return found ? found.name : "Uncategorized";
  };

  const getCategoryId = (productCategory) => {
    if (!productCategory) return null;
    if (typeof productCategory === "object") return productCategory._id;
    return productCategory;
  };

  const handleCategorySelect = (categoryId) => {
    setFilterCategory(categoryId);
    setShowCategoryModal(false);
    dispatch(fetchCategories());
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalProducts    = products.length;
  const activeProducts   = products.filter((p) => p.status === "active").length;
  const featuredProducts = products.filter((p) => p.isFeatured).length;
  const lowStockCount    = lowStockTotal || 0;

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus   = filterStatus   === "all" || product.status === filterStatus;
    const matchesCategory = filterCategory === "all" || getCategoryId(product.category) === filterCategory;
    const matchesLowStock = !showLowStockOnly ||
      lowStockProducts.some((lp) => lp._id === product._id);
    return matchesSearch && matchesStatus && matchesCategory && matchesLowStock;
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (productsLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Action loading overlay */}
      {(actionLoading || deleteLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      {/* StatsCards — all data available right here */}
      <StatsCards
        activeProducts={activeProducts}
        featuredProducts={featuredProducts}
        archivedProducts={archivedProducts?.length || 0}
        lowStockProducts={lowStockCount}
        onViewArchived={() => onSwitchTab("archived")}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Products</p>
              <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Featured</p>
              <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
        <div
          className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer transition-all ${
            showLowStockOnly ? "border-red-500 ring-2 ring-red-200" : "border-gray-200 hover:border-red-300"
          }`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
         <div
          className="flex items-center justify-between relative cursor-pointer group"
          onClick={() => setShowLowStockOnly(prev => !prev)}
        >
          {/* LEFT */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>

            {showLowStockOnly && (
              <p className="text-xs text-red-600 mt-1">Filter active</p>
            )}
          </div>

          {/* ICON */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              showLowStockOnly ? "bg-red-200" : "bg-red-100"
            }`}
          >
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* TOOLTIP */}
          <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition text-xs bg-black text-white px-2 py-1 rounded">
            Click to filter low stock items
          </div>
        </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Search products..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 cursor-pointer py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <div className="relative">
            <select
              value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 pr-12 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              title="Add New Category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {showLowStockOnly && (
            <button
              onClick={() => setShowLowStockOnly(false)}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium flex items-center gap-2"
            >
              <span>Clear Low Stock Filter</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowProductModal(true)}
            className="px-6 cursor-pointer py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const mainVariant = product.variants?.[0] || {};
              const basePrice   = mainVariant.price?.base || 0;
              const salePrice   = mainVariant.price?.sale;
              const discountPct = salePrice ? getDiscountPercentage(basePrice, salePrice) : 0;
              const totalStock  = product.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) || 0;
              const isLowStock  = product.variants?.some((v) => v.inventory?.quantity < v.inventory?.lowStockThreshold);
              const v0Images    = mainVariant.images || [];
              const thumbUrl    = (v0Images.find((img) => img.isMain) || v0Images[0])?.url
                               || product.images?.[0]?.url || null;

              return (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
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
                      {getCategoryName(product.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!product.brand || product.brand === "Generic"
                      ? <span className="text-gray-400">—</span>
                      : <span className="font-medium text-gray-700">{product.brand}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {salePrice ? (
                        <>
                          <span className="text-gray-400 line-through text-xs mr-2">{formatIndianRupee(basePrice)}</span>
                          <span className="font-bold text-gray-900">{formatIndianRupee(salePrice)}</span>
                          {discountPct > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {discountPct}% OFF
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-bold text-gray-900">{formatIndianRupee(basePrice)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${isLowStock ? "text-red-600" : "text-gray-700"}`}>
                        {totalStock}
                      </span>
                      {isLowStock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Low</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={product.status}
                      onChange={(e) => changeStatus(product._id, e.target.value)}
                      disabled={actionLoading}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 cursor-pointer transition-all ${
                        actionLoading ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        product.status === "active" ? "bg-green-100 text-green-700" :
                        product.status === "draft"  ? "bg-yellow-100 text-yellow-700" :
                                                      "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeatured(product._id)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                        actionLoading ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        product.isFeatured
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {product.isFeatured ? "⭐ Featured" : "Regular"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailProduct(product)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleSoftDelete(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {showLowStockOnly
                ? "No low stock products at the moment"
                : `Click "Add Product" to create your first product`}
            </p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          categories={categories}
          onClose={() => setDetailProduct(null)}
          formatIndianRupee={formatIndianRupee}
          getDiscountPercentage={getDiscountPercentage}
        />
      )}

      {/* Category modal */}
      {showCategoryModal && (
        <CategoryModal
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Create product modal */}
      {showProductModal && (
        <ProductModal
          onClose={() => {
            setShowProductModal(false);
            refreshProducts();
          }}
          brands={brands}
          setBrands={setBrands}
        />
      )}

      {/* Edit product modal */}
      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            refreshProducts();
          }}
          brands={brands}
          setBrands={setBrands}
        />
      )}

    </div>
  );
};

export default ProductsTab;
// tryig to make component independent

// // ADMIN_TABS/ProductsTab.jsx

// import React, { useState } from 'react';
// import ProductDetailModal from '../Shared_components/ProductDetailModal';
// import CategoryModal from '../Shared_components/CategoryModal';
// const ProductsTab = ({
//   products,
//   categories,
//   brands,
//   onAddClick,
//   onEdit,
//   onDelete,
//   onToggleFeatured,
//   onChangeStatus,
//   formatIndianRupee,
//   getDiscountPercentage,
//   loading,
//   actionLoading,
//   // NEW: Add these props
//   lowStockProducts = [],
//   lowStockLoading = false,
//    onCategoryChange,
// }) => {
//   const [searchTerm,     setSearchTerm]     = useState('');
//   const [filterStatus,   setFilterStatus]   = useState('all');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [detailProduct,  setDetailProduct]  = useState(null);
//   const [showLowStockOnly, setShowLowStockOnly] = useState(false);
//   const [showCategoryModal, setShowCategoryModal] = useState(false);

//   const getCategoryName = (productCategory) => {
//     if (!productCategory) return 'Uncategorized';
//     if (typeof productCategory === 'object' && productCategory.name) return productCategory.name;
//     const categoryId = typeof productCategory === 'object' ? productCategory._id : productCategory;
//     const found = categories.find(
//       (cat) => cat._id === categoryId || cat._id?.toString() === categoryId?.toString()
//     );
//     return found ? found.name : 'Uncategorized';
//   };

//   const getCategoryId = (productCategory) => {
//     if (!productCategory) return null;
//     if (typeof productCategory === 'object') return productCategory._id;
//     return productCategory;
//   };
//   const handleCategorySelect = (categoryId) => {
//     // Auto-select the newly created category in the dropdown
//     setFilterCategory(categoryId);
//     setShowCategoryModal(false);
    
//     // Refresh categories list from parent if callback provided
//     if (onCategoryChange) {
//       onCategoryChange();
//     }
//   };
//   const totalProducts    = products.length;
//   const activeProducts   = products.filter((p) => p.status === 'active').length;
//   const featuredProducts = products.filter((p) => p.isFeatured).length;
  
//   // FIXED: Use the low stock count from the API
//   const lowStockCount = lowStockProducts?.length || 0;

//   // Filter products based on search, status, category, and low stock toggle
//   const filteredProducts = products.filter((product) => {
//     const matchesSearch =
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
//     const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
//     const matchesCategory = filterCategory === 'all' || getCategoryId(product.category) === filterCategory;
    
//     // If low stock filter is active, only show products that are in the lowStockProducts list
//     const matchesLowStock = !showLowStockOnly || 
//       lowStockProducts.some(lp => lp._id === product._id);
    
//     return matchesSearch && matchesStatus && matchesCategory && matchesLowStock;
//   });

//   if (loading || lowStockLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Total Products</p>
//               <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Active Products</p>
//               <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Featured</p>
//               <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         {/* FIXED: Low Stock card now shows count from API and can be clicked to filter */}
//         <div 
//           className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer transition-all ${
//             showLowStockOnly 
//               ? 'border-red-500 ring-2 ring-red-200' 
//               : 'border-gray-200 hover:border-red-300'
//           }`}
//           onClick={() => setShowLowStockOnly(!showLowStockOnly)}
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Low Stock</p>
//               <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>
//               {showLowStockOnly && (
//                 <p className="text-xs text-red-600 mt-1">Filter active</p>
//               )}
//             </div>
//             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
//               showLowStockOnly ? 'bg-red-200' : 'bg-red-100'
//             }`}>
//               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input type="text" placeholder="Search products..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
//           </div>
//           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 cursor-pointer py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
//             <option value="all">All Status</option>
//             <option value="draft">Draft</option>
//             <option value="active">Active</option>
//           </select>
//        {/* MODIFIED: Category dropdown with plus icon */}
//           <div className="relative">  {/* ✅ NEW wrapper div with relative positioning */}
//             <select 
//               value={filterCategory} 
//               onChange={(e) => setFilterCategory(e.target.value)}
//               className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 pr-12 appearance-none cursor-pointer"  // ✅ ADDED pr-12 for icon space
//             >
//               <option value="all">All Categories</option>
//               {categories.map((cat) => (
//                 <option key={cat._id} value={cat._id}>{cat.name}</option>
//               ))}
//             </select>
            
//             {/* ✅ NEW: Plus icon button */}
//             <button
//               onClick={() => setShowCategoryModal(true)}  // Opens modal
//               className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
//               title="Add New Category"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
//               </svg>
//             </button>
//           </div>
//           {showLowStockOnly && (
//             <button
//               onClick={() => setShowLowStockOnly(false)}
//               className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium flex items-center gap-2"
//             >
//               <span>Clear Low Stock Filter</span>
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           )}
//           <button onClick={onAddClick}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2">
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span>Add Product</span>
//           </button>
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const mainVariant = product.variants?.[0] || {};
//               const basePrice   = mainVariant.price?.base || 0;
//               const salePrice   = mainVariant.price?.sale;
//               const discountPct = salePrice ? getDiscountPercentage(basePrice, salePrice) : 0;
//               const totalStock  = product.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) || 0;
//               const isLowStock  = product.variants?.some((v) => v.inventory?.quantity < v.inventory?.lowStockThreshold);

//               // Thumbnail
//               const v0Images   = mainVariant.images || [];
//               const thumbUrl   = (v0Images.find((img) => img.isMain) || v0Images[0])?.url
//                               || product.images?.[0]?.url
//                               || null;

//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
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
//                       {getCategoryName(product.category)}
//                     </span>
//                   </td>

//                   <td className="px-6 py-4 text-sm">
//                     {!product.brand || product.brand === 'Generic'
//                       ? <span className="text-gray-400">—</span>
//                       : <span className="font-medium text-gray-700">{product.brand}</span>}
//                   </td>

//                   <td className="px-6 py-4">
//                     <div className="text-sm">
//                       {salePrice ? (
//                         <>
//                           <span className="text-gray-400 line-through text-xs mr-2">{formatIndianRupee(basePrice)}</span>
//                           <span className="font-bold text-gray-900">{formatIndianRupee(salePrice)}</span>
//                           {discountPct > 0 && (
//                             <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                               {discountPct}% OFF
//                             </span>
//                           )}
//                         </>
//                       ) : (
//                         <span className="font-bold text-gray-900">{formatIndianRupee(basePrice)}</span>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
//                         {totalStock}
//                       </span>
//                       {isLowStock && (
//                         <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Low</span>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4">
//                     <select
//                       value={product.status}
//                       onChange={(e) => onChangeStatus(product._id, e.target.value)}
//                       disabled={actionLoading}
//                       className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 cursor-pointer transition-all ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.status === 'active' ? 'bg-green-100 text-green-700' :
//                         product.status === 'draft'  ? 'bg-yellow-100 text-yellow-700' :
//                                                       'bg-gray-100 text-gray-700'
//                       }`}
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                     </select>
//                   </td>

//                   <td className="px-6 py-4">
//                     <button
//                       onClick={() => onToggleFeatured(product._id)}
//                       disabled={actionLoading}
//                       className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.isFeatured
//                           ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                     >
//                       {product.isFeatured ? '⭐ Featured' : 'Regular'}
//                     </button>
//                   </td>

//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button onClick={() => setDetailProduct(product)}
//                         className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title="View Details">
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                       </button>
//                       <button onClick={() => onEdit(product)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                         </svg>
//                       </button>
//                       <button onClick={() => onDelete(product._id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                             d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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
//                 d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//             <p className="text-gray-500">
//               {showLowStockOnly 
//                 ? "No low stock products at the moment" 
//                 : "Click \"Add Product\" to create your first product"}
//             </p>
//           </div>
//         )}
//       </div>

//       {detailProduct && (
//         <ProductDetailModal
//           product={detailProduct}
//           categories={categories}
//           onClose={() => setDetailProduct(null)}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//       {showCategoryModal && (
//       <CategoryModal
//         onSelect={handleCategorySelect}  // Called when category is created/selected
//         onClose={() => setShowCategoryModal(false)}  // Close modal
//       />
//     )}

//     </div>
//   );
// };

// export default ProductsTab;
// start again 

// // ADMIN_TABS/ProductsTab.jsx

// import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import ProductDetailModal from '../Shared_components/ProductDetailModal';

// const ProductsTab = ({
//   products,
//   categories,
//   brands,
//   onAddClick,
//   onEdit,
//   onDelete,
//   onToggleFeatured,
//   onChangeStatus,
//   formatIndianRupee,
//   getDiscountPercentage,
//   loading
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [detailProduct, setDetailProduct] = useState(null);

//   // Disable status/featured controls while an action is in progress
//   const { actionLoading } = useSelector((state) => state.adminProducts);
//   // ─────────────────────────────────────────────────────────────
//   const getCategoryName = (productCategory) => {
//     if (!productCategory) return 'Uncategorized';

//     // Case (a): already a populated object with name
//     if (typeof productCategory === 'object' && productCategory.name) {
//       return productCategory.name;
//     }

//     // Case (b): raw ObjectId string — look up in categories prop
//     const categoryId = typeof productCategory === 'object'
//       ? productCategory._id
//       : productCategory;

//     const found = categories.find(
//       (cat) => cat._id === categoryId || cat._id?.toString() === categoryId?.toString()
//     );

//     return found ? found.name : 'Uncategorized';
//   };

//   // Stats
//   const totalProducts = products.length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p =>
//     p.variants?.some(v => v.inventory?.quantity < v.inventory?.lowStockThreshold)
//   ).length;

//   // Filter — also uses getCategoryId helper for matching
//   const getCategoryId = (productCategory) => {
//     if (!productCategory) return null;
//     if (typeof productCategory === 'object') return productCategory._id;
//     return productCategory; // already a string id
//   };

//   const filteredProducts = products.filter(product => {
//     const matchesSearch =
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));

//     const matchesStatus = filterStatus === 'all' || product.status === filterStatus;

//     const matchesCategory =
//       filterCategory === 'all' ||
//       getCategoryId(product.category) === filterCategory;

//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* ── Stats Cards ── */}
//       <div className="grid grid-cols-4 gap-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Total Products</p>
//               <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Active Products</p>
//               <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Featured</p>
//               <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Low Stock</p>
//               <p className="text-3xl font-bold text-gray-900">{lowStock}</p>
//             </div>
//             <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── Filters Bar ── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search products..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Status</option>
//             <option value="draft">Draft</option>
//             <option value="active">Active</option>
//           </select>
//           <select
//             value={filterCategory}
//             onChange={(e) => setFilterCategory(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Categories</option>
//             {categories.map(cat => (
//               <option key={cat._id} value={cat._id}>{cat.name}</option>
//             ))}
//           </select>
//           <button
//             onClick={onAddClick}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span>Add Product</span>
//           </button>
//         </div>
//       </div>

//       {/* ── Products Table ── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const mainVariant = product.variants?.[0] || {};
//               const basePrice = mainVariant.price?.base || 0;
//               const salePrice = mainVariant.price?.sale;
//               const discountPercentage = salePrice ? getDiscountPercentage(basePrice, salePrice) : 0;
//               const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) || 0;
//               const isLowStock = product.variants?.some(v =>
//                 v.inventory?.quantity < v.inventory?.lowStockThreshold
//               );

//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors group">

//                   {/* Product Name + Title */}
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{product.name}</div>
//                       <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                     </div>
//                   </td>

//                   {/* Category — uses getCategoryName() to handle both
//                       populated objects AND raw ObjectId strings from backend */}
//                   <td className="px-6 py-4">
//                     <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                       {getCategoryName(product.category)}
//                     </span>
//                   </td>

//                   {/* Brand */}
//                   <td className="px-6 py-4 text-sm">
//                     {!product.brand || product.brand === 'Generic' ? (
//                       <span className="text-gray-400">—</span>
//                     ) : (
//                       <span className="font-medium text-gray-700">{product.brand}</span>
//                     )}
//                   </td>

//                   {/* Price */}
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
//                           {discountPercentage > 0 && (
//                             <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                               {discountPercentage}% OFF
//                             </span>
//                           )}
//                         </>
//                       ) : (
//                         <span className="font-bold text-gray-900">{formatIndianRupee(basePrice)}</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Inventory */}
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
//                         {totalStock}
//                       </span>
//                       {isLowStock && (
//                         <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Low</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Status — disabled while actionLoading */}
//                   <td className="px-6 py-4">
//                     <select
//                       value={product.status}
//                       onChange={(e) => onChangeStatus(product._id, e.target.value)}
//                       disabled={actionLoading}
//                       className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 transition-opacity ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.status === 'active' ? 'bg-green-100 text-green-700' :
//                         product.status === 'draft'  ? 'bg-yellow-100 text-yellow-700' :
//                                                       'bg-gray-100 text-gray-700'
//                       }`}
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                     </select>
//                   </td>

//                   {/* Featured — disabled while actionLoading */}
//                   <td className="px-6 py-4">
//                     <button
//                       onClick={() => onToggleFeatured(product._id)}
//                       disabled={actionLoading}
//                       className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.isFeatured
//                           ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                     >
//                       {product.isFeatured ? '⭐ Featured' : 'Regular'}
//                     </button>
//                   </td>

//                   {/* Actions: View, Edit, Archive */}
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">

//                       {/* 👁 View Detail */}
//                       <button
//                         onClick={() => setDetailProduct(product)}
//                         className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title="View Details"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                       </button>

//                       {/* ✏️ Edit */}
//                       <button
//                         onClick={() => onEdit(product)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="Edit"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                         </svg>
//                       </button>

//                       {/* 🗄 Archive */}
//                       <button
//                         onClick={() => onDelete(product._id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Archive"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//             <p className="text-gray-500">Click "Add Product" to create your first product</p>
//           </div>
//         )}
//       </div>

//       {/* ── Product Detail Modal ── */}
//       {detailProduct && (
//         <ProductDetailModal
//           product={detailProduct}
//           categories={categories}
//           onClose={() => setDetailProduct(null)}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default ProductsTab;
// category issue fixed

// // ADMIN_TABS/ProductsTab.jsx

// import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import ProductDetailModal from '../Shared_components/ProductDetailModal';

// const ProductsTab = ({
//   products,
//   categories,
//   brands,
//   onAddClick,
//   onEdit,
//   onDelete,
//   onToggleFeatured,
//   onChangeStatus,
//   formatIndianRupee,
//   getDiscountPercentage,
//   loading
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [detailProduct, setDetailProduct] = useState(null);

//   // Disable status/featured controls while an action is in progress
//   const { actionLoading } = useSelector((state) => state.adminProducts);

//   // Stats
//   const totalProducts = products.length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p =>
//     p.variants?.some(v => v.inventory?.quantity < v.inventory?.lowStockThreshold)
//   ).length;

//   // Filter
//   const filteredProducts = products.filter(product => {
//     const matchesSearch =
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
//     const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
//     const matchesCategory =
//       filterCategory === 'all' ||
//       product.category?._id === filterCategory ||
//       product.category === filterCategory;
//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-gray-500">Loading products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* ── Stats Cards ── */}
//       <div className="grid grid-cols-4 gap-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Total Products</p>
//               <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Active Products</p>
//               <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Featured</p>
//               <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Low Stock</p>
//               <p className="text-3xl font-bold text-gray-900">{lowStock}</p>
//             </div>
//             <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── Filters Bar ── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search products..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Status</option>
//             <option value="draft">Draft</option>
//             <option value="active">Active</option>
//           </select>
//           <select
//             value={filterCategory}
//             onChange={(e) => setFilterCategory(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Categories</option>
//             {categories.map(cat => (
//               <option key={cat._id} value={cat._id}>{cat.name}</option>
//             ))}
//           </select>
//           <button
//             onClick={onAddClick}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span>Add Product</span>
//           </button>
//         </div>
//       </div>

//       {/* ── Products Table ── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const mainVariant = product.variants?.[0] || {};
//               const basePrice = mainVariant.price?.base || 0;
//               const salePrice = mainVariant.price?.sale;
//               const discountPercentage = salePrice ? getDiscountPercentage(basePrice, salePrice) : 0;
//               const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) || 0;
//               const isLowStock = product.variants?.some(v =>
//                 v.inventory?.quantity < v.inventory?.lowStockThreshold
//               );

//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors group">

//                   {/* Product Name + Title */}
//                   <td className="px-6 py-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{product.name}</div>
//                       <div className="text-sm text-gray-500 truncate max-w-xs">{product.title}</div>
//                     </div>
//                   </td>

//                   {/* Category */}
//                   <td className="px-6 py-4">
//                     <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                       {product.category?.name || 'Uncategorized'}
//                     </span>
//                   </td>

//                   {/* Brand */}
//                   <td className="px-6 py-4 text-sm">
//                     {!product.brand || product.brand === 'Generic' ? (
//                       <span className="text-gray-400">—</span>
//                     ) : (
//                       <span className="font-medium text-gray-700">{product.brand}</span>
//                     )}
//                   </td>

//                   {/* Price */}
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
//                           {discountPercentage > 0 && (
//                             <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                               {discountPercentage}% OFF
//                             </span>
//                           )}
//                         </>
//                       ) : (
//                         <span className="font-bold text-gray-900">{formatIndianRupee(basePrice)}</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Inventory */}
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
//                         {totalStock}
//                       </span>
//                       {isLowStock && (
//                         <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Low</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Status — disabled while actionLoading */}
//                   <td className="px-6 py-4">
//                     <select
//                       value={product.status}
//                       onChange={(e) => onChangeStatus(product._id, e.target.value)}
//                       disabled={actionLoading}
//                       className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 transition-opacity ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.status === 'active' ? 'bg-green-100 text-green-700' :
//                         product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-gray-100 text-gray-700'
//                       }`}
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                     </select>
//                   </td>

//                   {/* Featured — disabled while actionLoading */}
//                   <td className="px-6 py-4">
//                     <button
//                       onClick={() => onToggleFeatured(product._id)}
//                       disabled={actionLoading}
//                       className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
//                         actionLoading ? 'opacity-50 cursor-not-allowed' : ''
//                       } ${
//                         product.isFeatured
//                           ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                     >
//                       {product.isFeatured ? '⭐ Featured' : 'Regular'}
//                     </button>
//                   </td>

//                   {/* Actions: View, Edit, Archive */}
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">

//                       {/* 👁 View Detail */}
//                       <button
//                         onClick={() => setDetailProduct(product)}
//                         className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title="View Details"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                       </button>

//                       {/* ✏️ Edit */}
//                       <button
//                         onClick={() => onEdit(product)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="Edit"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                         </svg>
//                       </button>

//                       {/* 🗄 Archive */}
//                       <button
//                         onClick={() => onDelete(product._id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Archive"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//             <p className="text-gray-500">Click "Add Product" to create your first product</p>
//           </div>
//         )}
//       </div>

//       {/* ── Product Detail Modal ── */}
//       {detailProduct && (
//         <ProductDetailModal
//           product={detailProduct}
//           onClose={() => setDetailProduct(null)}
//           formatIndianRupee={formatIndianRupee}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}
//     </div>
//   );
// };

// export default ProductsTab;

// code upside api integration
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const ProductsTab = ({ 
//   products, 
//   categories, 
//   brands, 
//   onAddClick, 
//   onEdit, 
//   onDelete, 
//   onToggleFeatured, 
//   onChangeStatus,
//   formatIndianRupee,
//   getDiscountPercentage,
//   archivedProducts
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const navigate = useNavigate(); 
//   // Stats for cards
//   const totalProducts = products.length;
//   // const archivedProducts = products.filter(p => p.status === 'archived').length;
//   const activeProducts = products.filter(p => p.status === 'active').length;
//   const featuredProducts = products.filter(p => p.isFeatured).length;
//   const lowStock = products.filter(p => 
//     p.inventory?.quantity < p.inventory?.lowStockThreshold
//   ).length;

//   // Filter products
//   const filteredProducts = products.filter(product => {
//     const matchesSearch = 
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
//     const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
//     const matchesCategory = filterCategory === 'all' || product.category?._id === filterCategory;
    
//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   return (
//     <div className="space-y-6">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-5 gap-6">
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Total Products</p>
//               <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Active Products</p>
//               <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Featured</p>
//               <p className="text-3xl font-bold text-gray-900">{featuredProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-500 mb-1">Low Stock</p>
//               <p className="text-3xl font-bold text-gray-900">{lowStock}</p>
//             </div>
//             <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex items-center justify-between">
//             <div onClick={()=>{navigate('/admin/products/archived')}} className="cursor-pointer">
//               <p className="text-sm text-gray-500 mb-1">Archived Products</p>
//               <p className="text-3xl font-bold text-gray-900">{archivedProducts}</p>
//             </div>
//             <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
//               <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters Bar */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search products..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Status</option>
//             <option value="draft">Draft</option>
//             <option value="active">Active</option>
//           </select>
//           <select
//             value={filterCategory}
//             onChange={(e) => setFilterCategory(e.target.value)}
//             className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Categories</option>
//             {categories.map(cat => (
//               <option key={cat._id} value={cat._id}>{cat.name}</option>
//             ))}
//           </select>
//           <button
//             onClick={onAddClick}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span>Add Product</span>
//           </button>
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredProducts.map((product) => {
//               const discountPercentage = getDiscountPercentage(product.price.base, product.price.sale);
//               const isLowStock = product.inventory?.quantity < product.inventory?.lowStockThreshold;
              
//               return (
//                 <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
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
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2">
//                       <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
//                         {product.inventory?.quantity || 0}
//                       </span>
//                       {isLowStock && (
//                         <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
//                           Low
//                         </span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <select
//                       value={product.status}
//                       onChange={(e) => onChangeStatus(product._id, e.target.value)}
//                       className={`text-xs px-3 py-1.5 rounded-xl font-medium border-0 focus:ring-2 ${
//                         product.status === 'active' ? 'bg-green-100 text-green-700' :
//                         product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-gray-100 text-gray-700'
//                       }`}
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                     </select>
//                   </td>
//                   <td className="px-6 py-4">
//                     <button
//                       onClick={() => onToggleFeatured(product._id)}
//                       className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
//                         product.isFeatured 
//                           ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                     >
//                       {product.isFeatured ? 'Featured' : 'Regular'}
//                     </button>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={() => onEdit(product)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="Edit"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                         </svg>
//                       </button>
//                       <button
//                         onClick={() => onDelete(product._id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Archive"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//             <p className="text-gray-500">Click "Add Product" to create your first product</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProductsTab;