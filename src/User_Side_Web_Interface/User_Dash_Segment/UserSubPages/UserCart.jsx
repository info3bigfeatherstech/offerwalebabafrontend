import React, { useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  updateGuestCartItem,
  removeGuestCartItem,
  clearCartErrors,
  selectCartItems,
  selectCartGuestItems,
  selectCartTotalAmount,
  selectCartLoading,
  selectCartError,
  selectDisplayCartCount,
} from '../../../components/REDUX_FEATURES/REDUX_SLICES/userCartSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};

const logError = (context, error, info = {}) => {
  console.group(`🔴 [UserCart] ERROR in ${context}`);
  console.error('Error:', error);
  console.log('Info:', info);
  console.groupEnd();
};

// ─────────────────────────────────────────────────────────────────────────────
// Extract display data from a cart item — matches actual API response shape
// item.productId is a fully populated object from GET /api/cart
// item.variantId matches item.productId.variants[]._id
// item.priceSnapshot = { base, sale } — per-item price snapshot
// ─────────────────────────────────────────────────────────────────────────────
const getItemDisplayData = (item) => {
  const isPopulated = typeof item.productId === 'object' && item.productId !== null;

  // Find matched variant by variantId
  const matchedVariant = isPopulated
    ? (item.productId.variants?.find(
        (v) => String(v._id) === String(item.variantId)
      ) ?? item.productId.variants?.[0] ?? null)
    : null;

  const name    = isPopulated
    ? (item.productId.title || item.productId.name)
    : (item.name || item.productSlug || 'Product');

  // Image from matched variant
  const image   =
    matchedVariant?.images?.[0]?.url ||
    item.productId?.variants?.[0]?.images?.[0]?.url ||
    item.image || null;

  // Price from priceSnapshot (backend attaches this per cart item)
  const price   =
    item.priceSnapshot?.sale ??
    item.priceSnapshot?.base ??
    matchedVariant?.finalPrice ??
    matchedVariant?.price?.sale ??
    matchedVariant?.price?.base ?? null;

  // Brand for display
  const brand   = item.productId?.brand || null;

  // Variant attributes e.g. [{ key: "Color", value: "Red" }]
  const attrs   = item.variantAttributesSnapshot ?? matchedVariant?.attributes ?? [];

  const slug    = item._productSlug || item.productId?.slug || null;

  return { name, image, price, brand, attrs, slug };
};

// ─────────────────────────────────────────────────────────────────────────────
// CartRow — single item row
// ─────────────────────────────────────────────────────────────────────────────
const CartRow = ({ item, isLoggedIn, onUpdate, onRemove, isUpdating, isRemoving }) => {
  const { name, image, price, brand, attrs, slug } = getItemDisplayData(item);
  const qty      = item.quantity || 1;
  const itemTotal = price != null ? price * qty : null;

  return (
    <div className="group bg-white border-2 border-gray-100 rounded-[32px] p-4 sm:p-6 hover:border-black transition-all duration-300">
      <div className="flex gap-4 sm:gap-6">

        {/* Image */}
        <div className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                logError('CartRow img', new Error('Image failed'), { name, image });
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={24} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              {/* Name — clickable if slug exists */}
              {slug ? (
                <Link to={`/products/${slug}`}>
                  <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight group-hover:text-[#F7A221] transition-colors truncate">
                    {name}
                  </h3>
                </Link>
              ) : (
                <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight truncate">
                  {name}
                </h3>
              )}

              {/* Brand + variant attrs */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {brand && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {brand}
                  </span>
                )}
                {attrs.map((a) => (
                  <span
                    key={a._id || a.key}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter"
                  >
                    · {a.key}: {a.value}
                  </span>
                ))}
              </div>

              {/* Unit price */}
              {price != null && (
                <p className="text-xs text-gray-400 mt-0.5">{fmt(price)} each</p>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(item)}
              disabled={isRemoving}
              aria-label="Remove item"
              className="p-2 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {isRemoving
                ? <RefreshCw size={18} className="animate-spin" />
                : <Trash2 size={18} />
              }
            </button>
          </div>

          {/* Qty + total */}
          <div className="flex justify-between items-end mt-4 flex-wrap gap-3">
            {/* Qty selector */}
            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
              <button
                onClick={() => onUpdate(item, qty - 1)}
                disabled={qty <= 1 || isUpdating}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 font-black text-sm min-w-[2rem] text-center">
                {isUpdating ? '…' : qty}
              </span>
              <button
                onClick={() => onUpdate(item, qty + 1)}
                disabled={isUpdating}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Item total */}
            {itemTotal != null && (
              <p className="font-black text-xl text-gray-900">{fmt(itemTotal)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UserCart — Main Page
// ─────────────────────────────────────────────────────────────────────────────
const UserCart = () => {
  const dispatch   = useDispatch();

  // ── Selectors ─────────────────────────────────────────────────────────────
  const items        = useSelector(selectCartItems);
  const guestItems   = useSelector(selectCartGuestItems);
  const totalAmount  = useSelector(selectCartTotalAmount);
  const totalCount   = useSelector(selectDisplayCartCount);
  const loading      = useSelector(selectCartLoading);
  const error        = useSelector(selectCartError);
  const { isLoggedIn } = useSelector((state) => state.auth);

  const currentItems = isLoggedIn ? items : guestItems;

  // ── Fetch on mount (logged in) ─────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart())
        .unwrap()
        .then(() => console.log('✅ [UserCart] cart loaded'))
        .catch((e) => logError('fetchCart', e));
    }
    return () => dispatch(clearCartErrors());
  }, [isLoggedIn, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdate = (item, newQty) => {
    if (newQty < 1) {
      handleRemove(item);
      return;
    }
    if (isLoggedIn) {
      dispatch(updateCartItem({
        productId:   item.productId?._id || item.productId,
        variantId:   item.variantId,
        quantity:    newQty,
        productSlug: item._productSlug,
      }))
        .unwrap()
        .catch((e) => logError('updateCartItem', e, { newQty }));
    } else {
      dispatch(updateGuestCartItem({
        productSlug: item.productSlug,
        variantId:   item.variantId,
        quantity:    newQty,
      }));
    }
  };

  const handleRemove = (item) => {
    if (isLoggedIn) {
      dispatch(removeCartItem({
        productId:   item.productId?._id || item.productId,
        variantId:   item.variantId,
        productSlug: item._productSlug,
      }))
        .unwrap()
        .catch((e) => logError('removeCartItem', e));
    } else {
      dispatch(removeGuestCartItem({
        productSlug: item.productSlug,
        variantId:   item.variantId,
      }));
    }
  };

  const isFetching = loading.fetch;
  const isUpdating = loading.update;
  const isRemoving = loading.remove;

  // ── Subtotal — for guest cart, compute from items ─────────────────────────
  const subtotal = isLoggedIn
    ? totalAmount
    : guestItems.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity || 1), 0);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isFetching && currentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <RefreshCw size={28} className="text-gray-300 animate-spin" />
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Loading your cart…
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error.fetch && currentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <AlertCircle size={32} className="text-red-300" />
        <p className="text-gray-500 text-sm font-medium max-w-sm">
          {error.fetch.message || 'Failed to load cart'}
        </p>
        <button
          onClick={() => dispatch(fetchCart())}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-[#F7A221] text-white px-6 py-3 rounded-xl hover:bg-black transition-colors active:scale-95"
        >
          <RefreshCw size={13} /> Try Again
        </button>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (currentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
          <ShoppingBag size={36} className="text-gray-200" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">
            Your cart is empty
          </h2>
          <p className="text-gray-400 text-sm font-medium">
            Add something you love to get started
          </p>
        </div>
        <Link
          to="/"
          className="bg-black text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl hover:bg-[#F7A221] transition-all active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header */}
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">
          {totalCount} item{totalCount !== 1 ? 's' : ''} ready for checkout
        </p>
      </header>

      {/* Update/remove error banner */}
      {(error.update || error.remove) && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-700 flex-1">
            {error.update?.message || error.remove?.message || 'Something went wrong'}
          </p>
          <button
            onClick={() => dispatch(clearCartErrors())}
            className="text-red-300 hover:text-red-500 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

        {/* ── Items list ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {currentItems.map((item, index) => (
            <CartRow
              key={item._id || `${item.productSlug || item._productSlug}-${item.variantId}-${index}`}
              item={item}
              isLoggedIn={isLoggedIn}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              isUpdating={isUpdating}
              isRemoving={isRemoving}
            />
          ))}
        </div>

        {/* ── Order summary ──────────────────────────────────────────────── */}
        <div className="xl:col-span-1">
          <div className="bg-gray-900 text-white rounded-[40px] p-8 sticky top-24 shadow-2xl">
            <h3 className="text-xl font-black mb-6 border-b border-white/10 pb-4">
              Order Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-gray-400 font-bold text-sm">
                <span>Subtotal ({totalCount} items)</span>
                <span className="text-white">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold text-sm">
                <span>Shipping</span>
                <span className="text-green-400 uppercase text-xs font-black">
                  {subtotal >= 499 ? 'Free' : fmt(49)}
                </span>
              </div>

              <div className="pt-6 mt-2 border-t border-white/10">
                <div className="flex justify-between items-end">
                  <span className="font-black text-gray-400 uppercase text-xs tracking-widest">
                    Total
                  </span>
                  <span className="text-3xl font-black text-[#F7A221]">
                    {fmt(subtotal >= 499 ? subtotal : subtotal + 49)}
                  </span>
                </div>
                {subtotal > 0 && subtotal < 499 && (
                  <p className="text-[10px] text-gray-500 mt-1 text-right">
                    Add {fmt(499 - subtotal)} more for free shipping
                  </p>
                )}
              </div>

              <Link
                to="/checkout"
                className="w-full mt-8 bg-[#F7A221] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95 shadow-xl shadow-orange-900/20"
              >
                Checkout Now <ArrowRight size={20} />
              </Link>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-green-500" />
                Secure 256-bit SSL Payment
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserCart;

// import React from 'react';
// import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
// import { useSelector, useDispatch } from 'react-redux';
// // Import your cart actions (e.g., removeFromCart, updateQuantity)
// // import { removeFromCart, updateQuantity } from '../REDUX_FEATURES/REDUX_SLICES/cartSlice';

// const UserCart = () => {
//   const dispatch = useDispatch();
//   // Assuming your cart state looks like this:
//   const { cartItems, cartTotal } = useSelector((state) => state.cart || { cartItems: [], cartTotal: 0 });

//   // Mock data if Redux is empty for preview
//   const items = cartItems.length > 0 ? cartItems : [
//     { _id: '1', name: 'Premium Oversized Tee', price: 1299, quantity: 1, image: '', size: 'L', color: 'Jet Black' },
//   ];

//   const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

//   return (
//     <div className="space-y-8 animate-fadeIn">
//       <header>
//         <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
//         <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">
//           {items.length} Items ready for checkout
//         </p>
//       </header>

//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
//         {/* --- ITEMS LIST (Left 2 Columns) --- */}
//         <div className="xl:col-span-2 space-y-4">
//           {items.map((item) => (
//             <div key={item._id} className="group bg-white border-2 border-gray-100 rounded-[32px] p-4 sm:p-6 hover:border-black transition-all duration-300">
//               <div className="flex gap-6">
//                 {/* Product Image */}
//                 <div className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
//                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">Product Image</div>
//                 </div>

//                 {/* Details */}
//                 <div className="flex-1 flex flex-col justify-between py-1">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h3 className="font-black text-lg text-gray-900 leading-tight group-hover:text-[#F7A221] transition-colors">
//                         {item.name}
//                       </h3>
//                       <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-tighter">
//                         Size: {item.size} • Color: {item.color}
//                       </p>
//                     </div>
//                     <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
//                       <Trash2 size={20} />
//                     </button>
//                   </div>

//                   <div className="flex justify-between items-end mt-4">
//                     {/* Quantity Selector */}
//                     <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
//                       <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Minus size={14} /></button>
//                       <span className="px-4 font-black text-sm">{item.quantity}</span>
//                       <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Plus size={14} /></button>
//                     </div>
                    
//                     <p className="font-black text-xl text-gray-900">{formatPrice(item.price * item.quantity)}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* --- SUMMARY PANEL (Right Column) --- */}
//         <div className="xl:col-span-1">
//           <div className="bg-gray-900 text-white rounded-[40px] p-8 sticky top-24 shadow-2xl">
//             <h3 className="text-xl font-black mb-6 border-b border-white/10 pb-4">Order Summary</h3>
            
//             <div className="space-y-4">
//               <div className="flex justify-between text-gray-400 font-bold text-sm">
//                 <span>Subtotal</span>
//                 <span className="text-white">{formatPrice(2598)}</span>
//               </div>
//               <div className="flex justify-between text-gray-400 font-bold text-sm">
//                 <span>Shipping</span>
//                 <span className="text-green-400 uppercase text-xs">Free</span>
//               </div>
//               <div className="flex justify-between text-gray-400 font-bold text-sm">
//                 <span>GST (18%)</span>
//                 <span className="text-white">{formatPrice(467)}</span>
//               </div>
              
//               <div className="pt-6 mt-6 border-t border-white/10">
//                 <div className="flex justify-between items-end">
//                   <span className="font-black text-gray-400 uppercase text-xs tracking-widest">Total Amount</span>
//                   <span className="text-3xl font-black text-[#F7A221]">{formatPrice(3065)}</span>
//                 </div>
//               </div>

//               <button className="w-full mt-8 bg-[#F7A221] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95 shadow-xl shadow-orange-900/20">
//                 Checkout Now <ArrowRight size={20} />
//               </button>

//               <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
//                 <ShieldCheck size={14} className="text-green-500" />
//                 Secure 256-bit SSL Payment
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default UserCart;