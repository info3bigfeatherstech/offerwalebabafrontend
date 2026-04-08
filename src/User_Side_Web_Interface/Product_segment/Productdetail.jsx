import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoLogoWhatsapp, IoLogoFacebook, IoLogoInstagram } from "react-icons/io5";
import { FaTelegram } from "react-icons/fa6";
import {
  Star, Heart, Minus, Plus, ShoppingCart,
  Zap, CheckCircle2, Truck, AlertCircle,
  RefreshCw, ArrowLeft, Loader2, ArrowRight,
  Package, ShieldCheck, RotateCcw,
  Tag,
  Share2,
} from "lucide-react";
import {
  addToWishlist, removeFromWishlist,
  addGuestItem, removeGuestItem, selectIsWishlisted,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userWishlistSlice";
import {
  fetchProductBySlug, fetchRelatedProducts,
  clearCurrentProduct, clearRelatedProducts,
  selectCurrentProduct, selectRelatedProducts,
  selectProductsLoading, selectProductsError,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userProductsSlice";
import {
  addGuestCartItem, addToCart, removeCartItem, removeGuestCartItem,
  selectCartItemBySlug, updateCartItem, updateGuestCartItem,
} from "../../components/REDUX_FEATURES/REDUX_SLICES/userCartSlice";
import { toast } from "react-toastify";
import Breadcrumb from "./Breadcrumb/Breadcrumb";
import CatProducts from "./CatPro_segment/CatProducts";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="w-[72px] h-[72px] bg-gray-200 rounded-xl" />)}
        </div>
        <div className="flex-1 bg-gray-200 rounded-2xl" style={{ minHeight: 480 }} />
      </div>
      <div className="space-y-5 pt-2">
        <div className="h-8 bg-gray-200 rounded-lg w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded-lg w-2/5" />
        <div className="h-12 bg-gray-200 rounded-xl w-full" />
        <div className="h-12 bg-gray-200 rounded-xl w-full" />
      </div>
    </div>
  </div>
);

// ─── Price formatter ──────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
};

// ─── Related Card ─────────────────────────────────────────────────────────────
const RelatedCard = ({ product }) => {
  const navigate = useNavigate();
  const v = product?.variants?.[0] ?? {};
  const title = product?.title || product?.name || "Product";
  const imgUrl = v.images?.[0]?.url ?? null;
  const salePrice = v.finalPrice ?? v.price?.sale ?? v.price?.base ?? null;
  const basePrice = v.price?.base ?? null;
  const disc = basePrice && salePrice && basePrice > salePrice;
  const discPct = disc ? Math.round(((basePrice - salePrice) / basePrice) * 100) : null;

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-3 overflow-hidden">
        {discPct && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">
            {discPct}% OFF
          </span>
        )}
        {imgUrl
          ? <img src={imgUrl} alt={title} loading="lazy"
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
          : <Package size={36} className="text-gray-300" />}
      </div>
      <div className="p-3 flex flex-col flex-grow border-t border-gray-100">
        <h4 className="text-xs font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
          {title}
        </h4>
        <div className="flex items-baseline gap-1.5 mt-auto mb-3 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{fmt(salePrice)}</span>
          {disc && <span className="text-xs text-gray-400 line-through">{fmt(basePrice)}</span>}
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-full text-white text-xs font-semibold py-2 rounded-lg transition-all bg-gray-900 hover:bg-orange-500 active:scale-95"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// ─── Main ProductUI ───────────────────────────────────────────────────────────
const ProductUI = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
    const location = useLocation();
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [openDesc, setOpenDesc] = useState(false);
  const [localLoading, setLocalLoading] = useState({
    add: false, update: false, remove: false, wishlist: false,
  });
   const [showZoom, setShowZoom] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setisVisible] = useState(false)
  const containerRef  = useRef(null);
  const lensRef = useRef(null);
  const zoomRef = useRef(null);
  const rafRef = useRef(null);

  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });

  const product    = useSelector(selectCurrentProduct);
  const related    = useSelector(selectRelatedProducts);
  const loadingMap = useSelector(selectProductsLoading);
  const errorMap   = useSelector(selectProductsError);
  const isLoading  = loadingMap.product;
  const fetchError = errorMap.product;
  const wishlisted = useSelector(selectIsWishlisted(product?.slug));
  const cartItem   = useSelector(selectCartItemBySlug(product?.slug));
  const isInCart   = !!cartItem;
  const { isLoggedIn } = useSelector((state) => state.auth);

  const setL = (key, val) => setLocalLoading((p) => ({ ...p, [key]: val }));

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch(clearCurrentProduct());
    dispatch(clearRelatedProducts());
    setSelectedAttrs({});
    setActiveThumb(0);
    dispatch(fetchProductBySlug(slug)).unwrap()
      .then(() => dispatch(fetchRelatedProducts({ slug, limit: 5 })).unwrap().catch(() => {}))
      .catch(() => {});
    return () => { dispatch(clearCurrentProduct()); dispatch(clearRelatedProducts()); };
  }, [slug, dispatch]);
  useEffect(() => {
  const close = () => setShareOpen(false);
  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, []);
// ✅ Detect mobile
  
  useEffect(() => {
    const checkMobile = () => {
      const isTouch =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      setIsMobile(isTouch || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 🔥 RAF loop (NO React re-render → smooth AF)
  useEffect(() => {
    const animate = () => {
      // smooth interpolation (LERP)
      currentRef.current.x +=
        (targetRef.current.x - currentRef.current.x) * 0.15;
      currentRef.current.y +=
        (targetRef.current.y - currentRef.current.y) * 0.15;

      const { x, y } = currentRef.current;

      // update lens
      if (lensRef.current) {
        lensRef.current.style.left = `${x * 100}%`;
        lensRef.current.style.top = `${y * 100}%`;
      }

      // update zoom background
      if (zoomRef.current) {
        zoomRef.current.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ✅ Update cursor position
  const updatePosition = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();

    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;

    // 🔥 hard clamp (no edge jitter)
    const padding = 0.05;
    x = Math.max(padding, Math.min(1 - padding, x));
    y = Math.max(padding, Math.min(1 - padding, y));

    targetRef.current = { x, y };
  };

  const handleMouseMove = (e) => {
    updatePosition(e.clientX, e.clientY);
  };

  // ── variant logic ──────────────────────────────────────────────────────────
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.isActive === true),
    [product]
  );
  function formatCount(count) {
  if (count < 100) return count.toString();
  return Math.floor(count / 100) * 100 + "+";
}

  const attrKeys = useMemo(() => {
    const s = new Set();
    activeVariants.forEach((v) => v.attributes?.forEach((a) => s.add(a.key)));
    return [...s];
  }, [activeVariants]);

  const getAllValues = useCallback((key) => {
    const s = new Set();
    activeVariants.forEach((v) =>
      v.attributes?.filter((a) => a.key === key).forEach((a) => s.add(a.value))
    );
    return [...s];
  }, [activeVariants]);

  const isAvailable = useCallback((key, value) =>
    activeVariants.some((v) => v.attributes?.some((a) => a.key === key && a.value === value)),
    [activeVariants]
  );

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

  useEffect(() => {
    if (!activeVariants.length) return;
    const init = {};
    activeVariants[0].attributes?.forEach((a) => { init[a.key] = a.value; });
    setSelectedAttrs(init);
    setActiveThumb(0);
  }, [activeVariants]);

  useEffect(() => { setActiveThumb(0); }, [selectedVariant?._id]);

  const handleAttrSelect = (key, value) => {
    setSelectedAttrs((prev) => ({ ...prev, [key]: value }));
    setActiveThumb(0);
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const images    = selectedVariant?.images ?? [];
  const activeImg = images[activeThumb]?.url ?? null;

  const salePrice = selectedVariant?.finalPrice ?? selectedVariant?.price?.sale ?? selectedVariant?.price?.base ?? null;
  const basePrice = selectedVariant?.price?.base ?? null;
  const hasDisc   = basePrice != null && salePrice != null && basePrice > salePrice;
  const discPct   = selectedVariant?.discountPercentage
    ?? (hasDisc ? Math.round(((basePrice - salePrice) / basePrice) * 100) : null);

  const stock    = selectedVariant?.inventory?.quantity ?? null;
  const inStock  = product?.inStock ?? (stock == null || stock > 0);
  const lowStock = stock != null && stock > 0 && stock <= (selectedVariant?.inventory?.lowStockThreshold ?? 5);
  const maxStock = selectedVariant?.inventory?.quantity ?? 9999;
  const currentQty   = cartItem?.quantity ?? 0;
  const isAtMaxStock = currentQty >= maxStock;
  const isProcessing = localLoading.add || localLoading.update || localLoading.remove;

  const title     = product?.title || product?.name || "Product";
  const desc      = product?.description ?? "";
  const rating    = product?.rating?.value ?? 4.5;
  const ratingCnt = product?.rating?.count ?? 0;
  const soldInfo = product?.soldInfo.count ?? 0
  const brand     = product?.brand ?? null;
  const variant   = selectedVariant || {};

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isInCart || isProcessing || !inStock || !product?.slug) return;
    setL("add", true);
    try {
      if (isLoggedIn) {
        await dispatch(addToCart({ productSlug: product.slug, variantId: variant?._id?.toString(), quantity: 1 })).unwrap();
      } else {
        dispatch(addGuestCartItem({ productId: product._id, productSlug: product.slug, variantId: variant?._id?.toString() || "", quantity: 1 }));
      }
      toast.success("Added to cart 🛒");
    } catch (err) { toast.error(err?.message || "Failed to add"); }
    finally { setL("add", false); }
  };

  const handleIncrement = async (e) => {
    e.stopPropagation();
    if (isAtMaxStock) { toast.warning(`Max stock reached (${maxStock})`); return; }
    if (isProcessing) return;
    const newQty = currentQty + 1;
    setL("update", true);
    try {
      if (isLoggedIn) await dispatch(updateCartItem({ productId: String(cartItem?.productId?._id || cartItem?.productId), variantId: String(cartItem?.variantId), quantity: newQty, productSlug: product.slug })).unwrap();
      else dispatch(updateGuestCartItem({ productSlug: product.slug, variantId: variant?._id?.toString() || "", quantity: newQty }));
    } catch (err) { toast.error(err?.message || "Failed to update"); }
    finally { setL("update", false); }
  };

  const handleDecrement = async (e) => {
    e.stopPropagation();
    if (isProcessing) return;
    const newQty = currentQty - 1;
    if (isLoggedIn) {
      if (newQty <= 0) {
        setL("remove", true);
        try {
          await dispatch(removeCartItem({ productId: String(cartItem?.productId?._id || cartItem?.productId), variantId: String(cartItem?.variantId), productSlug: product.slug })).unwrap();
          toast.info("Removed from cart");
        } catch (err) { toast.error(err?.message || "Failed to remove"); }
        finally { setL("remove", false); }
      } else {
        setL("update", true);
        try { await dispatch(updateCartItem({ productId: String(cartItem?.productId?._id || cartItem?.productId), variantId: String(cartItem?.variantId), quantity: newQty, productSlug: product.slug })).unwrap(); }
        catch (err) { toast.error(err?.message || "Failed to update"); }
        finally { setL("update", false); }
      }
    } else {
      if (newQty <= 0) { dispatch(removeGuestCartItem({ productSlug: product.slug, variantId: variant?._id?.toString() || "" })); toast.info("Removed from cart"); }
      else dispatch(updateGuestCartItem({ productSlug: product.slug, variantId: variant?._id?.toString() || "", quantity: newQty }));
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!product?.slug || localLoading.wishlist) return;
    setL("wishlist", true);
    try {
      if (isLoggedIn) {
        if (wishlisted) { await dispatch(removeFromWishlist({ productSlug: product.slug })).unwrap(); toast.success("Removed from wishlist", { icon: "💔" }); }
        else { await dispatch(addToWishlist({ productSlug: product.slug })).unwrap(); toast.success("Added to wishlist", { icon: "❤️" }); }
      } else {
        if (wishlisted) { dispatch(removeGuestItem(product.slug)); toast.success("Removed", { icon: "💔" }); }
        else { dispatch(addGuestItem(product.slug)); toast.success("Saved to wishlist", { icon: "❤️" }); }
      }
    } catch (err) { toast.error(err?.message || "Wishlist action failed"); }
    finally { setL("wishlist", false); }
  };

  const share = (type) => {
    const url = window.location.href;
    const map = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}`,
    };
    if (map[type]) window.open(map[type], "_blank");
    if (type === "instagram") { navigator?.clipboard?.writeText(url); alert("Link copied!"); }
  };  

  // ── guards ─────────────────────────────────────────────────────────────────
  if (isLoading) return <div className="bg-gray-50 min-h-screen"><Skeleton /></div>;
  if (fetchError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-gray-600 text-sm text-center max-w-sm">{fetchError?.message || "Product not found."}</p>
      <div className="flex gap-3">
        <button onClick={() => dispatch(fetchProductBySlug(slug))} className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"><RefreshCw size={14} /> Retry</button>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl"><ArrowLeft size={14} /> Go Back</button>
      </div>
    </div>
  );
  if (!product) return null;
  

  // ── RENDER ─────────────────────────────────────────────────────────────────
 return (
  <>
  <Breadcrumb product={product}/>
  <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-3 sm:space-y-4">
        {isVisible && (
  <div
  className="ImageCard fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex items-end"
  onClick={() => setisVisible(false)}
>
    
    {/* Sheet */}
   <div
  className="w-full bg-white rounded-t-3xl px-4 pt-4 pb-8 max-h-[92vh] overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
>
      
      {/* Handle + Header */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-800">
          {activeThumb + 1} / {images.length}
        </p>
        <button
          onClick={() => setisVisible(false)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
        >
          ✕
        </button>
      </div>

      {/* Main Big Image — NO ZOOM */}
      <div className="w-full flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden mb-4 relative"
        style={{ aspectRatio: "1/1" }}
      >
        {activeImg ? (
          <img
            src={activeImg}
            alt={title}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <Package size={48} className="text-gray-300" />
        )}

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveThumb((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-100"
            >
              ‹
            </button>
            <button
              onClick={() => setActiveThumb((p) => (p + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-100"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mb-5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`rounded-full transition-all duration-200 ${
                activeThumb === i
                  ? "w-4 h-2 bg-orange-400"
                  : "w-2 h-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail grid */}
      <div className="grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveThumb(i)}
            className={`rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square
              ${activeThumb === i
                ? "border-orange-400 shadow-md shadow-orange-100 scale-[1.04]"
                : "border-gray-200 hover:border-orange-300"
              }`}
          >
            <img src={img.url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

    </div>
  </div>
)}

        {/* ═══════════ MAIN PRODUCT CARD ═══════════ */}
        <div className="bg-gray-50 rounded-2xl sm:rounded-3xl overflow-hidden ">
          <div className="flex flex-col lg:grid lg:grid-cols-2">

            {/* ── LEFT: Image panel ── */}
            <div className="flex flex-row lg:border-r border-gray-100 gap-6">

              {/* ── Thumbnail sidebar ──
                  Mobile  : hidden (swipe main image instead)
                  Desktop : vertical scrollable column with prev/next arrows if > 5 images
              */}
              {images.length > 0 && (
                <div className="hidden lg:flex flex-col items-center gap-0 py-3 px-2 border-r border-gray-100 bg-gray-50 flex-shrink-0 w-[76px]">
                  {/* Up arrow */}
                  {images.length > 5 && (
                    <button
                      onClick={() => {
                        const el = document.getElementById("thumb-list");
                        if (el) el.scrollBy({ top: -70, behavior: "smooth" });
                      }}
                      className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex-shrink-0"
                    >
                      ▲
                    </button>
                  )}

                  {/* Scrollable thumb list */}
                  <div
                    id="thumb-list"
                    className="flex flex-col gap-2 overflow-y-auto scrollbar-hide flex-1"
                    style={{ maxHeight: 380 }}
                  >
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveThumb(i)}}
                        className={`flex-shrink-0 w-[56px] h-[56px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          activeThumb === i
                            ? "border-orange-400 shadow-md shadow-orange-100 scale-[1.04]"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <img src={img.url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Down arrow */}
                  {images.length > 5 && (
                    <button
                      onClick={() => {
                        const el = document.getElementById("thumb-list");
                        if (el) el.scrollBy({ top: 70, behavior: "smooth" });
                      }}
                      className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex-shrink-0"
                    >
                      ▼
                    </button>
                  )}
                </div>
              )}

              {/* ── Main image + mobile dot nav ── */}
              <div className="flex-1 flex flex-col">
                {/* Image box */}
              <div
  ref={containerRef}
  className="relative w-full cursor-pointer flex items-center justify-center overflow-hidden"
  style={{ aspectRatio: "4/5", maxHeight: 880 }}
   onClick={() => { if (isMobile) setisVisible(true); }}   // 👈 ADD THIS
  onMouseEnter={() => {
    if (isMobile) return;
    setShowZoom(true);
  }}
  onMouseLeave={() => {
    if (isMobile) return;
    setShowZoom(false);
  }}
  onMouseMove={!isMobile ? handleMouseMove : undefined}
>
  {/* Image */}
  {activeImg ? (
    <img
      src={activeImg}
      alt={title}
      className="w-full h-full object-cover p-4 sm:p-6"
    />
  ) : (
    <div>No image</div>
  )}

  {/* 🔥 AMAZON DOTTED LENS */}
  {showZoom && !isMobile && (
    <div
      ref={lensRef}
      className="absolute pointer-events-none"
      style={{
        width: "10rem",
        height: "11rem",
        transform: "translate(-50%, -50%)",

        backgroundColor: "rgba(163, 89, 223, 0.35)",
        backgroundImage: `radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)`,
        backgroundSize: "6px 6px",

        border: "1px solid rgba(0,0,0,0.2)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    />
  )}
</div>
{/* 🔥 RIGHT SIDE ZOOM (Amazon style) */}

                {/* Mobile dots */}
                {images.length > 1 && (
                  <div className="lg:hidden flex items-center justify-center gap-1.5 py-3">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveThumb(i)}
                        className={`rounded-full transition-all duration-200 ${
                          activeThumb === i
                            ? "w-4 h-2 bg-orange-400"
                            : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
                 {/* ── RIGHT: Info panel ── */}
            <div className="flex relative flex-col gap-3 p-4 sm:p-6 lg:p-7 overflow-y-auto scrollbar-hide lg:max-h-[560px]">
                  {showZoom && !isMobile && (
  <div
    ref={zoomRef}
    className="hidden lg:block w-[30rem] absolute z-10 h-[42rem] rounded-2xl shadow-lg bg-white"
    style={{
      backgroundImage: `url(${activeImg})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "250%",
      transition: "background-position 0.1s ease-out",
    }}
  />
)}

              {/* Title */}
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-snug tracking-tight">
                {title}
              </h1>

              {/* Brand + Rating */}
              <div className="flex flex-col flex-wrap gap-2">
                {brand && (
                  <span className="text-sm text-gray-500">
                    by <span className="text-orange-500 font-semibold">{brand}</span>
                  </span>
                )}
            <div className="flex items-center w-fit  px-1 py-2 rounded-lg gap-2 bg-gray-100">
              <div className="flex text-sm items-center gap-2">4.7 <Star size={14} fill="#F7C85C" className="text-[#F7C85C]"/></div>
              <div className="w-[1.5px] h-5 bg-zinc-300"></div>
              <div className="text-sm">3 Ratings</div>
            </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{fmt(salePrice)}</span>
                {hasDisc && (
                  <>
                    <span className="text-sm text-gray-400 line-through mb-0.5">{fmt(basePrice)}</span>
                    <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg mb-0.5">
                      {discPct}% OFF
                    </span>
                  </>
                )}
              </div>
              <div>
                <p className="font-medium text-zinc-900 flex items-center gap-1 text-sm"> <span className="font-bold text-[crimson] text-sm">{formatCount(soldInfo)} bought</span> in past month
</p>
              </div>
             <div className="flex flex-col gap-2">
               <div className="w-full h-px bg-gray-200"></div>
              {/* Share */}
            {/* ── Wishlist + Share bar ── */}
<div className="relative flex rounded-2xl overflow-visible bg-gray-50 mt-1">

  {/* Wishlist */}
  <button
    onClick={handleWishlist}
    disabled={localLoading.wishlist}
    className={`px-3 py-2 flex items-center gap-2 text-sm font-semibold transition-all duration-200 rounded-l-2xl active:scale-[0.98]
      ${wishlisted
        ? "text-red-500 bg-red-50"
        : "text-gray-600 hover:bg-gray-50 hover:text-red-400"
      } disabled:opacity-50`}
  >
    {localLoading.wishlist
      ? <Loader2 size={16} className="animate-spin" />
      : <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : ""} />}
    <span className="hidden sm:inline">
      {wishlisted ? "Wishlisted" : "Add to Wishlist"}
    </span>
    <span className="sm:hidden text-xs">
      {wishlisted ? "Wishlisted" : "Wishlist"}
    </span>
  </button>

  {/* Divider */}
  <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />

  {/* Share */}
  <div className="relative flex-shrink-0">
    <button
      onClick={(e) => { e.stopPropagation(); setShareOpen((v) => !v); }}
      className={`h-full py-3.5 px-5 sm:px-7 flex items-center gap-2 text-sm font-semibold transition-all duration-200 rounded-r-2xl active:scale-[0.98]
        ${shareOpen ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
    >
      <Share2 size={15} />
      <span>Share</span>
    </button>

    {/* Desktop popover */}
    {shareOpen && (
      <div className="hidden sm:flex absolute bottom-[calc(100%+12px)] right-0 items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-xl shadow-black/5 z-50 whitespace-nowrap">
        {/* Arrow */}
        <div className="absolute -bottom-[6px] right-8 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest pr-1">Share via</span>
        {[
          { type: "whatsapp",  Icon: IoLogoWhatsapp,  cls: "bg-green-500 hover:bg-green-600" },
          { type: "facebook",  Icon: IoLogoFacebook,  cls: "bg-blue-600 hover:bg-blue-700" },
          { type: "instagram", Icon: IoLogoInstagram, cls: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600" },
          { type: "telegram",  Icon: FaTelegram,      cls: "bg-sky-500 hover:bg-sky-600" },
        ].map(({ type, Icon, cls }) => (
          <button
            key={type}
            onClick={() => { share(type); setShareOpen(false); }}
            className={`w-9 h-9 rounded-full ${cls} text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    )}

    {/* Mobile overlay */}
    {shareOpen && (
      <div
        className="sm:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
        onClick={() => setShareOpen(false)}
      />
    )}

    {/* Mobile bottom sheet */}
    <div className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white z-50 px-6 pt-4 pb-10 transition-transform duration-300 ease-out
      ${shareOpen ? "translate-y-0" : "translate-y-full"}
      rounded-t-3xl shadow-2xl`}
    >
      {/* Drag handle */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <p className="text-center text-base font-bold text-gray-900 mb-6">Share this product</p>
      <div className="flex justify-center gap-6 sm:gap-10">
        {[
          { type: "whatsapp",  Icon: IoLogoWhatsapp,  cls: "bg-green-500", label: "WhatsApp" },
          { type: "facebook",  Icon: IoLogoFacebook,  cls: "bg-blue-600",  label: "Facebook" },
          { type: "instagram", Icon: IoLogoInstagram, cls: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600", label: "Instagram" },
          { type: "telegram",  Icon: FaTelegram,      cls: "bg-sky-500",   label: "Telegram" },
        ].map(({ type, Icon, cls, label }) => (
          <div key={type} className="flex flex-col items-center gap-2.5">
            <button
              onClick={() => { share(type); setShareOpen(false); }}
              className={`w-14 h-14 rounded-2xl ${cls} text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shadow-md`}
            >
              <Icon size={24} />
            </button>
            <span className="text-[11px] text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
 <div className="w-full h-px bg-gray-200"></div>
             </div>

              {lowStock && (
                <p className="text-xs text-orange-600 font-semibold flex items-center gap-1 -mt-1">
                  <AlertCircle size={12} /> Only {stock} left — hurry!
                </p>
              )}

              <div className="h-px bg-gray-100" />

              {/* Variant Attributes */}
              {attrKeys.length > 0 && (
                <div className="space-y-4">
                  {attrKeys.map((key) => (
                    <div key={key}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {key}
                        {selectedAttrs[key] && (
                          <span className="ml-2 normal-case font-semibold text-gray-800 tracking-normal">
                            : {selectedAttrs[key]}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getAllValues(key).map((val) => {
                          const avail  = isAvailable(key, val);
                          const active = selectedAttrs[key] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => avail && handleAttrSelect(key, val)}
                              disabled={!avail}
                              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-xl border-2 font-medium transition-all duration-150 ${
                                active
                                  ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                                  : avail
                                  ? "border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 bg-white"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Share
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Share</span>
                {[
                  { type: "whatsapp",  Icon: IoLogoWhatsapp,  cls: "bg-green-500" },
                  { type: "facebook",  Icon: IoLogoFacebook,  cls: "bg-blue-600" },
                  { type: "instagram", Icon: IoLogoInstagram, cls: "bg-pink-500" },
                  { type: "telegram",  Icon: FaTelegram,      cls: "bg-sky-500" },
                ].map(({ type, Icon, cls }) => (
                  <button key={type} onClick={() => share(type)}
                    className={`w-8 h-8 rounded-full ${cls} text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm`}>
                    <Icon size={15} />
                  </button>
                ))}
              </div> */}
              {/* Offers */}
<div className="h-px bg-gray-100" />

<div>
  <p className="text-lg font-bold text-gray-900 mb-3">Offers</p>
  <div className="flex flex-col divide-y divide-gray-100">
    {[
      { label: "Get Flat ₹100 OFF on orders above ₹2000", code: "100 OFB" },
      { label: "Get Flat ₹150 OFF on orders above ₹3000", code: "150 OFB" },
      { label: "Get Flat ₹50 OFF on orders above ₹1000",  code: "50 OFB"  },
    ].map(({ label, code }) => (
      <div key={code} className="flex items-start justify-between py-3 gap-3">
        <div className="flex items-start gap-2.5">
          <Tag size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Use code - <span className="font-semibold text-gray-600">{code}</span>
            </p>
          </div>
        </div>
        <button className="text-sm font-semibold text-red-500 flex-shrink-0 hover:text-red-600 transition-colors">
          Details
        </button>
      </div>
    ))}
  </div>
  <p className="text-[11px] text-gray-400 mt-1">*Coupons can be applied at checkout</p>
</div>

              <div className="h-px bg-gray-100" />

              {/* ── CTAs ── */}
              <div className="space-y-3">
                {!inStock && (
                  <div className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 text-center">
                    Out of Stock
                  </div>
                )}

                {inStock && isInCart && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden">
                      <button onClick={handleDecrement} disabled={isProcessing}
                        className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40">
                        {localLoading.remove ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
                      </button>
                      <div className="w-11 h-11 flex items-center justify-center text-base font-bold text-gray-900 border-x-2 border-gray-200">
                        {localLoading.update ? <Loader2 size={16} className="animate-spin" /> : currentQty}
                      </div>
                      <button onClick={handleIncrement} disabled={isAtMaxStock || isProcessing}
                        className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition disabled:opacity-40">
                        {localLoading.update ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      </button>
                    </div>
                    {isAtMaxStock && <p className="text-xs text-orange-500 font-medium">Max stock reached</p>}
                  </div>
                )}

                {inStock && (
                  <div className="flex gap-3">
                    {!isInCart && (
                      <button onClick={handleAddToCart} disabled={localLoading.add}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200 active:scale-[.98] disabled:opacity-60">
                        {localLoading.add
                          ? <><Loader2 size={16} className="animate-spin" />Adding…</>
                          : <><ShoppingCart size={16} />Add to Cart</>}
                      </button>
                    )}
                    <button className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all duration-200 active:scale-[.98] flex items-center justify-center gap-2 shadow-lg shadow-orange-100">
                      Buy Now
                    </button>
                  </div>
                )}
              </div>

            </div>{/* end right */}


              {/* ═══════════ DESCRIPTION ═══════════ */}
      <div className="bg-gray-50 rounded-2xl mt-10 sm:rounded-3xl overflow-hidden">
  <button
    onClick={() => setOpenDesc((v) => !v)}
    className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition text-left"
  >
    <span className="font-semibold text-sm sm:text-base text-gray-800">
      Product Description
    </span>
    <span className="text-xl text-gray-400 font-light select-none">
      {openDesc ? "−" : "+"}
    </span>
  </button>

  {openDesc && (
    <div className="px-4 sm:px-6 pb-5 border-t border-gray-100 text-sm text-gray-600 space-y-4">

      {/* Title */}
      <p className="font-semibold text-gray-800 pt-4">
        {product?.title}
      </p>

      {/* Description */}
      <p className="leading-relaxed">
        {product?.description}
      </p>

      {/* Attributes as bullets */}
      {product?.attributes?.length > 0 && (
        <div>
          <p className="font-semibold text-gray-800">Highlights:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-1">
            {product.attributes.map((attr, i) => (
              <li key={i}>
                <span className="font-medium">{attr.key}:</span> {attr.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dimensions Section */}
      {product?.shipping && (
        <div>
          <p className="font-semibold text-gray-800">Dimensions:</p>
          <div className="grid grid-cols-2 gap-y-1 text-sm mt-1">
            <span>Weight:</span>
            <span>{product.shipping.weight} kg</span>

            <span>Length:</span>
            <span>{product.shipping.dimensions.length} cm</span>

            <span>Width:</span>
            <span>{product.shipping.dimensions.width} cm</span>

            <span>Height:</span>
            <span>{product.shipping.dimensions.height} cm</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 text-xs text-gray-400 border-t border-gray-100">
        Country Of Origin: China &nbsp;|&nbsp; GST: 18%
      </div>
    </div>
  )}
</div>
            </div>
          </div>
        </div>{/* end main card */}

        {/* ═══════════ DELIVERY + TRUST ═══════════ */}
        {/* <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm px-4 sm:px-6 py-5 sm:py-6">
          <p className="text-sm text-gray-600 mb-4">
            Order within <span className="text-red-500 font-bold">8 hrs 34 mins</span> for{" "}
            <span className="font-semibold text-gray-800">One-day Dispatch</span>
          </p>

          <div className="flex items-center mb-6">
            {[
              { icon: <ShoppingCart size={15} />, top: "Today",    bot: "Order",     color: "bg-gray-900" },
              { icon: <Package size={15} />,      top: "Tomorrow", bot: "Ready",     color: "bg-gray-900" },
              { icon: <CheckCircle2 size={15} />, top: "2–3 Days", bot: "Delivered", color: "bg-green-500" },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1 min-w-0 flex-1 sm:flex-none sm:min-w-[90px]">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white ${step.color} shadow-sm`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 text-center">{step.top}</span>
                  <span className="text-[9px] sm:text-[11px] text-gray-400 text-center">{step.bot}</span>
                </div>
                {i < 2 && <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 mx-1 mb-5" />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: <ShieldCheck size={18} className="text-blue-500" />, label: "100% Secure Payments" },
              { icon: <RotateCcw size={18} className="text-purple-500" />, label: "Easy Returns & Refunds" },
              { icon: <Truck size={18} className="text-green-500" />,      label: "Fast Delivery" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gray-50">
                {b.icon}
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* ═══════════ RELATED PRODUCTS ═══════════ */}
        {related?.length > 0 && (
          <div className="pb-4">
            <div className="flex items-center mt-28 justify-between mb-1">
              <h2 className="text-base sm:text-2xl font-bold text-gray-900">Customers who bought this item also bought</h2>
              <button className="hidden sm:flex text-xs sm:text-sm text-gray-400 hover:text-orange-500 sm:items-center gap-1 transition font-medium">
                View all <ArrowRight size={13} />
              </button>
            </div>
            <div className="w-full h-px bg-zinc-400">
              <div className="w-full sm:w-1/2 h-full bg-[crimson]"></div>
            </div>
            <div className="grid grid-cols-2 mt-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {related.map((p) => <RelatedCard key={p._id || p.slug} product={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  
  </>
  );
};

export default ProductUI;