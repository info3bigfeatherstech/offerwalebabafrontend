import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';
import {
  fetchProductsByCategory,
  selectProductsBySlug,
  selectLoadingBySlug,
  selectErrorBySlug,
  selectPaginationBySlug,
} from '../REDUX_FEATURES/REDUX_SLICES/userProductsSlice';
import ProductCard from '../../User_Side_Web_Interface/Product_segment/ProductCard';
import SkeletonCard from '../../User_Side_Web_Interface/Product_segment/Product_Card_Skelleton/SkeletonCard';

// ── outside component — stable reference
const WAVE_PATHS = [
  "M0,60 C300,120 600,0 900,60 L1200,60 L1200,120 L0,120 Z",
  "M0,60 C400,0 800,120 1200,60 L1200,120 L0,120 Z",
  "M0,60 C300,120 600,0 900,60 L1200,60 L1200,120 L0,120 Z",
];

const CategorySection = ({ slug, title }) => {
  const dispatch = useDispatch();
  const [pathIndex, setPathIndex] = useState(0);

  // ── Memoize selector instances so the same function reference is reused
  // across renders for the same slug. Without this, each render creates a
  // brand-new selector function → react-redux detects a changed selector →
  // warns about "different result with same parameters".
  const selectProducts   = useMemo(() => selectProductsBySlug(slug),   [slug]);
  const selectLoading    = useMemo(() => selectLoadingBySlug(slug),    [slug]);
  const selectError      = useMemo(() => selectErrorBySlug(slug),      [slug]);
  const selectPagination = useMemo(() => selectPaginationBySlug(slug), [slug]);

  const products   = useSelector(selectProducts);
  const loading    = useSelector(selectLoading);
  const error      = useSelector(selectError);
  const pagination = useSelector(selectPagination);

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(fetchProductsByCategory({ slug, page: 1, limit: 10 }));
    }
  }, [slug, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPathIndex((prev) => (prev + 1) % WAVE_PATHS.length);
    }, 3333);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    dispatch(fetchProductsByCategory({ slug, page: 1, limit: 10 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchProductsByCategory({ slug, page: newPage, limit: 10 }));
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full bg-white py-8 md:py-16 overflow-hidden">
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12">
            <div className="h-8 md:h-10 w-56 bg-gray-100 animate-pulse rounded" />
            <div className="h-5 w-24 bg-gray-100 animate-pulse rounded mt-4 sm:mt-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    console.error(`❌ [CategorySection] slug="${slug}" error:`, error.message);
    return (
      <div className="w-full bg-white py-8 md:py-16 text-center">
        <p className="text-red-500 mb-2 font-medium">Failed to load {title}</p>
        <p className="text-gray-400 text-sm mb-4">{error.message}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-2 bg-[#f7a221] text-white rounded-lg hover:bg-[#e09110] transition-colors"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white py-8 md:py-16 overflow-hidden">
      <section className="container mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12">
          <h3 className="text-xl sm:text-2xl md:text-4xl font-lato flex items-center gap-2 md:gap-4 text-gray-900 mb-4 sm:mb-0">
            <span className="w-2 h-8 md:w-3 md:h-12 bg-[#f7a221] rounded-full" />
            {title}
          </h3>
          <button className="text-[#f7a221] font-bold flex items-center gap-2 group text-sm uppercase tracking-wider transition-all whitespace-nowrap">
            Explore All
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-zinc-100 bg-gradient-to-b from-zinc-50 to-white py-24 px-6 text-center shadow-sm">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-50/50 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-zinc-100/50 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="group relative mb-8 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-zinc-100 opacity-20 duration-[3000ms]" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl transition-transform duration-500 group-hover:scale-110">
                  <span className="text-4xl grayscale transition-all duration-500 group-hover:grayscale-0">
                    🔍
                  </span>
                </div>
              </div>

              <h3 className="mb-2 text-xl font-black uppercase tracking-tighter text-zinc-900 md:text-2xl">
                The Vault is Quiet
              </h3>
              <p className="mx-auto max-w-xs text-sm font-medium leading-relaxed text-zinc-400">
                We couldn't find any items matching this selection.
                Perhaps a different path?
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="group flex items-center gap-3 bg-zinc-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-yellow-600 active:scale-95"
                >
                  Explore All Collections
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="border-b-2 border-zinc-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 transition-all hover:border-zinc-900"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="mt-16 border-t border-zinc-50 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                Need help finding something specific?
                <a href="/contact" className="ml-2 text-zinc-900 underline underline-offset-4">Talk to us</a>
              </p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-10">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pagination.hasPrevPage
                  ? 'bg-[#f7a221] text-white hover:bg-[#e09110]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pagination.hasNextPage
                  ? 'bg-[#f7a221] text-white hover:bg-[#e09110]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Wave Divider */}
      <div className="relative h-16 md:h-20 overflow-hidden mt-10">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full text-gray-50"
        >
          <path
            d={WAVE_PATHS[pathIndex]}
            fill="currentColor"
            style={{ transition: 'd 3333ms ease-in-out' }}
          />
        </svg>
      </div>
    </div>
  );
};

export default CategorySection;
// loading dots down side code upper have skelleton 
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { ArrowRight, RefreshCw } from 'lucide-react';
// import {
//   fetchProductsByCategory,
//   selectProductsBySlug,
//   selectLoadingBySlug,
//   selectErrorBySlug,
//   selectPaginationBySlug,
// } from '../REDUX_FEATURES/REDUX_SLICES/userProductsSlice';
// import ProductCard from '../../pages/Product_segment/ProductCard';

// // ── outside component — stable reference, no re-creation on render
// const WAVE_PATHS = [
//   "M0,60 C300,120 600,0 900,60 L1200,60 L1200,120 L0,120 Z",
//   "M0,60 C400,0 800,120 1200,60 L1200,120 L0,120 Z",
//   "M0,60 C300,120 600,0 900,60 L1200,60 L1200,120 L0,120 Z",
// ];

// const CategorySection = ({ slug, title }) => {
//   const dispatch = useDispatch();
//   const [pathIndex, setPathIndex] = useState(0);

//   // ✅ each instance reads its own slug's data — zero conflict
//   const products   = useSelector(selectProductsBySlug(slug));
//   const loading    = useSelector(selectLoadingBySlug(slug));
//   const error      = useSelector(selectErrorBySlug(slug));
//   const pagination = useSelector(selectPaginationBySlug(slug));

//   // fetch on mount, skip if already cached
//   useEffect(() => {
//     if (!products || products.length === 0) {
//       console.log(`🚀 [CategorySection] Fetching slug="${slug}"`);
//       dispatch(fetchProductsByCategory({ slug, page: 1, limit: 10 }));
//     }
//   }, [slug, dispatch]);

//   // wave animation
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setPathIndex((prev) => (prev + 1) % WAVE_PATHS.length);
//     }, 3333);
//     return () => clearInterval(interval);
//   }, []);

//   const handleRetry = () => {
//     console.log(`🔄 [CategorySection] Retrying slug="${slug}"`);
//     dispatch(fetchProductsByCategory({ slug, page: 1, limit: 10 }));
//   };

//   const handlePageChange = (newPage) => {
//     console.log(`📄 [CategorySection] slug="${slug}" → page=${newPage}`);
//     dispatch(fetchProductsByCategory({ slug, page: newPage, limit: 10 }));
//   };

//   // ── Loading ───────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="w-full bg-white py-8 md:py-16 text-center">
//         <div className="flex justify-center items-center space-x-2">
//           <div className="w-4 h-4 bg-[#f7a221] rounded-full animate-bounce" />
//           <div className="w-4 h-4 bg-[#f7a221] rounded-full animate-bounce delay-100" />
//           <div className="w-4 h-4 bg-[#f7a221] rounded-full animate-bounce delay-200" />
//         </div>
//         <p className="mt-4 text-gray-500 text-sm">Loading {title}...</p>
//       </div>
//     );
//   }

//   // ── Error ─────────────────────────────────────────────────────────────────
//   if (error) {
//     console.error(`❌ [CategorySection] slug="${slug}" error:`, error.message);
//     return (
//       <div className="w-full bg-white py-8 md:py-16 text-center">
//         <p className="text-red-500 mb-2 font-medium">Failed to load {title}</p>
//         <p className="text-gray-400 text-sm mb-4">{error.message}</p>
//         <button
//           onClick={handleRetry}
//           className="inline-flex items-center gap-2 px-6 py-2 bg-[#f7a221] text-white rounded-lg hover:bg-[#e09110] transition-colors"
//         >
//           <RefreshCw size={16} /> Try Again
//         </button>
//       </div>
//     );
//   }

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="w-full bg-white py-8 md:py-16 overflow-hidden">
//       <section className="container mx-auto px-4">

//         {/* Header */}
//         <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12">
//           <h3 className="text-xl sm:text-2xl md:text-4xl font-lato flex items-center gap-2 md:gap-4 text-gray-900 mb-4 sm:mb-0">
//             <span className="w-2 h-8 md:w-3 md:h-12 bg-[#f7a221] rounded-full" />
//             {title}
//           </h3>
//           <button className="text-[#f7a221] font-bold flex items-center gap-2 group text-sm uppercase tracking-wider transition-all whitespace-nowrap">
//             Explore All
//             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
//           </button>
//         </div>

//         {/* Products Grid */}
//         {products.length > 0 ? (
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
//             {products.map((product, index) => (
//               <ProductCard key={product._id} product={product} index={index} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-16 bg-gray-50 rounded-2xl">
//             <p className="text-gray-500">No products found in this category</p>
//           </div>
//         )}

//         {/* Pagination */}
//         {pagination?.totalPages > 1 && (
//           <div className="flex justify-center items-center space-x-4 mt-10">
//             <button
//               onClick={() => handlePageChange(pagination.page - 1)}
//               disabled={!pagination.hasPrevPage}
//               className={`px-4 py-2 rounded-lg transition-colors ${
//                 pagination.hasPrevPage
//                   ? 'bg-[#f7a221] text-white hover:bg-[#e09110]'
//                   : 'bg-gray-200 text-gray-400 cursor-not-allowed'
//               }`}
//             >
//               Previous
//             </button>
//             <span className="text-gray-600 text-sm">
//               Page {pagination.page} of {pagination.totalPages}
//             </span>
//             <button
//               onClick={() => handlePageChange(pagination.page + 1)}
//               disabled={!pagination.hasNextPage}
//               className={`px-4 py-2 rounded-lg transition-colors ${
//                 pagination.hasNextPage
//                   ? 'bg-[#f7a221] text-white hover:bg-[#e09110]'
//                   : 'bg-gray-200 text-gray-400 cursor-not-allowed'
//               }`}
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </section>

//       {/* Wave Divider */}
//       <div className="relative h-16 md:h-20 overflow-hidden mt-10">
//         <svg
//           viewBox="0 0 1200 120"
//           preserveAspectRatio="none"
//           className="absolute bottom-0 w-full h-full text-gray-50"
//         >
//           <path
//             d={WAVE_PATHS[pathIndex]}
//             fill="currentColor"
//             style={{ transition: 'd 3333ms ease-in-out' }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default CategorySection;