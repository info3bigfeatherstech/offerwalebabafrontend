import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, clearProducts } from '../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice';
import ProductCard from '../Product_segment/ProductCard';
import usePaginatedFetch from '../../components/HOOKS/usePaginatedFetch';
import LoadMoreButton from '../../components/Common/LoadMoreButton';
import Breadcrumb from '../Product_segment/Breadcrumb/Breadcrumb';

const ShopByPrice = () => {
  const { slug } = useParams();
  const slug1   = slug?.match(/\d+/)?.[0] ?? "0";
  const isAbove = slug?.includes("above");
  const dispatch = useDispatch();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ✅ Slug change hone pe store clear karo
  useEffect(() => {
    dispatch(clearProducts());
  }, [slug, dispatch]);

  // ✅ usePaginatedFetch hook
  const { data, isLoading, isFetchingMore, pagination, page, loadMore } = usePaginatedFetch({
    fetchAction:      fetchProducts,
    selectData:       (state) => state.userProducts.products,
    selectLoading:    (state) => state.userProducts.loading.products,
    selectPagination: (state) => state.userProducts.pagination,
    limit: 13,
  });

  // ✅ Client-side price filter
  const filteredData = data.filter((elem) =>
    elem.variants?.some((item) => {
      const price = item.price?.base;
      if (!price) return false;
      if (isAbove) return price >= +slug1;
      return price <= +slug1;
    })
  );

  return (
    <>
     <div className="w-full min-h-screen bg-gray-50">
     <div className="w-full flex items-center justify-between pt-6 px-4">

  {/* ✅ Breadcrumb */}
  <nav className="flex items-center md:px-10 gap-2 text-xs sm:text-xs font-medium uppercase tracking-widest text-zinc-400 whitespace-nowrap">
    
    <Link to="/" className="shrink-0">
      <ArrowLeft size={16} />
    </Link>

    <Link to="/" className="hover:text-zinc-900 shrink-0">
      Home
    </Link>

    <ChevronRight size={12} className="shrink-0" />

    <span className="text-zinc-900 font-bold text-[10px] sm:text-xs shrink-0">
      under {slug1}
    </span>
  </nav>

  {/* ✅ Mobile Filter Button */}
  <div className="md:hidden w-full">
    <button
      onClick={() => setIsMobileFilterOpen(true)}
      className="w-fit flex items-center gap-2 text-xs ml-28 font-bold rounded-xl p-2 bg-white shadow-sm border"
    >
      <SlidersHorizontal size={14} />
      Filters
    </button>
  </div>

</div>
      {/* Hero Banner */}
      <div className="w-full h-48 bg-black mt-18 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F7A221]/10" />
        <div className="text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Shop By Price
          </h1>
          <p className="text-white/60 text-sm mt-2 font-medium capitalize">
            {slug ? slug.replace(/-/g, ' ') : 'Explore our complete collection'}
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-gray-50 rounded-2xl p-6">
            <p className="text-xs font-bold uppercase px-3 py-2 mt-10 text-gray-400 tracking-widest">
              Filters
            </p>
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
        </aside>

        {/* Products Area */}
        <div className="flex-1">

          {/* Count Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">
              SHOWING{' '}
              <span className="font-bold text-black">{filteredData.length}</span>{' '}
              {filteredData.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
            </p>
          </div>

          {/* Initial Loading Skeleton */}
          {isLoading && page === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-3 bg-gray-200 animate-pulse rounded-full w-3/4" />
                    <div className="h-3 bg-gray-200 animate-pulse rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-5xl mb-4">🛍️</p>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
                No Products Found
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                No products match this price range.
              </p>
            </div>
          )}

          {/* Product Grid */}
          {filteredData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredData.map((elem, index) => (
                <ProductCard
                  key={elem._id ?? elem.id ?? index}
                  product={elem}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* ✅ Reusable Load More */}
          <LoadMoreButton
            onLoadMore={loadMore}
            isFetchingMore={isFetchingMore}
            hasNextPage={pagination?.hasNextPage}
          />

        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-black text-lg uppercase tracking-tight">Filters</span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400 text-center py-8">Filters coming soon</p>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full mt-4 bg-black text-white font-bold py-4 rounded-2xl hover:bg-[#F7A221] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div></>
  );
};

export default ShopByPrice;