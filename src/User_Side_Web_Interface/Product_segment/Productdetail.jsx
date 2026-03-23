import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Star, Share2, Heart, Minus, Plus, ShoppingCart,
  Zap, ChevronRight, Info, CheckCircle2, Truck,
  AlertCircle, RefreshCw, Check, ArrowLeft,
  BaggageClaimIcon,
  Eye,
} from "lucide-react";

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

// ─────────────────────────────────────────────────────────────────────────────
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

const logError = (ctx, err, info = {}) => {
  // console.group(`🔴 [ProductDetail] ${ctx}`);
  console.error(err);
  // console.log(info);
  console.groupEnd();
};

// color name → hex for swatch buttons
const COLOR_HEX = {
  white: "#ffffff", black: "#1a1a1a", red: "#ef4444",
  blue: "#3b82f6", yellow: "#eab308", green: "#22c55e",
  pink: "#ec4899", purple: "#a855f7", orange: "#f97316",
  gray: "#9ca3af", grey: "#9ca3af", brown: "#92400e",
  navy: "#1e3a5f", silver: "#c0c0c0", gold: "#ffd700",
};

// ─────────────────────────────────────────────────────────────────────────────
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
        {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
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

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ProductDetail
// ─────────────────────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // local UI state
  const [qty,           setQty]           = useState(1);
  const [activeThumb,   setActiveThumb]   = useState(0);
  const [wishlisted,    setWishlisted]    = useState(false);
  const [addedToCart,   setAddedToCart]   = useState(false);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [showDesc,      setShowDesc]      = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState({});  // { Color: "White", Size: "M" }

  // redux
  const product      = useSelector(selectCurrentProduct);
  const related      = useSelector(selectRelatedProducts);
  const loadingMap   = useSelector(selectProductsLoading);
  const errorMap     = useSelector(selectProductsError);
  const isLoading    = loadingMap.product;
  const fetchError   = errorMap.product;

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

  const handleAddToCart = () => {
    if (!inStock || !product) return;
    // 🔌 dispatch(addItemToCart({ product, variant: selectedVariant, qty }))
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
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

  // ── main render ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white font-sans antialiased text-[#0F1111] cursor-default mt-10">

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <nav className="text-xs flex items-center gap-1 text-gray-600 flex-wrap">
          <Link to="/" className="hover:text-[#f7a221] hover:underline">Home</Link>
          <ChevronRight size={12} />
          {catName && catSlug && (
            <>
              <Link to={`/category/${catSlug}`} className="hover:text-[#f7a221] hover:underline capitalize">
                {catName}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-gray-500 truncate max-w-[180px] md:max-w-none">{title}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══ COL 1 — IMAGE GALLERY ══════════════════════════════════════ */}
          <div className="lg:col-span-5">
            <div className="flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-6">

              {/* Thumbnails — from selectedVariant.images[] */}
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[500px] pb-2 md:pb-0">
                {images.length > 0
                  ? images.map((img, i) => (
                      <button
                        key={img.publicId ?? i}
                        onMouseEnter={() => setActiveThumb(i)}
                        onClick={() => setActiveThumb(i)}
                        className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 border rounded p-1 bg-white transition-all ${
                          activeThumb === i
                            ? "border-[#f7a221] ring-1 ring-[#f7a221]"
                            : "border-gray-300 hover:border-[#f7a221]"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.altText || `${title} ${i + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))
                  : (
                      <div className="w-12 h-12 border border-gray-200 rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-300 text-[8px]">—</span>
                      </div>
                    )
                }
              </div>

              {/* Main image */}
              <div className="flex-1 bg-white border border-gray-100 rounded flex items-center justify-center p-4 min-h-[350px] md:min-h-[450px]">
                {activeImg
                  ? <img
                      src={activeImg}
                      alt={images[activeThumb]?.altText || title}
                      key={activeImg}                    /* key forces re-render on src change */
                      className="max-w-full max-h-[450px] object-contain"
                    />
                  : <span className="text-gray-300 text-sm">No Image</span>
                }
              </div>
            </div>
          </div>

          {/* ══ COL 2 — PRODUCT INFO ═══════════════════════════════════════ */}
          <div className="lg:col-span-4">

            {/* Title */}
            <div className="mb-2">
              <h1 className="text-xl md:text-2xl font-medium leading-tight tracking-tight mb-1">{title}</h1>
              {brand && (
                <span className="text-[#007185] text-sm hover:text-[#C7511F] hover:underline cursor-pointer">
                  {brand}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i} size={16}
                    fill={i < Math.floor(rating) ? "#f7a221" : "none"}
                    className={i >= rating ? "text-gray-300" : "text-[#f7a221]"}
                  />
                ))}
              </div>
              <span className="text-[#007185] text-sm">{ratingCnt} ratings</span>
            </div>

            {/* FOMO — only when admin enables it */}
            {(showFomo || showSold) && (
              <div className="p-3 mb- flex items-start gap-3">
                <BaggageClaimIcon size={18} className="text-[#f7a221] fill-[] mt-0.5 flex-shrink-0" />
                <div>
                  {showSold && (
                    <p className="text-sm font-semibold text-orange-900">
                      {product.soldInfo.count} people bought this recently
                    </p>
                  )}
                  {showFomo && (
                    <p className="text-xs text-orange-700">
                      {product.fomo.viewingNow} people are currently viewing this item
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price — from selectedVariant, no /100 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {hasDisc && discPct && (
                  <span className="text-red-600 text-2xl font-light">-{discPct}%</span>
                )}
                <div className="flex items-start gap-0.5">
                  <span className="text-sm mt-1 font-medium">₹</span>
                  <span className="text-3xl font-medium">
                    {salePrice != null
                      ? new Intl.NumberFormat("en-IN").format(salePrice)
                      : "—"}
                  </span>
                </div>
              </div>
              {hasDisc && (
                <div className="text-gray-500 text-sm mt-0.5">
                  M.R.P.: <span className="line-through">{fmt(basePrice)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-green-700" />
                <span>Inclusive of all taxes</span>
              </div>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${inStock ? "text-[#007600]" : "text-red-500"}`}>
                {!inStock ? "Out of Stock" : lowStock ? `Only ${stock} left!` : "In Stock"}
              </span>
            </div>

            <hr className="mb-4" />

            {/* ── Variant selectors ─────────────────────────────────── */}
            {attrKeys.length > 0 && (
              <div className="mb-5 space-y-4">
                {attrKeys.map((key) => {
                  const values  = getAllValues(key);
                  const selVal  = selectedAttrs[key];
                  const isColor = key.toLowerCase() === "color";

                  return (
                    <div key={key}>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {key}{selVal && <span className="ml-2 text-[#f7a221] font-normal">: {selVal}</span>}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const isSel   = selVal === val;
                          const canClick = isAvailable(key, val);
                          const hex     = isColor ? COLOR_HEX[val.toLowerCase()] : null;

                          if (isColor && hex) {
                            return (
                              <button
                                key={val}
                                title={val}
                                onClick={() => canClick && handleAttrSelect(key, val)}
                                disabled={!canClick}
                                className={`w-8 h-8 rounded-full border-2 relative transition-all ${
                                  isSel ? "border-[#f7a221] scale-110 shadow-md"
                                    : canClick ? "border-gray-300 hover:border-gray-600 hover:scale-105"
                                    : "border-gray-200 opacity-40 cursor-not-allowed"
                                }`}
                                style={{ backgroundColor: hex }}
                              >
                                {isSel && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <Check size={13} className={hex === "#ffffff" ? "text-gray-800" : "text-white"} />
                                  </span>
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={val}
                              onClick={() => canClick && handleAttrSelect(key, val)}
                              disabled={!canClick}
                              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all ${
                                isSel ? "border-[#f7a221] bg-orange-50 text-[#f7a221]"
                                  : canClick ? "border-gray-300 text-gray-700 hover:border-gray-500"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Description dropdown ──────────────────────────────── */}
            <div className="mb-5">
              <div
                onClick={() => setShowDesc((p) => !p)}
                className="flex items-center justify-between cursor-pointer py-2 border-t border-b border-gray-100"
              >
                <h3 className="font-bold text-sm">Description</h3>
                {showDesc ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              {showDesc && desc && (
                <p className="text-sm leading-relaxed text-gray-700 mt-3">{desc}</p>
              )}
            </div>

            {/* ── Technical details table ───────────────────────────── */}
            {(specs.length > 0 || shipping?.weight != null) && (
              <div className="mb-5 border rounded-lg overflow-hidden border-gray-200">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-sm">
                  Technical Details
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={s._id ?? i} className="border-b border-gray-100">
                        <td className="px-4 py-2 bg-gray-50 font-semibold w-1/2">{s.key}</td>
                        <td className="px-4 py-2">{s.value}</td>
                      </tr>
                    ))}
                    {shipping?.weight != null && (
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2 bg-gray-50 font-semibold">Weight (kg)</td>
                        <td className="px-4 py-2">{shipping.weight}</td>
                      </tr>
                    )}
                    {shipping?.dimensions?.length != null && (
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2 bg-gray-50 font-semibold">Length (cm)</td>
                        <td className="px-4 py-2">{shipping.dimensions.length}</td>
                      </tr>
                    )}
                    {shipping?.dimensions?.width != null && (
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2 bg-gray-50 font-semibold">Width (cm)</td>
                        <td className="px-4 py-2">{shipping.dimensions.width}</td>
                      </tr>
                    )}
                    {shipping?.dimensions?.height != null && (
                      <tr>
                        <td className="px-4 py-2 bg-gray-50 font-semibold">Height (cm)</td>
                        <td className="px-4 py-2">{shipping.dimensions.height}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ══ COL 3 — BUY BOX (sticky) ═══════════════════════════════════ */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 lg:sticky lg:top-6 bg-white shadow-sm">

              {/* Total price × qty */}
              <div className="text-2xl font-medium mb-1">
                {salePrice != null ? fmt(salePrice * qty) : "—"}
              </div>
              <div className={`text-sm font-medium mb-4 ${inStock ? "text-[#007600]" : "text-red-500"}`}>
                {inStock ? "In stock" : "Out of stock"}
              </div>

              {/* Qty */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-bold">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-8 shadow-sm">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 bg-gray-100 hover:bg-gray-200 border-r border-gray-300"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 font-bold text-sm">{qty}</span>
                  <button
                    onClick={() => setQty((q) => stock != null ? Math.min(stock, q + 1) : q + 1)}
                    disabled={stock != null && qty >= stock}
                    className="px-3 bg-gray-100 hover:bg-gray-200 border-l border-gray-300 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="space-y-3 mb-5">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`w-full py-2 rounded-full flex items-center justify-center gap-2 font-medium text-sm shadow-sm active:scale-95 transition-all ${
                    addedToCart ? "bg-green-500 text-white"
                      : inStock ? "text-[#0F1111] hover:opacity-90"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  style={!addedToCart && inStock ? { backgroundColor: "hsla(192,37%,62%,0.57)" } : {}}
                >
                  {addedToCart ? <><Check size={16} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
                </button>
                <button
                  disabled={!inStock}
                  className="w-full py-2 rounded-full flex items-center justify-center gap-2 font-medium text-sm text-black active:scale-95 shadow-sm disabled:opacity-40"
                  style={{ backgroundColor: "#FFA41C" }}
                >
                  <Zap size={18} /> Buy Now
                </button>
              </div>

              {/* Delivery info */}
              <div className="text-xs text-gray-600 space-y-2 mb-5">
                <div className="flex items-center gap-2"><Truck size={13} /> FREE delivery on orders above ₹799</div>
                <div className="flex items-center gap-2"><Info size={13} /> Secure transaction</div>
              </div>

              {/* Wishlist + Share */}
              <div className="pt-4 border-t flex items-center gap-4 justify-center">
                <button
                  onClick={() => setWishlisted((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-500 group"
                >
                  <Heart size={18} className={wishlisted ? "fill-red-500 text-red-500" : "group-hover:scale-110 transition-transform"} />
                  {wishlisted ? "Saved" : "Add to Wish List"}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShareOpen((p) => !p)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#007185]"
                  >
                    <Share2 size={18} /> Share
                  </button>
                  {shareOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 shadow-xl rounded-lg py-2 z-50">
                      {[
                        { type: "whatsapp",  label: "WhatsApp",  color: "#16a34a" },
                        { type: "facebook",  label: "Facebook",  color: "#2563eb" },
                        { type: "instagram", label: "Instagram", color: "#ec4899" },
                        { type: "telegram",  label: "Telegram",  color: "#3b82f6" },
                      ].map(({ type, label, color }) => (
                        <button
                          key={type}
                          onClick={() => share(type)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <span className="font-bold text-xs w-4" style={{ color }}>{label[0]}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>{/* end grid */}

        {/* ── Related products ─────────────────────────────────────────────── */}
        {related?.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => <RelatedCard key={p._id || p.slug} product={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;