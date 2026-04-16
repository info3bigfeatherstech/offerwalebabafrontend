import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, RefreshCw, AlertCircle, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  selectCartTotalItems,
  selectCartLoading,
  selectCartError,
  selectDisplayCartCount,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userCartSlice";
import { current } from '@reduxjs/toolkit';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const logError = (context, error, info = {}) => {
  console.group(`🔴 [CartSidebar] ERROR in ${context}`);
  console.error("Error:", error);
  console.log("Info:", info);
  console.groupEnd();
};

// ─────────────────────────────────────────────────────────────────────────────
// GuestCartItem — minimal display for guest (only has productSlug, no product data)
// Same pattern as wishlist's GuestItem
// ─────────────────────────────────────────────────────────────────────────────
const GuestCartItem = ({ item, onRemove, onUpdateQty, isUpdating, isRemoving }) => {
  // Guest cart item structure: { productSlug, variantId, quantity, price? }
  const productSlug = item.productSlug || item._productSlug;
  const qty = item.quantity || 1;
  
  // Format product name from slug (replace hyphens with spaces)
  const displayName = productSlug?.replace(/-/g, ' ') || 'Product';
  const price = item.price || null;
  const itemTotal = price != null ? price * qty : null;

  return (
    <div className="flex gap-4 group py-2">
      {/* Image placeholder */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
        <ShoppingBag size={24} className="text-gray-300" />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between py-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 uppercase tracking-tight flex-1">
              {displayName}
            </h3>
            {itemTotal != null && (
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
                {fmt(itemTotal)}
              </p>
            )}
          </div>
          
          {/* Sign in message - same as wishlist */}
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Sign in to see full details
          </p>
          
          {price != null && (
            <p className="mt-0.5 text-xs text-gray-400">
              {fmt(price)} × {qty}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Qty controls - still functional for guest */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQty(item, qty - 1)}
              disabled={qty <= 1 || isUpdating}
              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 text-xs font-bold min-w-[2rem] text-center">
              {isUpdating ? "…" : qty}
            </span>
            <button
              onClick={() => onUpdateQty(item, qty + 1)}
              disabled={isUpdating}
              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Remove button - still functional for guest */}
          <button
            onClick={() => onRemove(item)}
            disabled={isRemoving}
            className="text-gray-300 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
            aria-label="Remove item"
          >
            {isRemoving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CartItem — extracts data correctly from both logged-in and guest item shapes
// (This remains for logged-in users)
// ─────────────────────────────────────────────────────────────────────────────
const CartItem = ({ item, isLoggedIn, onUpdateQty, onRemove, isUpdating, isRemoving }) => {

  const isPopulated = typeof item.productId === "object" && item.productId !== null;

  // ── Find the specific variant that was added ──────────────────────────────
  // API: item.variantId matches item.productId.variants[]._id
  const matchedVariant = isPopulated
    ? (item.product.variants?.find(
        (v) => String(v._id) === String(item.variantId)
      ) ?? item.product.variants?.[0] ?? null)
    : null;

  // Name — title first ("Studio Light - Red Edition"), fallback to name
  const name = isPopulated
    ? (item.product.name || item.productId.name)
    : (item.name || item.product.slug || "Product");

  // Image — from the MATCHED variant images[], not product-level
  // API: item.productId.variants[matched].images[0].url
  const image =
    matchedVariant?.images?.[0]?.url ||
    item.product?.variants?.[0]?.images?.[0]?.url ||
    item.image ||
    null;

  // Price — from priceSnapshot (backend attaches this per cart item)
  // priceSnapshot = { base, sale }
  const price =
    item.price?.sale ??
    item.price?.base ??
    matchedVariant?.finalPrice ??
    matchedVariant?.price?.sale ??
    matchedVariant?.price?.base ??
    null;

  // Variant attributes for display (Color: Red etc)
  const variantAttrs = item.variantAttributesSnapshot ?? matchedVariant?.attributes ?? [];

  // Category — API returns category as plain string ID (not populated)
  // Use brand as display label instead
  const category = item.product?.brand || null;

  const qty = item.quantity || 1;
  const itemTotal = price != null ? price * qty : null;

  return (
    <div className="flex gap-4 group py-2 cursor-pointer">
      {/* Image */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.style.display = "none";
              logError("CartItem img", new Error("Image load failed"), { name, image });
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <ShoppingBag size={24} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 cursor-pointer flex-col justify-between py-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 uppercase tracking-tight flex-1">
              {name}
            </h3>
            {itemTotal != null && (
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
                {fmt(itemTotal)}
              </p>
            )}
          </div>
          {/* Brand + variant attributes (Color: Red etc) */}
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {category && (
              <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">
                {category}
              </span>
            )}
            {variantAttrs.map((a) => (
              <span key={a._id || a.key} className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">
                · {a.key}: {a.value}
              </span>
            ))}
          </div>
          {price != null && (
            <p className="mt-0.5 text-xs text-gray-400">
              {fmt(price)} × {qty}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Qty controls */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQty(item, qty - 1)}
              disabled={qty <= 1 || isUpdating}
              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 text-xs font-bold min-w-[2rem] text-center">
              {isUpdating ? "…" : qty}
            </span>
            <button
              onClick={() => onUpdateQty(item, qty + 1)}
              disabled={isUpdating}
              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(item)}
            disabled={isRemoving}
            className=" text-red-400 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
            aria-label="Remove item"
          >
            {isRemoving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CartSidebar
// ─────────────────────────────────────────────────────────────────────────────
const CartSidebar = ({ isOpen, onClose, onOpenAuth, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ── Selectors ─────────────────────────────────────────────────────────────
  const items       = useSelector(selectCartItems);
  console.log("items", items);
  
  const guestItems  = useSelector(selectCartGuestItems);
  const totalAmount = useSelector(selectCartTotalAmount);
  const totalItems  = useSelector(selectDisplayCartCount);
  const loading     = useSelector(selectCartLoading);
  const error       = useSelector(selectCartError);
  const { isLoggedIn } = useSelector((state) => state.auth);

  // Per-item loading state for guest items
  const [itemLoading, setItemLoading] = useState({});

  const setItemState = (itemId, key, val) =>
    setItemLoading((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [key]: val },
    }));

  // ── Which items to show ────────────────────────────────────────────────────
  const currentItems = isLoggedIn ? items : guestItems;  

  // ── Computed subtotal for guest cart (slice doesn't compute it) ────────────
  const subtotal = useMemo(() => {
    if (isLoggedIn) return totalAmount;
    // Guest items may have price attached when you call addGuestCartItem
    return guestItems.reduce((sum, item) => {
      const price = item.price ?? 0;
      return sum + price * (item.quantity || 1);
    }, 0);
  }, [isLoggedIn, totalAmount, guestItems]);

  // ── Fetch cart when sidebar opens (logged in only) ─────────────────────────
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      console.log("🛒 [CartSidebar] opened — refreshing cart from DB");
      dispatch(fetchCart())
        .unwrap()
        .then(() => console.log("✅ [CartSidebar] cart refreshed"))
        .catch((e) => logError("fetchCart on open", e));
    }
  }, [isOpen, isLoggedIn, dispatch]);

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // ── Clear errors when closing ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) dispatch(clearCartErrors());
  }, [isOpen, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateQty = async (item, newQty) => {
  if (newQty < 1) return;
  const itemId = item._id || `${item.productId?.slug || item._productSlug}-${item.variantId}`;

  if (isLoggedIn) {
    setItemState(itemId, 'updating', true);
    try {
      await dispatch(updateCartItem({
        productId:   item.productId?._id || item.productId,  // ✅
        variantId:   item.variantId,
        quantity:    newQty,
        productSlug: item.product?.slug || item._productSlug, // ✅
      })).unwrap();
    } catch (e) {
      logError("updateCartItem", e, { newQty });
    } finally {
      setItemState(itemId, 'updating', false);
    }
  } else {
    setItemState(itemId, 'updating', true);
    dispatch(updateGuestCartItem({
      productSlug: item.productId?.slug || item.productSlug, // ✅
      variantId:   item.variantId,
      quantity:    newQty,
    }));
    setTimeout(() => setItemState(itemId, 'updating', false), 100);
  }
};

const handleRemove = async (item) => {
  const itemId = item._id || `${item.productId?.slug || item._productSlug}-${item.variantId}`;

  if (isLoggedIn) {
    setItemState(itemId, 'removing', true);
    try {
      await dispatch(removeCartItem({
        productId:   item.productId?._id || item.productId,  // ✅
        variantId:   item.variantId,
        productSlug: item.productId?.slug || item._productSlug, // ✅
      })).unwrap();
    } catch (e) {
      logError("removeCartItem", e);
    } finally {
      setItemState(itemId, 'removing', false);
    }
  } else {
    setItemState(itemId, 'removing', true);
    dispatch(removeGuestCartItem({
      productSlug: item.productId?.slug || item.productSlug, // ✅
      variantId:   item.variantId,
    }));
    setTimeout(() => setItemState(itemId, 'removing', false), 100);
  }
};

  const isFetching  = loading.fetch;
  const fetchFailed = error.fetch;

  // Get loading state for an item
  const getItemLoading = (item) => {
    const itemId = item._id || `${item._productSlug}-${item.variantId}`;
    return itemLoading[itemId] || { updating: false, removing: false };
  };

  const handleCart = () => {
    if(!isLoggedIn) {
      onOpenAuth();
    } else {
      navigate('/account/usercart');
    }
    onClose();
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[101] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} className="text-[#F7A221]" />
            <h2 className="text-lg font-black uppercase tracking-tighter">
              Your Cart
              <span className="ml-2 text-sm font-bold text-gray-400">
                ({totalItems})
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 hover:bg-gray-100 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Error banner ── */}
        {(fetchFailed || error.update || error.remove) && (
          <div className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-700">
                {fetchFailed?.message || error.update?.message || error.remove?.message || "Something went wrong"}
              </p>
            </div>
            <button
              onClick={() => dispatch(clearCartErrors())}
              className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Loading state */}
          {isFetching && currentItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-gray-300 animate-spin" />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                Loading your cart…
              </p>
            </div>

          /* Fetch failed + empty */
          ) : fetchFailed && currentItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle size={32} className="text-red-300" />
              <p className="text-sm text-gray-500 font-medium">
                {fetchFailed.message || "Failed to load cart"}
              </p>
              <button
                onClick={() => dispatch(fetchCart())}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#F7A221] text-white px-5 py-2.5 rounded-xl hover:bg-[#e6941e] transition-colors active:scale-95"
              >
                <RefreshCw size={13} /> Try Again
              </button>
            </div>

          /* Items list */
          ) : currentItems.length > 0 ? (
            <div className="divide-y divide-gray-50 scrollbar-hide">
              {currentItems.map((item, index) => {
                const loadingState = getItemLoading(item);
                const itemKey = item._id || `${item.productId.slug || item._productSlug}-${item.variantId}-${index}`;
                const path = `/products/${item?.productId?.slug}`
                
                // For guest users, use the simplified GuestCartItem component
                if (!isLoggedIn) {
                  return (
                    <div key={itemKey} className="py-2">
                      <GuestCartItem
                        item={item}
                        onUpdateQty={handleUpdateQty}
                        onRemove={handleRemove}
                        isUpdating={loadingState.updating}
                        isRemoving={loadingState.removing}
                      />
                    </div>
                  );
                }
                
                // For logged-in users, use the full CartItem component
                return (
                  <Link key={itemKey} onClick={onClose} to={path} className="py-2">
                    <CartItem
                      item={item}
                      isLoggedIn={isLoggedIn}
                      onUpdateQty={handleUpdateQty}
                      onRemove={handleRemove}
                      isUpdating={loadingState.updating}
                      isRemoving={loadingState.removing}
                    />
                  </Link>
                );
              })}

              {/* Guest sign-in nudge - same as wishlist */}
              {!isLoggedIn && (
                <div className="my-6 p-5 bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                  <div className="flex items-start gap-3">
                    <Star size={16} className="text-[#F7A221] mt-1 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-gray-900">
                        Sign in to sync
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
                        Don't lose your cart items. Log in to sync across all your devices.
                      </p>
                      <button
                        onClick={() => {onOpenAuth(); onClose(); }}
                        className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#F7A221] hover:underline cursor-pointer"
                      >
                        Login Now →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          /* Empty state */
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-200" />
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
                  Your cart is empty
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Add something you love
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#F7A221] font-black text-xs uppercase underline underline-offset-4 hover:text-[#e6941e] transition-colors"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {currentItems.length > 0 && (
          <div className="border-t px-6 py-5 bg-gray-50/50 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-black uppercase tracking-tighter text-gray-700">
                Subtotal
              </span>
              <span className="text-base font-black text-gray-900">
                {subtotal > 0 ? fmt(subtotal) : "—"}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              Shipping and taxes calculated at checkout
            </p>

            {/* CTA buttons */}
            <div className="space-y-2 pt-1">
              <Link
                to="/checkout"
                onClick={onClose}
                className="w-full bg-black text-white py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:bg-[#F7A221] transition-all active:scale-95 shadow-lg shadow-black/10"
              >
                Proceed to Checkout
                <ArrowRight size={15} />
              </Link>
              <Link
                onClick={handleCart}
                to="/account/usercart"
                onClose={onClose}
                className="w-full bg-white border-2 border-black text-black py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
// TRY TO MATCH THE CONTENT SAME AS WISHLISTSIDE BAR NOTHING CHANGE >>>>>>
// import React, { useEffect, useMemo } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
// import { Link } from 'react-router-dom';

// import {
//   fetchCart,
//   updateCartItem,
//   removeCartItem,
//   updateGuestCartItem,
//   removeGuestCartItem,
//   clearCartErrors,
//   selectCartItems,
//   selectCartGuestItems,
//   selectCartTotalAmount,
//   selectCartTotalItems,
//   selectCartLoading,
//   selectCartError,
//   selectDisplayCartCount,
// } from "../../components/REDUX_FEATURES/REDUX_SLICES/userCartSlice";

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// const fmt = (n) => {
//   if (n == null) return "—";
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 0,
//   }).format(n);
// };

// const logError = (context, error, info = {}) => {
//   console.group(`🔴 [CartSidebar] ERROR in ${context}`);
//   console.error("Error:", error);
//   console.log("Info:", info);
//   console.groupEnd();
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // CartItem — extracts data correctly from both logged-in and guest item shapes
// // ─────────────────────────────────────────────────────────────────────────────
// const CartItem = ({ item, isLoggedIn, onUpdateQty, onRemove, isUpdating, isRemoving }) => {

//   const isPopulated = typeof item.productId === "object" && item.productId !== null;

//   // ── Find the specific variant that was added ──────────────────────────────
//   // API: item.variantId matches item.productId.variants[]._id
//   const matchedVariant = isPopulated
//     ? (item.productId.variants?.find(
//         (v) => String(v._id) === String(item.variantId)
//       ) ?? item.productId.variants?.[0] ?? null)
//     : null;

//   // Name — title first ("Studio Light - Red Edition"), fallback to name
//   const name = isPopulated
//     ? (item.productId.title || item.productId.name)
//     : (item.name || item.productSlug || "Product");

//   // Image — from the MATCHED variant images[], not product-level
//   // API: item.productId.variants[matched].images[0].url
//   const image =
//     matchedVariant?.images?.[0]?.url ||
//     item.productId?.variants?.[0]?.images?.[0]?.url ||
//     item.image ||
//     null;

//   // Price — from priceSnapshot (backend attaches this per cart item)
//   // priceSnapshot = { base, sale }
//   const price =
//     item.priceSnapshot?.sale ??
//     item.priceSnapshot?.base ??
//     matchedVariant?.finalPrice ??
//     matchedVariant?.price?.sale ??
//     matchedVariant?.price?.base ??
//     null;

//   // Variant attributes for display (Color: Red etc)
//   const variantAttrs = item.variantAttributesSnapshot ?? matchedVariant?.attributes ?? [];

//   // Category — API returns category as plain string ID (not populated)
//   // Use brand as display label instead
//   const category = item.productId?.brand || null;

//   const qty = item.quantity || 1;
//   const itemTotal = price != null ? price * qty : null;

//   return (
//     <div className="flex gap-4 group py-2">
//       {/* Image */}
//       <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
//         {image ? (
//           <img
//             src={image}
//             alt={name}
//             className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
//             onError={(e) => {
//               e.target.style.display = "none";
//               logError("CartItem img", new Error("Image load failed"), { name, image });
//             }}
//           />
//         ) : (
//           <div className="h-full w-full flex items-center justify-center bg-gray-100">
//             <ShoppingBag size={24} className="text-gray-300" />
//           </div>
//         )}
//       </div>

//       {/* Details */}
//       <div className="flex flex-1 flex-col justify-between py-1 min-w-0">
//         <div>
//           <div className="flex justify-between items-start gap-2">
//             <h3 className="text-sm font-bold text-gray-900 line-clamp-1 uppercase tracking-tight flex-1">
//               {name}
//             </h3>
//             {itemTotal != null && (
//               <p className="text-sm font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
//                 {fmt(itemTotal)}
//               </p>
//             )}
//           </div>
//           {/* Brand + variant attributes (Color: Red etc) */}
//           <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
//             {category && (
//               <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">
//                 {category}
//               </span>
//             )}
//             {variantAttrs.map((a) => (
//               <span key={a._id || a.key} className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">
//                 · {a.key}: {a.value}
//               </span>
//             ))}
//           </div>
//           {price != null && (
//             <p className="mt-0.5 text-xs text-gray-400">
//               {fmt(price)} × {qty}
//             </p>
//           )}
//         </div>

//         <div className="flex items-center justify-between mt-2">
//           {/* Qty controls */}
//           <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
//             <button
//               onClick={() => onUpdateQty(item, qty - 1)}
//               disabled={qty <= 1 || isUpdating}
//               className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
//               aria-label="Decrease quantity"
//             >
//               <Minus size={13} />
//             </button>
//             <span className="px-3 text-xs font-bold min-w-[2rem] text-center">
//               {isUpdating ? "…" : qty}
//             </span>
//             <button
//               onClick={() => onUpdateQty(item, qty + 1)}
//               disabled={isUpdating}
//               className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
//               aria-label="Increase quantity"
//             >
//               <Plus size={13} />
//             </button>
//           </div>

//           {/* Remove */}
//           <button
//             onClick={() => onRemove(item)}
//             disabled={isRemoving}
//             className="text-gray-300 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
//             aria-label="Remove item"
//           >
//             {isRemoving ? (
//               <RefreshCw size={16} className="animate-spin" />
//             ) : (
//               <Trash2 size={16} />
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // CartSidebar
// // ─────────────────────────────────────────────────────────────────────────────
// const CartSidebar = ({ isOpen, onClose }) => {
//   const dispatch = useDispatch();

//   // ── Selectors ─────────────────────────────────────────────────────────────
//   const items       = useSelector(selectCartItems);
//   const guestItems  = useSelector(selectCartGuestItems);
//   const totalAmount = useSelector(selectCartTotalAmount);
//   const totalItems  = useSelector(selectDisplayCartCount);
//   const loading     = useSelector(selectCartLoading);
//   const error       = useSelector(selectCartError);
//   const { isLoggedIn } = useSelector((state) => state.auth);

//   // ── Which items to show ────────────────────────────────────────────────────
//   const currentItems = isLoggedIn ? items : guestItems;

//   // ── Computed subtotal for guest cart (slice doesn't compute it) ────────────
//   const subtotal = useMemo(() => {
//     if (isLoggedIn) return totalAmount;
//     // Guest items may have price attached when you call addGuestCartItem
//     return guestItems.reduce((sum, item) => {
//       const price = item.price ?? 0;
//       return sum + price * (item.quantity || 1);
//     }, 0);
//   }, [isLoggedIn, totalAmount, guestItems]);

//   // ── Fetch cart when sidebar opens (logged in only) ─────────────────────────
//   useEffect(() => {
//     if (isOpen && isLoggedIn) {
//       console.log("🛒 [CartSidebar] opened — refreshing cart from DB");
//       dispatch(fetchCart())
//         .unwrap()
//         .then(() => console.log("✅ [CartSidebar] cart refreshed"))
//         .catch((e) => logError("fetchCart on open", e));
//     }
//   }, [isOpen, isLoggedIn, dispatch]);

//   // ── Body scroll lock ───────────────────────────────────────────────────────
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "unset";
//     return () => { document.body.style.overflow = "unset"; };
//   }, [isOpen]);

//   // ── Clear errors when closing ──────────────────────────────────────────────
//   useEffect(() => {
//     if (!isOpen) dispatch(clearCartErrors());
//   }, [isOpen, dispatch]);

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const handleUpdateQty = (item, newQty) => {
//     if (newQty < 1) return;
//     if (isLoggedIn) {
//       dispatch(updateCartItem({
//         productId: item.productId?._id || item.productId,
//         variantId: item.variantId,
//         quantity:  newQty,
//         productSlug: item._productSlug,
//       }))
//         .unwrap()
//         .catch((e) => logError("updateCartItem", e, { newQty }));
//     } else {
//       dispatch(updateGuestCartItem({
//         productSlug: item.productSlug,
//         variantId:   item.variantId,
//         quantity:    newQty,
//       }));
//     }
//   };

//   const handleRemove = (item) => {
//     if (isLoggedIn) {
//       dispatch(removeCartItem({
//         productId:   item.productId?._id || item.productId,
//         variantId:   item.variantId,
//         productSlug: item._productSlug,
//       }))
//         .unwrap()
//         .catch((e) => logError("removeCartItem", e));
//     } else {
//       dispatch(removeGuestCartItem({
//         productSlug: item.productSlug,
//         variantId:   item.variantId,
//       }));
//     }
//   };

//   const isFetching  = loading.fetch;
//   const isUpdating  = loading.update;
//   const isRemoving  = loading.remove;
//   const fetchFailed = error.fetch;

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${
//           isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
//         }`}
//         onClick={onClose}
//         aria-hidden="true"
//       />

//       {/* Sidebar panel */}
//       <div
//         className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[101] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
//           isOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//         role="dialog"
//         aria-modal="true"
//         aria-label="Shopping cart"
//       >

//         {/* ── Header ── */}
//         <div className="px-6 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
//           <div className="flex items-center gap-3">
//             <ShoppingBag size={22} className="text-[#F7A221]" />
//             <h2 className="text-lg font-black uppercase tracking-tighter">
//               Your Cart
//               <span className="ml-2 text-sm font-bold text-gray-400">
//                 ({totalItems})
//               </span>
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             aria-label="Close cart"
//             className="p-2 hover:bg-gray-100 rounded-full transition-all hover:rotate-90 duration-300"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         {/* ── Error banner ── */}
//         {(fetchFailed || error.update || error.remove) && (
//           <div className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
//             <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
//             <div className="flex-1 min-w-0">
//               <p className="text-xs font-semibold text-red-700">
//                 {fetchFailed?.message || error.update?.message || error.remove?.message || "Something went wrong"}
//               </p>
//             </div>
//             <button
//               onClick={() => dispatch(clearCartErrors())}
//               className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
//             >
//               <X size={14} />
//             </button>
//           </div>
//         )}

//         {/* ── Body ── */}
//         <div className="flex-1 overflow-y-auto px-6 py-4">

//           {/* Loading state */}
//           {isFetching && currentItems.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center gap-3">
//               <RefreshCw size={24} className="text-gray-300 animate-spin" />
//               <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
//                 Loading your cart…
//               </p>
//             </div>

//           /* Fetch failed + empty */
//           ) : fetchFailed && currentItems.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
//               <AlertCircle size={32} className="text-red-300" />
//               <p className="text-sm text-gray-500 font-medium">
//                 {fetchFailed.message || "Failed to load cart"}
//               </p>
//               <button
//                 onClick={() => dispatch(fetchCart())}
//                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#F7A221] text-white px-5 py-2.5 rounded-xl hover:bg-[#e6941e] transition-colors active:scale-95"
//               >
//                 <RefreshCw size={13} /> Try Again
//               </button>
//             </div>

//           /* Items list */
//           ) : currentItems.length > 0 ? (
//             <div className="divide-y divide-gray-50">
//               {currentItems.map((item, index) => (
//                 <div key={item._id || `${item.productSlug || item._productSlug}-${item.variantId}-${index}`} className="py-2">
//                   <CartItem
//                     item={item}
//                     isLoggedIn={isLoggedIn}
//                     onUpdateQty={handleUpdateQty}
//                     onRemove={handleRemove}
//                     isUpdating={isUpdating}
//                     isRemoving={isRemoving}
//                   />
//                 </div>
//               ))}
//             </div>

//           /* Empty state */
//           ) : (
//             <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
//               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
//                 <ShoppingBag size={32} className="text-gray-200" />
//               </div>
//               <div>
//                 <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
//                   Your cart is empty
//                 </p>
//                 <p className="text-gray-400 text-xs mt-1">
//                   Add something you love
//                 </p>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-[#F7A221] font-black text-xs uppercase underline underline-offset-4 hover:text-[#e6941e] transition-colors"
//               >
//                 Start Shopping
//               </button>
//             </div>
//           )}
//         </div>

//         {/* ── Footer ── */}
//         {currentItems.length > 0 && (
//           <div className="border-t px-6 py-5 bg-gray-50/50 space-y-4">
//             {/* Subtotal */}
//             <div className="flex justify-between items-center">
//               <span className="text-sm font-black uppercase tracking-tighter text-gray-700">
//                 Subtotal
//               </span>
//               <span className="text-base font-black text-gray-900">
//                 {subtotal > 0 ? fmt(subtotal) : "—"}
//               </span>
//             </div>
//             <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
//               Shipping and taxes calculated at checkout
//             </p>

//             {/* CTA buttons */}
//             <div className="space-y-2 pt-1">
//               <Link
//                 to="/checkout"
//                 onClick={onClose}
//                 className="w-full bg-black text-white py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:bg-[#F7A221] transition-all active:scale-95 shadow-lg shadow-black/10"
//               >
//                 Proceed to Checkout
//                 <ArrowRight size={15} />
//               </Link>
//               <Link
//                 to="/cart"
//                 onClick={onClose}
//                 className="w-full bg-white border-2 border-black text-black py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
//               >
//                 View Full Cart
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default CartSidebar;