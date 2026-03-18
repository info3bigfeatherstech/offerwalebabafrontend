import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal
} from "lucide-react";

import ProductCard from "../ProductCard";
import SkeletonCard from "../Product_Card_Skelleton/SkeletonCard";

import {
  fetchProductsByCategory,
  selectProductsBySlug,
  selectLoadingBySlug,
  selectErrorBySlug,
  selectPaginationBySlug,
} from "../../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice";

import {
  fetchCategoryBySlug,
  clearCurrentCategory,
  selectCurrentCategory,
} from "../../../components/REDUX_FEATURES/REDUX_SLICES/userCategoriesSlice";

// ─────────────────────────────────────────────────────────────────────────────
// Premium Pagination
// ─────────────────────────────────────────────────────────────────────────────
const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages } = pagination;
  if (!totalPages || totalPages <= 1) return null;

  const delta = 1;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-16 py-8 border-t border-zinc-100">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-zinc-200 disabled:opacity-30 hover:bg-zinc-900 hover:text-white transition-all"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-10 h-10 text-xs font-bold transition-all ${
            p === page ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-900"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-zinc-200 disabled:opacity-30 hover:bg-zinc-900 hover:text-white transition-all"
      >
        Next
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CatProducts — Main Component
// ─────────────────────────────────────────────────────────────────────────────
const CatProducts = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── Selectors ──────────────────────────────────────────────────────────────
  // ✅ now reads from per-slug buckets — no race condition with homepage sections
  const products   = useSelector(selectProductsBySlug(slug));
  const pagination = useSelector(selectPaginationBySlug(slug)) || { page: 1, totalPages: 1, total: 0 };
  const catLoading = useSelector(selectLoadingBySlug(slug));
  const catError   = useSelector(selectErrorBySlug(slug));

  // category meta (name, image, description)
  const currentCategory    = useSelector(selectCurrentCategory);
  const categoryLoadingState = useSelector((s) => s.userCategories.loading.category);
  const categoryErrorState   = useSelector((s) => s.userCategories.error.category);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isLoading = catLoading || categoryLoadingState;
  const hasError  = !isLoading && (!!catError || !!categoryErrorState);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    console.log(`🗂️ [CatProducts] slug changed → "${slug}"`);

    // clear previous category meta so stale name/image doesn't flash
    dispatch(clearCurrentCategory());

    // fetch category meta (name, description, image)
    dispatch(fetchCategoryBySlug(slug));

    // fetch products for this slug
    // ✅ stored in categoryProducts[slug] — won't overwrite other slugs
    dispatch(fetchProductsByCategory({ slug, page: 1, limit: 12 }));

    return () => {
      console.log(`🧹 [CatProducts] cleanup for slug="${slug}"`);
      dispatch(clearCurrentCategory());
      // NOTE: we intentionally do NOT clear categoryProducts[slug] here
      // so if the user navigates back, they see cached products instantly
    };
  }, [slug, dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 [CatProducts] slug="${slug}" → page=${newPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch(fetchProductsByCategory({ slug, page: newPage, limit: 12 }));
  }, [slug, dispatch]);

  const handleRetry = () => {
    console.log(`🔄 [CatProducts] Retrying slug="${slug}"`);
    dispatch(fetchCategoryBySlug(slug));
    dispatch(fetchProductsByCategory({ slug, page: 1, limit: 12 }));
  };

  const categoryName = currentCategory?.name || slug?.replace(/-/g, " ") || "Collection";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── BREADCRUMB HEADER ── */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1 text-zinc-500 hover:text-zinc-900">
              <ArrowLeft size={20} />
            </button>
            <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              <Link to="/" className="hover:text-zinc-900">Home</Link>
              <ChevronRight size={10} />
              <span className="text-zinc-900 font-bold">{categoryName}</span>
            </nav>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="md:hidden p-2 text-zinc-900"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* ── HERO HEADER ── */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-zinc-900">
        {currentCategory?.image?.url ? (
          <>
            <img
              src={currentCategory.image.url}
              alt={categoryName}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-zinc-100" />
        )}

        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-4">
            {categoryName}
          </h1>
          {currentCategory?.description && (
            <p className="max-w-xl mx-auto text-zinc-200 text-sm md:text-base font-light leading-relaxed">
              {currentCategory.description}
            </p>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-10">

        {/* ── SIDEBAR ── */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <SlidersHorizontal size={16} />
              <span className="text-sm font-bold uppercase tracking-widest">Filters</span>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-4">Price Range</h4>
                <div className="space-y-2">
                  {['Under ₹1000', '₹1000 - ₹5000', 'Over ₹5000'].map(range => (
                    <label key={range} className="flex items-center gap-3 text-sm text-zinc-600 cursor-pointer hover:text-zinc-900">
                      <input type="checkbox" className="w-4 h-4 accent-zinc-900" />
                      {range}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── PRODUCT GRID ── */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-50 md:border-none">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              {pagination.total || 0} Products Found
            </p>
          </div>

          {/* Error State */}
          {hasError && (
            <div className="py-20 text-center">
              <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
              <p className="text-zinc-600 mb-2">
                {catError?.message || categoryErrorState?.message || "Error loading products"}
              </p>
              <p className="text-zinc-400 text-xs mb-6">slug: {slug}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Products */}
          {!isLoading && !hasError && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
                {products.map((product, idx) => (
                  <ProductCard key={product._id || idx} product={product} index={idx} />
                ))}
              </div>
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && products.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100">
              <p className="text-zinc-400 uppercase tracking-widest text-xs">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE FILTER DRAWER ── */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[80%] bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold uppercase tracking-tighter">Filter</h3>
              <button onClick={() => setIsFilterOpen(false)}><X size={24} /></button>
            </div>
            <div className="space-y-8">
              <p className="text-xs font-black uppercase tracking-widest mb-4">Price</p>
              <div className="space-y-4">
                {['Under ₹1000', '₹1000 - ₹5000', 'Over ₹5000'].map(range => (
                  <div key={range} className="flex items-center justify-between">
                    <span className="text-sm">{range}</span>
                    <input type="checkbox" className="w-5 h-5 accent-zinc-900" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-zinc-900 text-white py-4 text-xs font-black uppercase tracking-widest"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatProducts;

// import React, { useEffect, useCallback, useState } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   ShoppingCart,
//   Heart,
//   Eye,
//   ArrowLeft,
//   AlertCircle,
//   RefreshCw,
//   Star,
// } from "lucide-react";

// // IMPORT THE NEW COMPONENTS
// import ProductCard from "../ProductCard";
// import SkeletonCard from "../Product_Card_Skelleton/SkeletonCard";

// import {
//   fetchProductsByCategory,
//   clearProducts,
//   selectAllProducts,
//   selectProductPagination,
//   selectProductsLoading,
//   selectProductsError,
// } from "../../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice";

// import {
//   fetchCategoryBySlug,
//   clearCurrentCategory,
//   selectCurrentCategory,
// } from "../../../components/REDUX_FEATURES/REDUX_SLICES/userCategoriesSlice";

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers (only keep the ones used in this file)
// // ─────────────────────────────────────────────────────────────────────────────
// const formatPrice = (amount) => {
//   if (amount == null) return "—";
//   return new Intl.NumberFormat("en-IN", {
//     maximumFractionDigits: 0
//   }).format(amount);
// };

// const logError = (context, error, info = {}) => {
//   console.group(`🔴 [CatProducts] ERROR in ${context}`);
//   console.error("Error:", error);
//   console.log("Info:", info);
//   console.groupEnd();
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Pagination (stays here as it's page-specific)
// // ─────────────────────────────────────────────────────────────────────────────
// const Pagination = ({ pagination, onPageChange }) => {
//   const { page, totalPages } = pagination;
//   if (!totalPages || totalPages <= 1) return null;

//   const delta = 2;
//   const pages = [];
//   for (
//     let i = Math.max(1, page - delta);
//     i <= Math.min(totalPages, page + delta);
//     i++
//   ) {
//     pages.push(i);
//   }

//   return (
//     <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
//       <button
//         disabled={page <= 1}
//         onClick={() => onPageChange(page - 1)}
//         className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-[#f7a221] hover:text-[#f7a221] transition-colors duration-200 font-medium"
//       >
//         ‹ Prev
//       </button>

//       {pages[0] > 1 && (
//         <>
//           <button
//             onClick={() => onPageChange(1)}
//             className="px-3 py-2 text-sm rounded-xl border border-gray-200 hover:border-[#f7a221] hover:text-[#f7a221] transition-colors font-medium"
//           >
//             1
//           </button>
//           {pages[0] > 2 && <span className="text-gray-400 text-sm px-1">…</span>}
//         </>
//       )}

//       {pages.map((p) => (
//         <button
//           key={p}
//           onClick={() => onPageChange(p)}
//           className={`px-3 py-2 text-sm rounded-xl border transition-colors duration-200 font-medium ${
//             p === page
//               ? "bg-[#f7a221] border-[#f7a221] text-white"
//               : "border-gray-200 hover:border-[#f7a221] hover:text-[#f7a221]"
//           }`}
//         >
//           {p}
//         </button>
//       ))}

//       {pages[pages.length - 1] < totalPages && (
//         <>
//           {pages[pages.length - 1] < totalPages - 1 && (
//             <span className="text-gray-400 text-sm px-1">…</span>
//           )}
//           <button
//             onClick={() => onPageChange(totalPages)}
//             className="px-3 py-2 text-sm rounded-xl border border-gray-200 hover:border-[#f7a221] hover:text-[#f7a221] transition-colors font-medium"
//           >
//             {totalPages}
//           </button>
//         </>
//       )}

//       <button
//         disabled={page >= totalPages}
//         onClick={() => onPageChange(page + 1)}
//         className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-[#f7a221] hover:text-[#f7a221] transition-colors duration-200 font-medium"
//       >
//         Next ›
//       </button>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // CatProducts — Main Component
// // ─────────────────────────────────────────────────────────────────────────────
// const CatProducts = () => {
//   const { slug } = useParams();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   // ── Redux selectors — products ────────────────────────────────────────────
//   const products        = useSelector(selectAllProducts);
//   const pagination      = useSelector(selectProductPagination);
//   const loadingMap      = useSelector(selectProductsLoading);
//   const errorMap        = useSelector(selectProductsError);
//   const loadingProducts = loadingMap.categoryProducts;
//   const errorProducts   = errorMap.categoryProducts;

//   // ── Redux selectors — category ────────────────────────────────────────────
//   const currentCategory = useSelector(selectCurrentCategory);
//   const loadingCategory = useSelector((s) => s.userCategories.loading.category);
//   const errorCategory   = useSelector((s) => s.userCategories.error.category);

//   // ── Fetch on slug change ──────────────────────────────────────────────────
//   useEffect(() => {
//     if (!slug) return;

//     console.log(`🗂️ [CatProducts] mounting → slug: "${slug}"`);

//     // Clear stale data from previous category
//     dispatch(clearProducts());
//     dispatch(clearCurrentCategory());

//     // Fire both requests in parallel
//     dispatch(fetchCategoryBySlug(slug))
//       .unwrap()
//       .then((d) =>
//         // console.log(`✅ [CatProducts] category: "${d.category?.name}"`)
//         // console.log(`✅ [CatProducts] category: "${d.category?.name}"`)
//           console.log("RAW API RESPONSE....??:", JSON.stringify(d, null, 2))
//       )
//       .catch((e) => logError("fetchCategoryBySlug", e, { slug }));

//     dispatch(fetchProductsByCategory({ slug, page: 1, limit: 12 }))
//       .unwrap()
//       .then((d) =>
//         // console.log(`✅ [CatProducts] products loaded: ${d.products?.length}`)
//          console.log("FIRST PRODUCT FULL OBJECt PRODUCT:", JSON.stringify(d.products?.[0], null, 2))
//       )
//       .catch((e) => logError("fetchProductsByCategory", e, { slug }));

//     // Cleanup stale data when leaving the page
//     return () => {
//       dispatch(clearProducts());
//       dispatch(clearCurrentCategory());
//     };
//   }, [slug, dispatch]);

//   // ── Page change ───────────────────────────────────────────────────────────
//   const handlePageChange = useCallback(
//     (newPage) => {
//       console.log(`📄 [CatProducts] page → ${newPage}`);
//       window.scrollTo({ top: 0, behavior: "smooth" });
//       dispatch(fetchProductsByCategory({ slug, page: newPage, limit: 12 }))
//         .unwrap()
//         .catch((e) =>
//           logError("fetchProductsByCategory (pagination)", e, { slug, newPage })
//         );
//     },
//     [slug, dispatch]
//   );

//   // ── Retry ─────────────────────────────────────────────────────────────────
//   const handleRetry = () => {
//     console.log(`🔄 [CatProducts] retrying → slug: "${slug}"`);
//     dispatch(fetchCategoryBySlug(slug));
//     dispatch(fetchProductsByCategory({ slug, page: 1, limit: 12 }));
//   };

//   // ── Derived state ─────────────────────────────────────────────────────────
//   const isLoading = loadingProducts || loadingCategory;
//   const hasError  = !isLoading && (!!errorProducts || !!errorCategory);
//   const categoryName =
//     currentCategory?.name ||
//     slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
//     "Category";

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gray-50">

//       {/* ── Sticky breadcrumb bar ──────────────────────────────────────────── */}
//       <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             aria-label="Go back"
//             className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors duration-200 flex-shrink-0"
//           >
//             <ArrowLeft size={20} />
//           </button>

//           <nav
//             aria-label="Breadcrumb"
//             className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5 flex-wrap min-w-0"
//           >
//             <Link to="/" className="hover:text-[#f7a221] transition-colors whitespace-nowrap">
//               Home
//             </Link>
//             <span>/</span>
//             <span className="text-gray-700 font-semibold capitalize truncate">
//               {categoryName}
//             </span>
//           </nav>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

//         {/* ── Category hero — name + image, top center ───────────────────── */}
//         <div className="text-center mb-8 sm:mb-12">
//           {currentCategory?.image?.url && (
//             <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mx-auto mb-4 shadow-md border border-gray-100">
//               <img
//                 src={currentCategory.image.url}
//                 alt={categoryName}
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           )}

//           <div className="flex items-center justify-center gap-3 mb-2">
//             <span className="w-2 h-8 md:w-2.5 md:h-10 bg-[#f7a221] rounded-full shadow-[0_0_14px_rgba(247,162,33,0.4)] flex-shrink-0" />
//             <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 capitalize tracking-tight">
//               {categoryName}
//             </h1>
//           </div>

//           {currentCategory?.description && (
//             <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
//               {currentCategory.description}
//             </p>
//           )}

//           {!isLoading && !hasError && pagination.total > 0 && (
//             <p className="text-xs text-gray-400 mt-3">
//               {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
//             </p>
//           )}
//         </div>

//         {/* ── Error state ───────────────────────────────────────────────────── */}
//         {hasError && (
//           <div className="flex flex-col items-center justify-center py-16 gap-4">
//             <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
//               <AlertCircle size={28} className="text-red-400" />
//             </div>
//             <p className="text-gray-600 text-sm sm:text-base text-center max-w-sm">
//               {errorProducts?.message ||
//                 errorCategory?.message ||
//                 "Something went wrong. Please try again."}
//             </p>
//             <button
//               onClick={handleRetry}
//               className="flex items-center gap-2 bg-[#f7a221] hover:bg-[#e6941e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200 active:scale-95"
//             >
//               <RefreshCw size={15} />
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* ── Loading skeletons ── USING IMPORTED SkeletonCard ─────────────── */}
//         {isLoading && (
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
//             {[...Array(8)].map((_, i) => (
//               <SkeletonCard key={i} />
//             ))}
//           </div>
//         )}

//         {/* ── Products grid ── USING IMPORTED ProductCard ──────────────────── */}
//         {!isLoading && !hasError && products.length > 0 && (
//           <>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
//               {products.map((product, idx) => (
//                 <ProductCard
//                   key={product._id || product.slug || idx}
//                   product={product}
//                   index={idx}
//                 />
//               ))}
//             </div>
//             <Pagination pagination={pagination} onPageChange={handlePageChange} />
//           </>
//         )}

//         {/* ── Empty state ──────────────────────────────────────────────────── */}
//         {!isLoading && !hasError && products.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-20 gap-4">
//             <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl select-none">
//               📦
//             </div>
//             <p className="text-gray-500 text-base sm:text-lg font-medium text-center">
//               No products in this category yet.
//             </p>
//             <button
//               onClick={() => navigate("/")}
//               className="bg-[#f7a221] hover:bg-[#e6941e] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors duration-200 active:scale-95"
//             >
//               Browse All Products
//             </button>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default CatProducts;