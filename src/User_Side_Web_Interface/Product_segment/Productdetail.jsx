import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoLogoWhatsapp, IoLogoFacebook, IoLogoInstagram } from "react-icons/io5";
import { FaTelegram } from "react-icons/fa6";
import {
  Star, Share2, Heart, Minus, Plus, ShoppingCart,
  Zap, ChevronRight, Info, CheckCircle2, Truck,
  AlertCircle, RefreshCw, Check, ArrowLeft,
  BaggageClaimIcon,
  Eye,
  Loader2,
  ArrowRight,
  MoveRight,
} from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
  addGuestItem,
  removeGuestItem,
  selectIsWishlisted,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userWishlistSlice";

import {
  fetchProductBySlug,
  fetchRelatedProducts,
  clearCurrentProduct,
  clearRelatedProducts,
  selectCurrentProduct,
  selectRelatedProducts,
  selectProductsLoading,
  selectProductsError,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice";
import { addGuestCartItem, addToCart, removeCartItem, removeGuestCartItem, selectCartItemBySlug, updateCartItem, updateGuestCartItem } from "../../components/REDUX_FEATURES/REDUX_SLICES/userCartSlice";
import { toast } from "react-toastify";

// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="container mx-auto px-4 py-8 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5">
        <div className="aspect-square bg-gray-200 rounded mb-3" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="w-14 h-14 bg-gray-200 rounded" />)}
        </div>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="h-7 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded w-1/3" />
      
      </div>
      <div className="lg:col-span-3">
        <div className="border rounded-lg p-5 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded-full" />
          <div className="h-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// formatPrice — prices are stored as rupees, NO division needed
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

// RelatedCard
// ─────────────────────────────────────────────────────────────────────────────
const RelatedCard = ({ product }) => {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  // images and price come from variant[0]
  const v         = product?.variants?.[0] ?? {};
  const title     = product?.title || product?.name || "Product";
  const imgUrl    = v.images?.[0]?.url ?? null;
  const salePrice = v.finalPrice ?? v.price?.sale ?? v.price?.base ?? null;
  const basePrice = v.price?.base ?? null;
  const disc      = basePrice && salePrice && basePrice > salePrice;

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
    >
      <div className="h-40 bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
        {imgUrl
          ? <img src={imgUrl} alt={title} loading="lazy"
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-gray-300 text-xs">No Image</span>}
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h4 className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-[#f7a221] transition-colors">
          {title}
        </h4>
        <div className="flex items-baseline gap-1 mt-auto mb-2 flex-wrap">
          <span className="text-sm font-bold">{fmt(salePrice)}</span>
          {disc && <span className="text-xs text-gray-400 line-through">{fmt(basePrice)}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
          className={`w-full text-white text-xs font-medium py-1.5 rounded-full transition-colors active:scale-95 ${added ? "bg-green-500" : "bg-[#FFA41C] hover:bg-[#f7a221]"}`}
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

const ProductUI = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // local UI state
  // const [qty,           setQty]           = useState(1);
  const [activeThumb,   setActiveThumb]   = useState(0);
  const [addedToCart,   setAddedToCart]   = useState(false);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [showDesc,      setShowDesc]      = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState({});  // { Color: "White", Size: "M" }

  // redux
  const product      = useSelector(selectCurrentProduct);
  console.log(product);
  
  const related      = useSelector(selectRelatedProducts);
  const loadingMap   = useSelector(selectProductsLoading);
  const errorMap     = useSelector(selectProductsError);
  const isLoading    = loadingMap.product;
  const fetchError   = errorMap.product;
    const wishlisted = useSelector(selectIsWishlisted(product?.slug));
    const attributeMap = {};
    product?.variants?.forEach((variant) => {
  variant.attributes?.forEach((attr) => {
    if (!attributeMap[attr.key]) {
      attributeMap[attr.key] = new Set();
    }
    attributeMap[attr.key].add(attr.value);
  });
});

// convert Set → Array
const finalAttributes = Object.keys(attributeMap).map((key) => ({
  key,
  values: Array.from(attributeMap[key]),
}));
  // 🔴 MOCK DATA
  // const product = {
  //   name: "Portable Classic Hand Fan 3-Speed Table Fan For Office School Home Use",
  //   brand: "Velvet Wellness",
  //   price: 105,
  //   mrp: 199,
  //   discount: 47,
  //   rating: 4.3,
  //   reviews: 53,
  // };

  const [qty, setQty] = React.useState(1);
  const [openSection, setOpenSection] = useState(false);
  // const [wishlisted, setWishlisted] = React.useState(false);
  // ── fetch on slug change ────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    // console.log(`🔍 [ProductDetail] mounting slug="${slug}"`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch(clearCurrentProduct());
    dispatch(clearRelatedProducts());
    setSelectedAttrs({});
    setQty(1);
    setActiveThumb(0);

    dispatch(fetchProductBySlug(slug))
      .unwrap()
      .then((d) => {
          //  console.log("RAW API RESPONSE  PRODUCT PAGE....??:", JSON.stringify(d, null, 2))
        // fetch related after product is confirmed
        dispatch(fetchRelatedProducts({ slug, limit: 4 }))
          .unwrap()
          // .then((r) => console.log(`✅ related: ${r.related?.length}`))
          .catch((e) => logError("fetchRelatedProducts", e, { slug }));
      })
      .catch((e) => logError("fetchProductBySlug", e, { slug }));

    return () => {
      dispatch(clearCurrentProduct());
      dispatch(clearRelatedProducts());
    };
  }, [slug, dispatch]);

  // ── variant logic ───────────────────────────────────────────────────────
  // IMPORTANT: filter by isActive exactly as admin set — never hardcode
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.isActive === true),
    [product]
  );

  // all unique attribute keys across active variants e.g. ["Color","Size"]
  const attrKeys = useMemo(() => {
    const s = new Set();
    activeVariants.forEach((v) => v.attributes?.forEach((a) => s.add(a.key)));
    return [...s];
  }, [activeVariants]);

  // all unique values for a given key across ALL active variants
  const getAllValues = useCallback((key) => {
    const s = new Set();
    activeVariants.forEach((v) =>
      v.attributes?.filter((a) => a.key === key).forEach((a) => s.add(a.value))
    );
    return [...s];
  }, [activeVariants]);

  // a value is clickable if ANY active variant has it
  const isAvailable = useCallback((key, value) =>
    activeVariants.some((v) =>
      v.attributes?.some((a) => a.key === key && a.value === value)
    ), [activeVariants]);

  // score-based best match — highest number of matching attrs wins
  const selectedVariant = useMemo(() => {
    if (!activeVariants.length) return null;
    if (!Object.keys(selectedAttrs).length) return activeVariants[0];
    let best = activeVariants[0], bestScore = -1;
    activeVariants.forEach((v) => {
      const score = Object.entries(selectedAttrs).filter(([k, val]) =>
        v.attributes?.some((a) => a.key === k && a.value === val)
      ).length;
      if (score > bestScore) { bestScore = score; best = v; }
    });
    return best;
  }, [activeVariants, selectedAttrs]);

  // auto-select first active variant when product/variants load
  useEffect(() => {
    if (!activeVariants.length) return;
    const init = {};
    activeVariants[0].attributes?.forEach((a) => { init[a.key] = a.value; });
    setSelectedAttrs(init);
    setActiveThumb(0);
  }, [activeVariants]);

  // reset thumb index when selected variant changes (different variant → different images)
  useEffect(() => { setActiveThumb(0); }, [selectedVariant?._id]);

  const handleAttrSelect = (key, value) => {
    setSelectedAttrs((prev) => ({ ...prev, [key]: value }));
    setQty(1);
    setAddedToCart(false);
  };

  // ── derived values all from selectedVariant ─────────────────────────────
  // images: from selectedVariant.images[] — can be multiple
  const images     = selectedVariant?.images ?? [];
  const activeImg  = images[activeThumb]?.url ?? null;

  // price: use finalPrice (pre-computed by backend), fall back to price.sale then price.base
  const salePrice  = selectedVariant?.finalPrice
    ?? selectedVariant?.price?.sale
    ?? selectedVariant?.price?.base
    ?? null;
  const basePrice  = selectedVariant?.price?.base ?? null;
  const hasDisc    = basePrice != null && salePrice != null && basePrice > salePrice;
  const discPct    = selectedVariant?.discountPercentage
    ?? (hasDisc ? Math.round(((basePrice - salePrice) / basePrice) * 100) : null);

  // stock
  const stock      = selectedVariant?.inventory?.quantity ?? null;
  const inStock    = product?.inStock ?? (stock == null || stock > 0);
  const lowStock   = stock != null && stock > 0
    && stock <= (selectedVariant?.inventory?.lowStockThreshold ?? 5);

  // top-level fields
  const title      = product?.title || product?.name || "Product";
  const desc       = product?.description ?? "";
  const specs      = product?.attributes ?? [];          // shared specs e.g. Material, Comfort
  const shipping   = product?.shipping ?? {};
  const rating     = product?.rating?.value ?? 4.5;
  const ratingCnt  = product?.rating?.count ?? 4.5;
  const catName    = product?.category?.name ?? null;
  const catSlug    = product?.category?.slug ?? null;
  const brand      = product?.brand ?? null;

  // FOMO — only show when enabled AND has data
  const showFomo   = product?.fomo?.enabled && (product?.fomo?.viewingNow ?? 0) > 0;
  const showSold   = product?.soldInfo?.enabled && (product?.soldInfo?.count ?? 0) > 0;
   const cartItem   = useSelector(selectCartItemBySlug(product?.slug));
    const isInCart   = !!cartItem;
     // ✅ per-card local loading — NOT global Redux loading
      const [localLoading, setLocalLoading] = useState({
        add: false,
        update: false,
        remove: false,
        wishlist: false,
      });
    
      const setLoading = (key, val) =>
        setLocalLoading((prev) => ({ ...prev, [key]: val }));
         const maxStock = selectedVariant?.inventory?.quantity ?? 9999;
      const currentQty = cartItem?.quantity ?? 0;
      const isAtMaxStock = currentQty >= maxStock;
    
      const isProcessing = localLoading.add || localLoading.update || localLoading.remove;
        const { isLoggedIn } = useSelector((state) => state.auth);
          const variant     = selectedVariant || {};

  // const handleAddToCart = () => {
  //   if (!inStock || !product) return;
  //   // 🔌 dispatch(addItemToCart({ product, variant: selectedVariant, qty }))
  //   setAddedToCart(true);
  //   setTimeout(() => setAddedToCart(false), 2000);
  // };
  const handleAddToCart = async (e) => {
      e.stopPropagation();
      if (isInCart) return;
      if (isProcessing) return;
      if (!inStock) return;
      if (!product?.slug) {
        logError("handleAddToCart", new Error("Missing slug"), { product });
        return;
      }
  
      setLoading("add", true);
      try {
        if (isLoggedIn) {
          await dispatch(addToCart({
            productSlug: product.slug,
            variantId: variant?._id?.toString(),
            quantity: 1,
          })).unwrap();
          toast.success(
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <ShoppingCart size={18} /> */}
              <span>Added to cart</span>
            </div>
          );
          console.log(`✅ [ProductCard] slug="${product.slug}" added to cart`);
        } else {
          dispatch(addGuestCartItem({
              productId: product._id,   //backend expect this when guest card merged.
            productSlug: product.slug,
            variantId: variant?._id?.toString() || "",
            quantity: 1,
          }));
          toast.success(
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <ShoppingCart size={18} /> */}
              <span>Added to cart</span>
            </div>
          );
          console.log(`✅ [ProductCard] guest slug="${product.slug}" added`);
        }
      } catch (error) {
        logError("handleAddToCart", error, { slug: product.slug });
        toast.error(error?.message || "Failed to add to cart");
      } finally {
        setLoading("add", false);
      }
    };
    // Increment quantity in cart with stock check
     const handleIncrement = async (e) => {
        e.stopPropagation();
        if (isAtMaxStock) {
          toast.warning(`Max stock reached (${maxStock})`);
          return;
        }
        if (isProcessing) return;
    
        const newQty = currentQty + 1;
        setLoading("update", true);
        try {
          if (isLoggedIn) {
            await dispatch(updateCartItem({
              productId: String(cartItem?.productId?._id || cartItem?.productId),
              variantId: String(cartItem?.variantId),
              quantity: newQty,
              productSlug: product.slug,
            })).unwrap();
            console.log(`✅ [ProductCard] slug="${product.slug}" qty → ${newQty}`);
          } else {
            dispatch(updateGuestCartItem({
              productSlug: product.slug,
              variantId: variant?._id?.toString() || "",
              quantity: newQty,
            }));
          }
        } catch (error) {
          logError("handleIncrement", error, { slug: product.slug, newQty });
          toast.error(error?.message || "Failed to update quantity");
        } finally {
          setLoading("update", false);
        }
      };
       const handleDecrement = async (e) => {
          e.stopPropagation();
          if (isProcessing) return;
      
          const newQty = currentQty - 1;
      
          if (isLoggedIn) {
            if (newQty <= 0) {
              setLoading("remove", true);
              try {
                await dispatch(removeCartItem({
                  productId: String(cartItem?.productId?._id || cartItem?.productId),
                  variantId: String(cartItem?.variantId),
                  productSlug: product.slug,
                })).unwrap();
                toast.info("Removed from cart");
                console.log(`✅ [ProductCard] slug="${product.slug}" removed from cart`);
              } catch (error) {
                logError("handleDecrement → remove", error, { slug: product.slug });
                toast.error(error?.message || "Failed to remove from cart");
              } finally {
                setLoading("remove", false);
              }
            } else {
              setLoading("update", true);
              try {
                await dispatch(updateCartItem({
                  productId: String(cartItem?.productId?._id || cartItem?.productId),
                  variantId: String(cartItem?.variantId),
                  quantity: newQty,
                  productSlug: product.slug,
                })).unwrap();
                console.log(`✅ [ProductCard] slug="${product.slug}" qty → ${newQty}`);
              } catch (error) {
                logError("handleDecrement → update", error, { slug: product.slug, newQty });
                toast.error(error?.message || "Failed to update quantity");
              } finally {
                setLoading("update", false);
              }
            }
          } else {
            // Guest
            if (newQty <= 0) {
              dispatch(removeGuestCartItem({
                productSlug: product.slug,
                variantId: variant?._id?.toString() || "",
              }));
              toast.info("Removed from cart");
            } else {
              dispatch(updateGuestCartItem({
                productSlug: product.slug,
                variantId: variant?._id?.toString() || "",
                quantity: newQty,
              }));
            }
          }
        };

         // ── Wishlist ──────────────────────────────────────────────────────────────
          const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!product?.slug) return;
    if (localLoading.wishlist) return;

    setLoading("wishlist", true);
    try {
      if (isLoggedIn) {
        if (wishlisted) {
          await dispatch(removeFromWishlist({ productSlug: product.slug })).unwrap();
          toast.success("Removed from wishlist", { icon: "💔" });
          console.log(`✅ [ProductCard] slug="${product.slug}" removed from wishlist`);
        } else {
          await dispatch(addToWishlist({ productSlug: product.slug })).unwrap();
          toast.success("Added to wishlist", { icon: "❤️" });
          console.log(`✅ [ProductCard] slug="${product.slug}" added to wishlist`);
        }
      } else {
        if (wishlisted) {
          dispatch(removeGuestItem(product.slug));
          toast.success("Removed from wishlist", { icon: "💔" });
        } else {
          dispatch(addGuestItem(product.slug));
          toast.success("Saved to wishlist", { icon: "❤️" });
        }
      }
    } catch (error) {
      logError("handleWishlist", error, { slug: product.slug });
      toast.error(error?.message || "Wishlist action failed");
    } finally {
      setLoading("wishlist", false);
    }
  };

  const share = (type) => {
    const url = window.location.href;
    const map = {
      whatsapp:  `https://wa.me/?text=${encodeURIComponent(url)}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      telegram:  `https://t.me/share/url?url=${encodeURIComponent(url)}`,
    };
    if (map[type]) window.open(map[type], "_blank");
    if (type === "instagram") {
      navigator?.clipboard?.writeText(url);
      alert("Link copied! Paste it in Instagram to share.");
    }
    setShareOpen(false);
  };

  // ── render guards ───────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="bg-white font-sans antialiased"><Skeleton /></div>
  );

  if (fetchError) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-gray-600 text-center max-w-sm text-sm">
        {fetchError?.message || "Product not found."}
      </p>
      <div className="flex gap-3">
        <button onClick={() => dispatch(fetchProductBySlug(slug))}
          className="flex items-center gap-2 bg-[#FFA41C] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hover:bg-[#f7a221]">
          <RefreshCw size={14} /> Retry
        </button>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hover:bg-gray-200">
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    </div>
  );

  if (!product) return null;

 return (
  <div className="min-h-screen max-w-7xl mt-10 mx-auto p-4">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* 🖼 LEFT IMAGE */}
      <div className="lg:col-span-6 flex gap-4">

        {/* Thumbnails */}
        <div className="hidden lg:flex flex-col gap-3">
          {images?.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`w-16 h-16 border rounded-md overflow-hidden ${
                activeThumb === i
                  ? "border-[#f7a221]"
                  : "border-gray-200"
              }`}
            >
              <img
                src={img.url}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main Image */}
        <div className="flex-1 bg-white rounded-xl p-2 overflow-hidden">
          {activeImg && (
            <img
              src={activeImg}
              className="w-full h-[400px] md:h-[600px] object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      {/* 📦 RIGHT SIDE */}
      <div className="lg:col-span-6 space-y-4">

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-semibold leading-snug">
          {title}
        </h1>

        {/* Share */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Share:</span>

          <button
            onClick={() => share("whatsapp")}
            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"
          >
            <IoLogoWhatsapp size={16} />
          </button>

          <button
            onClick={() => share("facebook")}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"
          >
            <IoLogoFacebook size={16} />
          </button>

          <button
            onClick={() => share("instagram")}
            className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center"
          >
            <IoLogoInstagram size={16} />
          </button>

          <button
            onClick={() => share("telegram")}
            className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center"
          >
            <FaTelegram size={14} />
          </button>
        </div>

        {/* Brand */}
        <p className="text-sm text-gray-500">
          by <span className="text-[#f7a221] font-medium">{brand}</span>
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span>{rating}</span>
          <span>({ratingCnt} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl md:text-3xl font-bold text-red-600">
            ₹{salePrice}
          </span>

          {hasDisc && (
            <>
              <span className="line-through text-gray-400 text-sm">
                ₹{basePrice}
              </span>

              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                {discPct}% OFF
              </span>
            </>
          )}
        </div>
    <div className="mt-4 space-y-4">

  {finalAttributes.map((attr) => (
    <div key={attr.key}>

      {/* LABEL */}
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
        {attr.key}
      </p>

      {/* OPTIONS */}
      <div className="flex flex-wrap gap-2">
        {attr.values.map((val, i) => (
          <button
            key={i}
            className="px-3 py-1 text-xs border border-zinc-300 rounded-md bg-white text-zinc-800 hover:bg-black hover:text-white transition"
          >
            {val}
          </button>
        ))}
      </div>

    </div>
  ))}

</div>

        {/* Qty + Cart */}
        <div className="flex items-center gap-3">

          {/* Add to Cart */}
           <div className="w-60 space-y-2">

  {/* ❌ OUT OF STOCK */}
  {!inStock && (
    <button
      disabled
      className="w-full py-3 rounded-lg text-xs font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
    >
      Out of Stock
    </button>
  )}

 <div className="flex items-center gap-4 b1">
  <div className="space-y-2">
   {/* 🛒 ADD TO CART */}
  {inStock && !isInCart && (
    <button
      onClick={handleAddToCart}
      disabled={localLoading.add}
      className={`w-52 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
        localLoading.add
          ? "bg-gray-400 text-white cursor-wait"
          : "bg-black text-white hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 hover:text-black active:scale-95"
      }`}
    >
      {localLoading.add ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          Add to Cart
        </>
      )}
    </button>
  )}

  {/* 🔢 QTY CONTROLS */}
  {inStock && isInCart && (
    <>
      <div className="flex items-center w-full border border-gray-300 rounded-lg overflow-hidden">

        {/* ➖ */}
        <button
          onClick={handleDecrement}
          disabled={isProcessing}
          className={`w-12 h-11 flex items-center justify-center transition ${
            isProcessing
              ? "bg-gray-100 text-gray-300 cursor-wait"
              : "bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white"
          }`}
        >
          {localLoading.remove
            ? <Loader2 size={16} className="animate-spin" />
            : <Minus size={16} />
          }
        </button>

        {/* QTY */}
        <div className="flex-1 text-center text-sm font-semibold text-gray-900 bg-white">
          {localLoading.update
            ? <Loader2 size={16} className="animate-spin mx-auto" />
            : currentQty
          }
        </div>

        {/* ➕ */}
        <button
          onClick={handleIncrement}
          disabled={isAtMaxStock || isProcessing}
          className={`w-12 h-11 flex items-center justify-center transition ${
            isAtMaxStock
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : isProcessing
                ? "bg-gray-100 text-gray-300 cursor-wait"
                : "bg-black text-white hover:bg-yellow-500 hover:text-black"
          }`}
        >
          {localLoading.update
            ? <Loader2 size={16} className="animate-spin" />
            : <Plus size={16} />
          }
        </button>
      </div>

      {/* ⚠️ STOCK WARNING */}
      {isAtMaxStock && (
        <p className="text-xs text-center text-orange-500 font-medium">
          Max stock reached
        </p>
      )}
    </>
  )}
 </div>
  {/* Buy Now */}
        <button className="px-22 h-fit bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold">
          Buy Now
        </button>
         {/* Wishlist (UPDATED ✅) */}
          <button
            onClick={handleWishlist}
            disabled={localLoading.wishlist}
            className={`px-3 h-9 rounded-full text-xs font-medium border transition ${
              wishlisted
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {localLoading.wishlist ? (
              <Loader2 size={14} className="animate-spin" />
            ) : wishlisted ? (
              <Heart size={18} />
            ) : (
              <Heart size={18} />
            )}
          </button>
 </div>

</div>
        </div>
       {product?.variants?.[0]?.attributes?.length > 0 && (
  <div className="mt-4 space-y-3">

  </div>
)}

        {/* Delivery */}
        <p className="text-sm text-gray-600">
          Order within{" "}
          <span className="text-red-500 font-semibold">
            8 hrs 34 mins
          </span>{" "}
          for <span className="font-semibold">One-day Dispatch</span>
        </p>

        {/* Timeline */}
        <div className="flex justify-center gap-10 ml-4 text-xs text-gray-500 pt-2">

          <div className="flex items-center">
           <div className="flex flex-col items-center gap-1">
             <Truck size={18} />
            <span>Today</span>
            <span>Order</span>
           </div>
            <MoveRight size={22} className="ml-8 text-gray-300" />
          </div>

          <div className="flex items-center">
             <div className="flex flex-col items-center gap-1">
            <Truck size={18} />
            <span>Tomorrow</span>
            <span>Ready</span>
              </div>
             <MoveRight size={22} className="ml-8 text-gray-300" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 size={18} />
            <span>2-3 Days</span>
            <span>Delivered</span>
          </div>

        </div>
          <div className="border border-gray-300 transition-all duration-300 rounded-md mt-18">

  {/* HEADER */}
  <button
    onClick={() =>
      setOpenSection(openSection === false ? true : false)
    }
    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 text-left"
  >
    <span className="font-semibold text-sm">Description</span>

    <span className="text-lg">
      {openSection === false ? "−" : "+"}
    </span>
  </button>

  {/* CONTENT */}
  {openSection === true && (
    <div className="px-4 py-4 text-sm text-gray-700 space-y-3">

      <p className="font-semibold">
        {title}
      </p>

      <p className="font-medium">Description :-</p>

      <ul className="list-disc pl-5 space-y-2">
        {desc?.split("\n")?.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      {/* DIMENSIONS */}
      <div className="pt-4">
        <p className="font-semibold mb-2">Dimension :-</p>

        <div className="space-y-1 text-xs">
          <p>Volu. Weight (Gm) : 195</p>
          <p>Product Weight (Gm) : 150</p>
          <p>Ship Weight (Gm) : 195</p>
          <p>Length (Cm) : 21</p>
          <p>Breadth (Cm) : 11</p>
          <p>Height (Cm) : 4</p>
        </div>
      </div>

      <div className="pt-3 text-xs">
        <p>Country Of Origin : China</p>
        <p>GST : 18%</p>
      </div>

    </div>
  )}

</div>

      </div>

    </div>
       {/* ── Related products ─────────────────────────────────────────────── */}
       {related?.length > 0 && (
      <div className="mt-28 mb-8">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">
            Related Products
          </h2>

          <button className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {related.map((p) => (
            <RelatedCard
              key={p._id || p.slug}
              product={p}
            />
          ))}
        </div>

      </div>
    )}
  </div>
);
};

export default ProductUI;