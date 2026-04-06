import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice';
import ProductCard from '../Product_segment/ProductCard';

const ShopByPrice = () => {
  const { slug } = useParams();
  console.log(slug);
  
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const dispatch = useDispatch();
  const priceRanges = [
    "Under ₹500",
    "₹500 - ₹1000",
    "₹1000 - ₹5000",
    "Over ₹5000"
  ];

  const togglePriceRange = (range) => {
    setSelectedPriceRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
  };

  const activeFilterCount = selectedPriceRanges.length;

  const FilterSidebar = () => (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          <span className="text-sm font-bold uppercase tracking-widest">Filters</span>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
          >
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-[11px] font-black uppercase tracking-widest mb-4">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range}
              className="flex items-center gap-3 text-sm text-zinc-600 cursor-pointer hover:text-zinc-900"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-zinc-900"
                checked={selectedPriceRanges.includes(range)}
                onChange={() => togglePriceRange(range)}
              />
              {range}
            </label>
          ))}
        </div>
      </div>

    </div>
  );

  let data = useSelector((state) => state.userProducts.products);
  console.log("Product fetched now", data);
  
  useEffect( () => {
    dispatch(fetchProducts({ page: 1, limit: 36 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [])

  return (
    <div className="w-full min-h-screen bg-gray-50">
        <div className='w-full h-48 bg-black mt-18 flex items-center justify-center relative overflow-hidden'>
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

         {/* Mobile Filter Button */}
      <div className="md:hidden sticky top-16 z-40 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 text-sm font-bold border border-gray-200 rounded-xl px-4 py-2"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-gray-50 rounded-2xl p-6">
            <FilterSidebar />
          </div>
        </aside>

        {/* Products Area */}
        <div className="flex-1">

          {/* Sort + Count — desktop */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">
              SHOWING <span className="font-bold text-black">5</span> PRODUCT
            </p>
          
         
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedPriceRanges.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full"
                >
                  {tag}
                  <X
                    size={11}
                    className="cursor-pointer hover:text-[#F7A221]"
                    onClick={() => togglePriceRange(tag)}
                  />
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ProductCard data={data} />
          </div>

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
            <FilterSidebar />
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full mt-8 bg-black text-white font-bold py-4 rounded-2xl hover:bg-[#F7A221] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopByPrice;