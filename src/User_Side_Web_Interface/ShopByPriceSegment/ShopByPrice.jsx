import { useCallback, useMemo, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import usePaginatedFetch from "../../components/HOOKS/usePaginatedFetch";
import { fetchProducts, clearProducts  } from "../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice";
import LoadMoreButton from "../../components/Common/LoadMoreButton";
import { ArrowLeft, ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import ProductCard from "../Product_segment/ProductCard";

const ShopByPrice = () => {
  const { slug } = useParams();
  const slug1   = slug?.match(/\d+/)?.[0] ?? "0";
  const isAbove = slug?.includes("above");
  const dispatch = useDispatch();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [filters, setFilters] = useState({
    availability: [],
    discount:     [],
    onSale:       false,
  });
  // Note: price filter yahan nahi — already URL se price filter ho raha hai

  // ── Slug change pe clear ───────────────────────────────────────────────────
  useEffect(() => {
    dispatch(clearProducts());
  }, [slug, dispatch]);

  // ── Paginated fetch ────────────────────────────────────────────────────────
  const { data, isLoading, isFetchingMore, pagination, page, loadMore } = usePaginatedFetch({
    fetchAction:      fetchProducts,
    selectData:       (state) => state.userProducts.products,
    selectLoading:    (state) => state.userProducts.loading.products,
    selectPagination: (state) => state.userProducts.pagination,
    limit: 13,
  });

  // ── Toggle helper ─────────────────────────────────────────────────────────
  const toggleFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ availability: [], discount: [], onSale: false });
  }, []);

  // ── Price filter (URL based) ───────────────────────────────────────────────
  const priceFiltered = useMemo(() => {
    return data.filter((elem) =>
      elem.variants?.some((item) => {
        const price = item.price?.base;
        if (!price) return false;
        if (isAbove) return price >= +slug1;
        return price <= +slug1;
      })
    );
  }, [data, slug1, isAbove]);
  useEffect(() => {
  if (data?.length > 0) {
    console.log("price sample:", data[0]?.variants?.[0]?.price);
    console.log("soldInfo sample:", data[0]?.soldInfo);
  }
}, [data]);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return priceFiltered.filter((product) => {
      const variant   = product.variants?.[0];
      const base      = variant?.price?.base ?? 0;
      const sale      = variant?.price?.sale ?? base;
      const qty       = variant?.inventory?.quantity ?? 0;
      const discount  = base > 0 ? Math.round(((base - sale) / base) * 100) : 0;
      const isOnSale  = sale < base;

      if (filters.availability.length > 0) {
        const match = filters.availability.some((a) => {
          if (a === "instock")    return qty > 0;
          if (a === "outofstock") return qty <= 0;
          return false;
        });
        if (!match) return false;
      }

      if (filters.discount.length > 0) {
        const match = filters.discount.some((d) => discount >= Number(d));
        if (!match) return false;
      }

      if (filters.onSale && !isOnSale) return false;

      return true;
    });
  }, [priceFiltered, filters]);

  const sortedProducts = useMemo(() => {
    const data = [...filteredProducts];
    switch (sortBy) {
      case "priceLowHigh":
        return data.sort((a, b) => {
          const aP = a.variants?.[0]?.price?.sale ?? a.variants?.[0]?.price?.base ?? 0;
          const bP = b.variants?.[0]?.price?.sale ?? b.variants?.[0]?.price?.base ?? 0;
          return aP - bP;
        });
      case "priceHighLow":
        return data.sort((a, b) => {
          const aP = a.variants?.[0]?.price?.sale ?? a.variants?.[0]?.price?.base ?? 0;
          const bP = b.variants?.[0]?.price?.sale ?? b.variants?.[0]?.price?.base ?? 0;
          return bP - aP;
        });
      case "discount":
        return data.sort((a, b) => {
          const getDiscount = (p) => {
            const base = p.variants?.[0]?.price?.base ?? 0;
            const sale = p.variants?.[0]?.price?.sale ?? base;
            return base > 0 ? ((base - sale) / base) * 100 : 0;
          };
          return getDiscount(b) - getDiscount(a);
        });
      case "az":
        return data.sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return data.sort((a, b) => b.name.localeCompare(a.name));
      case "newest":
        return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return data;
    }
  }, [filteredProducts, sortBy]);

  const activeFilterCount = useMemo(() =>
    filters.availability.length +
    filters.discount.length +
    (filters.onSale ? 1 : 0),
  [filters]);

  const pageTitle = slug ? slug.replace(/-/g, " ") : "Explore our complete collection";

  // ── Filter Panel ───────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-7 font-['satoshi']">

      {/* Availability */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-800 mb-4">
          Availability
        </h4>
        <div className="space-y-1.5">
          {[
            { label: "In stock",     val: "instock"    },
            { label: "Out of stock", val: "outofstock" },
          ].map(({ label, val }) => (
            <label key={val} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                  ${filters.availability.includes(val)
                    ? "bg-zinc-900 border-zinc-900"
                    : "border-zinc-300 group-hover:border-zinc-500"
                  }`}
                onClick={() => toggleFilter("availability", val)}
              >
                {filters.availability.includes(val) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                className={`text-sm transition-colors ${filters.availability.includes(val) ? "text-zinc-900 font-medium" : "text-zinc-800"}`}
                onClick={() => toggleFilter("availability", val)}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Discount */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-800 mb-4">
          Discount
        </h4>
        <div className="space-y-1.5">
          {[
            { label: "10% or more", val: "10" },
            { label: "25% or more", val: "25" },
            { label: "50% or more", val: "50" },
          ].map(({ label, val }) => (
            <label key={val} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                  ${filters.discount.includes(val)
                    ? "bg-zinc-900 border-zinc-900"
                    : "border-zinc-300 group-hover:border-zinc-500"
                  }`}
                onClick={() => toggleFilter("discount", val)}
              >
                {filters.discount.includes(val) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                className={`text-sm transition-colors ${filters.discount.includes(val) ? "text-zinc-900 font-medium" : "text-zinc-800"}`}
                onClick={() => toggleFilter("discount", val)}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* On Sale */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-800 mb-4">
          Deals
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, onSale: !prev.onSale }))}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              filters.onSale ? "bg-zinc-900" : "bg-zinc-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                filters.onSale ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm ${filters.onSale ? "text-zinc-900 font-medium" : "text-zinc-800"}`}>
            On sale only
          </span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full min-h-screen bg-gray-50">

        {/* Breadcrumb */}
        <div className="w-full flex items-center justify-between pt-6 px-4">
          <nav className="flex items-center md:px-10 gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400 whitespace-nowrap">
            <Link to="/"><ArrowLeft size={16} /></Link>
            <Link to="/" className="hover:text-zinc-900">Home</Link>
            <ChevronDown size={12} />
            <span className="text-zinc-900 font-bold text-[10px] sm:text-xs">
              under {slug1}
            </span>
          </nav>
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 text-xs font-bold rounded-xl p-2 bg-white shadow-sm border"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="w-full h-48 bg-black mt-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#F7A221]/10" />
          <div className="text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
              Shop By Price
            </h1>
            <p className="text-white/60 text-sm mt-2 font-medium capitalize">{pageTitle}</p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} />
                  <span className="text-sm font-bold uppercase tracking-widest">Filters</span>
                </div>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Products Area */}
          <div className="flex-1">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold uppercase text-zinc-800 tracking-[0.1em]">
                  Sort By:
                </p>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white/60 backdrop-blur-md px-3 pr-10 py-2 text-sm font-semibold text-zinc-800 rounded-md shadow-sm border border-zinc-200 hover:border-zinc-400 focus:border-black focus:ring-0 outline-none transition-all cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="az">Alphabetically, A-Z</option>
                    <option value="za">Alphabetically, Z-A</option>
                    <option value="priceLowHigh">Price: Low to High</option>
                    <option value="priceHighLow">Price: High to Low</option>
                    <option value="discount">Highest Discount</option>
                    <option value="newest">Newest First</option>
                  </select>
                  <ChevronRight
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none rotate-90"
                  />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full border border-zinc-200">
                <span className="text-lg font-semibold text-zinc-800">{sortedProducts.length}</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-400">Products</span>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && page === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[4/5] bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-lg" />
                    <div className="h-3 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty after filter */}
            {!isLoading && sortedProducts.length === 0 && priceFiltered.length > 0 && (
              <div className="py-32 flex flex-col items-center text-center animate-in fade-in">
                <h2 className="text-xl font-semibold text-zinc-700 mb-2">No products match your filters</h2>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-6">Try different filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 text-xs font-semibold uppercase tracking-wider border border-zinc-300 rounded-full hover:bg-black hover:text-white transition"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Empty — no products */}
            {!isLoading && priceFiltered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">🛍️</p>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">No Products Found</h2>
                <p className="text-gray-400 text-sm mt-2">No products match this price range.</p>
              </div>
            )}

            {/* Product Grid */}
            {!isLoading && sortedProducts.length > 0 && (
              <div className="animate-in fade-in duration-700">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedProducts.map((elem, index) => (
                    <ProductCard
                      key={elem._id ?? elem.id ?? index}
                      product={elem}
                      index={index}
                    />
                  ))}
                </div>

                <div className="mt-20 text-center">
                  <LoadMoreButton
                    onLoadMore={loadMore}
                    isFetchingMore={isFetchingMore}
                    hasNextPage={pagination?.hasNextPage}
                  />
                  {pagination?.hasNextPage && (
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-4">
                      {data.length} / {pagination?.total || 0} viewed
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[200] lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold uppercase tracking-tighter">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setIsMobileFilterOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <FilterPanel />
              </div>
              <div className="px-6 py-4 border-t border-zinc-100">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-zinc-900 text-white py-4 text-xs font-black uppercase tracking-widest rounded-2xl"
                >
                  Show {sortedProducts.length} products
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ShopByPrice;