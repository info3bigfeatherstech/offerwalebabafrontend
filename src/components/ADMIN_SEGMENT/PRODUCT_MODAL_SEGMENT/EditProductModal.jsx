import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductFormBody from "../Shared_components/ProductFormBody";
import VariantModal, { defaultVariant } from "../Shared_components/VariantModal";
import CategoryModal from "../Shared_components/CategoryModal";
import BrandModal from "../Shared_components/BrandModal";
import AttributeModal from "../Shared_components/AttributeModal";
import CustomMessageModal from "../Shared_components/CustomMessageModal";
import {
  updateProduct,
  resetUpdateSuccess,
  addVariantToProduct,updateVariantByBarcode
} from "../ADMIN_REDUX_MANAGEMENT/adminProductsSlice";

// ─────────────────────────────────────────────────────────────────────────────
//  toFormData — convert a backend product document to local form state
//  FIXED: Now properly loads main product images
// ─────────────────────────────────────────────────────────────────────────────
const toFormData = (product) => {
  console.log("🔄 Converting product to form data:", {
    productName: product.name,
    hasImages: !!product.images,
    imagesCount: product.images?.length || 0,
    images: product.images // Log the actual images
  });

  return {
    name:        product.name        || "",
    title:       product.title       || "",
    description: product.description || "",
    brand:       product.brand       || "Generic",
    category:
      typeof product.category === "object" && product.category !== null
        ? product.category._id
        : product.category || "",
    // product-level barcode — display-only, NOT persisted to backend
    // (backend has no product.barcode field — only variants have barcodes)
    barcode: product.barcode || "",
    price: {
      base:      product.priceRange?.min ?? product.variants?.[0]?.price?.base ?? "",
      sale:      product.variants?.[0]?.price?.sale ?? "",
      costPrice: product.price?.costPrice || "",
    },
    inventory: product.inventory || { quantity: 0, lowStockThreshold: 5, trackInventory: true },
    shipping:  product.shipping  || { weight: 0, dimensions: { length: "", width: "", height: "" } },
    soldInfo:  product.soldInfo  || { enabled: false, count: 0 },
    fomo:      product.fomo      || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" },
    
    // ✅ FIXED: Properly load main product images with stable IDs
    images:    (product.images || []).map((img, index) => {
      console.log(`📸 Loading main product image ${index}:`, img.url);
      return {
        ...img,
        id: img._id || img.publicId || img.url || `main-img-${index}-${Date.now()}`,  // stable UI key
        isMain: img.isMain || index === 0, // First image is main if not specified
      };
    }),
    
    attributes: product.attributes || [],
    
    // Full variant objects preserved — barcode + sku + all DB fields kept intact
    variants: (product.variants || []).map((v, vIdx) => {
      console.log(`🎨 Loading variant ${vIdx} images:`, v.images?.length || 0);
      return {
        ...v,
        barcode:  v.barcode,              // number from DB — preserved exactly
        sku:      v.sku,                  // auto-generated string — preserved exactly
        price:    { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
        // Normalise existing DB images so UI can render them (they have url but no File)
        images:   (v.images || []).map((img, iIdx) => ({
          ...img,
          id: img._id || img.publicId || img.url || `var-${vIdx}-img-${iIdx}-${Date.now()}`,  // stable UI key
        })),
        isActive: v.isActive !== false,
      };
    }),
    isFeatured: product.isFeatured || false,
    status:     product.status     || "draft",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  syncVariants — map backend variants back to form state after any API save
// ─────────────────────────────────────────────────────────────────────────────
const syncVariants = (updatedProduct) =>
  (updatedProduct.variants || []).map((v, vIdx) => ({
    ...v,
    barcode:  v.barcode,
    sku:      v.sku,
    price:    { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
    images:   (v.images || []).map((img, iIdx) => ({
      ...img,
      id: img._id || img.publicId || img.url || `var-${vIdx}-img-${iIdx}-${Date.now()}`,
    })),
    isActive: v.isActive !== false,
  }));

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────
const EditProductModal = ({
  product,
  onClose,
  brands,
  setBrands,
  formatIndianRupee,
  getDiscountPercentage,
}) => {
  const dispatch = useDispatch();
  const { updateLoading, updateError, updateSuccess, actionLoading, actionError } =
    useSelector((s) => s.adminProducts);
  const { categories } = useSelector((s) => s.categories);

  // Log the incoming product
  console.log("📦 EditProductModal received product:", {
    name: product.name,
    mainImagesCount: product.images?.length || 0,
    mainImages: product.images,
    variantsCount: product.variants?.length || 0,
  });

  const [formData,            setFormData]            = useState(() => toFormData(product));
  const [variantForm,         setVariantForm]         = useState(defaultVariant);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [variantSaving,       setVariantSaving]       = useState(false);
  const [variantSaveError,    setVariantSaveError]    = useState(null);

  const [showCategoryModal,      setShowCategoryModal]      = useState(false);
  const [showBrandModal,         setShowBrandModal]         = useState(false);
  const [showAttributeModal,     setShowAttributeModal]     = useState(false);
  const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
  const [showVariantModal,       setShowVariantModal]       = useState(false);

  // Log formData after it's set
  useEffect(() => {
    console.log("📋 formData after conversion:", {
      mainImagesCount: formData.images?.length || 0,
      mainImages: formData.images,
      variantsCount: formData.variants?.length || 0,
    });
  }, [formData]);

  // Keep a stable ref to formData for use inside toggleVariantActive async callback
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Re-sync when the product prop changes (Redux updates it after operations)
  useEffect(() => { 
    console.log("🔄 Product prop changed, re-syncing form data");
    setFormData(toFormData(product)); 
  }, [product._id]);

  // Close modal when full product save succeeds
  useEffect(() => {
    if (updateSuccess) { dispatch(resetUpdateSuccess()); onClose(); }
  }, [updateSuccess]);

  // ── Variant modal helpers ──────────────────────────────────────────────────

  const openAddVariant = () => {
    setVariantForm(defaultVariant);
    setEditingVariantIndex(null);
    setVariantSaveError(null);
    setShowVariantModal(true);
  };

  const openEditVariant = (index) => {
    const v = formData.variants[index];
    console.log(`✏️ Opening edit for variant ${index}:`, {
      barcode: v.barcode,
      imagesCount: v.images?.length || 0,
      images: v.images
    });
    
    setVariantForm({
      barcode:   v.barcode != null ? String(v.barcode) : "",
      attributes: v.attributes?.length > 0
        ? v.attributes.map((a) => ({ key: a.key || "", value: a.value || "" }))
        : [{ key: "", value: "" }],
      price:     { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
      inventory: {
        quantity:          v.inventory?.quantity          ?? 0,
        lowStockThreshold: v.inventory?.lowStockThreshold ?? 5,
        trackInventory:    v.inventory?.trackInventory    !== false,
      },
      // Pass existing DB images so VariantModal can display them
      // These have .url but no .file (File object)
      images:   v.images || [],
      isActive: v.isActive !== false,
    });
    setEditingVariantIndex(index);
    setVariantSaveError(null);
    setShowVariantModal(true);
  };

  const closeVariantModal = () => {
    setShowVariantModal(false);
    setVariantForm(defaultVariant);
    setEditingVariantIndex(null);
    setVariantSaveError(null);
  };

  // ── handleVariantSave ──────────────────────────────────────────────────────
  const handleVariantSave = async (variantToSave) => {
    setVariantSaveError(null);

    if (editingVariantIndex !== null) {
      // EDIT EXISTING VARIANT
      setVariantSaving(true);

      const existingVariant = formData.variants[editingVariantIndex];

      try {
        const result = await dispatch(
          updateVariantByBarcode({
            slug: product.slug,
            barcode: existingVariant.barcode,
            attributes: variantToSave.attributes,
            price: variantToSave.price,
            inventory: variantToSave.inventory,
            images: variantToSave.images,
            isActive: variantToSave.isActive,
          })
        ).unwrap();

        const updatedProduct = result?.product || result;
        if (updatedProduct?.variants) {
          setFormData((prev) => ({ 
            ...prev, 
            variants: updatedProduct.variants.map(v => ({
              ...v,
              price: { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
              images: v.images || [],
            }))
          }));
        }
        closeVariantModal();
      } catch (err) {
        console.error("[EditProductModal] edit variant failed:", err);
        setVariantSaveError(typeof err === "string" ? err : err?.message || "Failed to save variant");
      } finally {
        setVariantSaving(false);
      }
    } else {
      // ADD NEW VARIANT
      setVariantSaving(true);
      try {
        const result = await dispatch(
          addVariantToProduct({ slug: product.slug, variantData: variantToSave })
        ).unwrap();

        const updatedProduct = result?.product || result;
        if (updatedProduct?.variants) {
          setFormData((prev) => ({ ...prev, variants: updatedProduct.variants }));
        }
        closeVariantModal();
      } catch (err) {
        console.error("[EditProductModal] add variant failed:", err);
        setVariantSaveError(typeof err === "string" ? err : err?.message || "Failed to add variant");
      } finally {
        setVariantSaving(false);
      }
    }
  };
  
  // ── toggleVariantActive ────────────────────────────────────────────────────
  const toggleVariantActive = async (index) => {
    const optimisticVariants = formData.variants.map((v, i) =>
      i === index ? { ...v, isActive: !v.isActive } : v
    );
    setFormData((prev) => ({ ...prev, variants: optimisticVariants }));

    try {
      const result = await dispatch(
        updateProduct({
          slug:     product.slug,
          formData: { ...formDataRef.current, variants: optimisticVariants },
          silent:   true,
        })
      ).unwrap();

      const updatedProduct = result?.product || result;
      if (updatedProduct?.variants) {
        setFormData((prev) => ({ ...prev, variants: syncVariants(updatedProduct) }));
      }
    } catch (err) {
      console.error("[EditProductModal] toggleVariantActive failed:", err);
      setFormData((prev) => ({
        ...prev,
        variants: formDataRef.current.variants,
      }));
    }
  };

  // ── Other handlers ─────────────────────────────────────────────────────────
  const handleAddAttribute   = (a)   => setFormData((prev) => ({ ...prev, attributes: [...prev.attributes, a] }));
  const removeAttribute      = (id)  => setFormData((prev) => ({ ...prev, attributes: prev.attributes.filter((a) => a.id !== id) }));
  const handleCustomMessageSave = (msg) => setFormData((prev) => ({ ...prev, fomo: { ...prev.fomo, customMessage: msg } }));

  // ── Full product save ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim())  { alert("Product name is required");  return; }
    if (!formData.title.trim()) { alert("Product title is required"); return; }
    if (!formData.category)     { alert("Please select a category");  return; }
    dispatch(updateProduct({ slug: product.slug, formData }));
  };

  const isAnySaving = variantSaving || actionLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">

        {/* ── Header ── */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">{product.name}</span>
              <span className="ml-2 text-xs text-indigo-400 font-mono">{product.slug}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Error banners ── */}
        {updateError && !variantSaving && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">❌ {updateError}</p>
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">❌ {actionError}</p>
          </div>
        )}

        {/* ── Saving indicator ── */}
        {isAnySaving && (
          <div className="mx-6 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-indigo-700 text-sm font-medium">Saving to database...</p>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6">
          <ProductFormBody
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            brands={brands}
            onOpenCategoryModal={() => setShowCategoryModal(true)}
            onOpenBrandModal={() => setShowBrandModal(true)}
            onOpenAttributeModal={() => setShowAttributeModal(true)}
            onOpenCustomMessage={() => setShowCustomMessageModal(true)}
            onOpenAddVariant={openAddVariant}
            onOpenEditVariant={openEditVariant}
            onRemoveAttribute={removeAttribute}
            onDeleteVariant={() => {}}              // edit mode: ProductFormBody handles delete via productSlug
            onToggleVariantActive={toggleVariantActive}
            formatIndianRupee={formatIndianRupee}
            getDiscountPercentage={getDiscountPercentage}
            productSlug={product.slug}              // enables direct API delete inside ProductFormBody
          />

          <div className="flex gap-3 mt-6">
            <button
              type="button" onClick={onClose} disabled={updateLoading || isAnySaving}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={updateLoading || isAnySaving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {updateLoading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Sub-modals ── */}
      {showCategoryModal && (
        <CategoryModal
          onSelect={(catId) => setFormData((p) => ({ ...p, category: catId }))}
          onClose={() => setShowCategoryModal(false)} />
      )}
      {showBrandModal && (
        <BrandModal
          brands={brands} setBrands={setBrands}
          onSelect={(brand) => setFormData((p) => ({ ...p, brand }))}
          onClose={() => setShowBrandModal(false)} />
      )}
      {showAttributeModal && (
        <AttributeModal onAdd={handleAddAttribute} onClose={() => setShowAttributeModal(false)} />
      )}
      {showCustomMessageModal && (
        <CustomMessageModal
          currentMessage={formData.fomo.customMessage}
          onSave={handleCustomMessageSave}
          onClose={() => setShowCustomMessageModal(false)} />
      )}
      {showVariantModal && (
        <VariantModal
          variantForm={variantForm}
          setVariantForm={setVariantForm}
          editingVariantIndex={editingVariantIndex}
          onSave={handleVariantSave}
          onClose={closeVariantModal}
          getDiscountPercentage={getDiscountPercentage}
          isSaving={variantSaving}
          saveError={variantSaveError} />
      )}
    </div>
  );
};

export default EditProductModal;
// fixed some other issue like barcode issue not update product properlly

// // PRODUCT_MODAL_SEGMENT/EditProductModal.jsx
// //
// // VARIANT OPS IN EDIT MODE — all hit real API:
// //  ADD    → addVariantToProduct  → POST /admin/products/:slug/variants
// //  DELETE → deleteVariantFromProduct → DELETE /admin/products/:slug/variants (via ProductFormBody)
// //  EDIT   → updateVariantByBarcode   → PUT /admin/products/:slug { barcode, price, inventory }
// //
// // After every variant API call the backend returns the full updated product.
// // We sync formData.variants from that response so UI stays in sync with DB.

// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import ProductFormBody from "../Shared_components/ProductFormBody";
// import VariantModal, { defaultVariant } from "../Shared_components/VariantModal";
// import CategoryModal from "../Shared_components/CategoryModal";
// import BrandModal from "../Shared_components/BrandModal";
// import AttributeModal from "../Shared_components/AttributeModal";
// import CustomMessageModal from "../Shared_components/CustomMessageModal";
// import {
//   updateProduct, resetUpdateSuccess,
//   addVariantToProduct, updateVariantByBarcode,
// } from "../ADMIN_REDUX_MANAGEMENT/adminProductsSlice";

// // Convert backend product → local formData shape
// const toFormData = (product) => ({
//   name:        product.name        || "",
//   title:       product.title       || "",
//   description: product.description || "",
//   brand:       product.brand       || "Generic",
//   category:    typeof product.category === "object" && product.category !== null
//                  ? product.category._id
//                  : product.category || "",
//   barcode:     product.barcode     || "",
//   price: {
//     base:      product.priceRange?.min ?? product.variants?.[0]?.price?.base ?? "",
//     sale:      product.variants?.[0]?.price?.sale ?? "",
//     costPrice: product.price?.costPrice || "",
//   },
//   inventory: product.inventory || { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//   shipping:  product.shipping  || { weight: 0, dimensions: { length: "", width: "", height: "" } },
//   soldInfo:  product.soldInfo  || { enabled: false, count: 0 },
//   fomo:      product.fomo      || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" },
//   images:    product.images    || [],
//   attributes: product.attributes || [],
//   // Keep full variant objects from backend — barcode + sku preserved
//   variants: (product.variants || []).map(v => ({
//     ...v,
//     price:  { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
//     images: v.images || [],
//   })),
//   isFeatured: product.isFeatured || false,
//   status:     product.status     || "draft",
// });

// // Sync formData.variants from an updated backend product response
// const syncVariants = (updatedProduct) =>
//   (updatedProduct.variants || []).map(v => ({
//     ...v,
//     price:  { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
//     images: v.images || [],
//   }));

// const EditProductModal = ({ product, onClose, brands, setBrands, formatIndianRupee, getDiscountPercentage }) => {
//   const dispatch = useDispatch();
//   const { updateLoading, updateError, updateSuccess, actionLoading, actionError } =
//     useSelector(s => s.adminProducts);
//   const { categories } = useSelector(s => s.categories);

//   const [formData, setFormData] = useState(() => toFormData(product));
//   const [variantForm, setVariantForm] = useState(defaultVariant);
//   const [editingVariantIndex, setEditingVariantIndex] = useState(null);
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showVariantModal, setShowVariantModal] = useState(false);

//   // Re-sync if product prop changes
//   useEffect(() => { setFormData(toFormData(product)); }, [product._id]);

//   // Close on full-product update success
//   useEffect(() => {
//     if (updateSuccess) { dispatch(resetUpdateSuccess()); onClose(); }
//   }, [updateSuccess]);

//   // ── Variant modal openers ─────────────────────────────────────
//   const openAddVariant = () => {
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//     setShowVariantModal(true);
//   };

//   const openEditVariant = (index) => {
//     const v = formData.variants[index];
//     setVariantForm({
//       barcode:    v.barcode != null ? String(v.barcode) : "",
//       attributes: v.attributes?.length > 0 ? v.attributes : [{ key: "", value: "" }],
//       price:      { base: v.price?.base ?? "", sale: v.price?.sale ?? "" },
//       inventory:  { ...v.inventory },
//       images:     v.images || [],
//       isActive:   v.isActive !== false,
//     });
//     setEditingVariantIndex(index);
//     setShowVariantModal(true);
//   };

//   const closeVariantModal = () => {
//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   // ── handleVariantSave ─────────────────────────────────────────
//   // ADD  → addVariantToProduct thunk  (POST /:slug/variants)
//   // EDIT → updateVariantByBarcode thunk (PUT /:slug with barcode in JSON body)
//   // Both return updated product from backend; we sync formData.variants from it.
//   const handleVariantSave = (variantToSave) => {

//     if (editingVariantIndex !== null) {
//       // ── EDIT: update price + inventory via barcode ─────────────
//       const existingVariant = formData.variants[editingVariantIndex];
//       const barcode = existingVariant.barcode;  // barcode is locked, taken from existing

//       if (!barcode && barcode !== 0) {
//         alert("Cannot update: this variant has no barcode in the database.");
//         return;
//       }

//       dispatch(updateVariantByBarcode({
//         slug: product.slug,
//         barcode,
//         price: {
//           base: Number(variantToSave.price?.base) || 0,
//           sale: (variantToSave.price?.sale !== "" && variantToSave.price?.sale != null)
//             ? Number(variantToSave.price.sale) : null,
//         },
//         inventory: {
//           quantity:          Number(variantToSave.inventory?.quantity) || 0,
//           lowStockThreshold: Number(variantToSave.inventory?.lowStockThreshold) || 5,
//           trackInventory:    variantToSave.inventory?.trackInventory !== false,
//         },
//       }))
//         .unwrap()
//         .then(({ product: updatedProduct }) => {
//           setFormData(prev => ({ ...prev, variants: syncVariants(updatedProduct) }));
//           closeVariantModal();
//         })
//         .catch((err) => {
//           // actionError in Redux shows in the UI banner below
//           console.error("[EditProductModal] updateVariantByBarcode failed:", err);
//         });

//     } else {
//       // ── ADD: POST new variant with barcode ─────────────────────
//       dispatch(addVariantToProduct({
//         slug: product.slug,
//         variantData: variantToSave,
//       }))
//         .unwrap()
//         .then(({ product: updatedProduct }) => {
//           setFormData(prev => ({ ...prev, variants: syncVariants(updatedProduct) }));
//           closeVariantModal();
//         })
//         .catch((err) => {
//           console.error("[EditProductModal] addVariantToProduct failed:", err);
//         });
//     }
//   };

//   // Variant active toggle — stays local until full product save
//   const toggleVariantActive = (index) =>
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.map((v, i) => i === index ? { ...v, isActive: !v.isActive } : v),
//     }));

//   const handleAddAttribute = (a) => setFormData(prev => ({ ...prev, attributes: [...prev.attributes, a] }));
//   const removeAttribute = (id) => setFormData(prev => ({ ...prev, attributes: prev.attributes.filter(a => a.id !== id) }));
//   const handleCustomMessageSave = (msg) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, customMessage: msg } }));

//   // ── Full product update (product-level fields) ────────────────
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.name.trim())  { alert("Product name is required");  return; }
//     if (!formData.title.trim()) { alert("Product title is required"); return; }
//     if (!formData.category)     { alert("Please select a category");  return; }
//     dispatch(updateProduct({ slug: product.slug, formData }));
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">

//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Editing: <span className="font-medium text-gray-700">{product.name}</span>
//               <span className="ml-2 text-xs text-indigo-400">slug: {product.slug}</span>
//             </p>
//           </div>
//           <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
//             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
//           </button>
//         </div>

//         {/* Error banners */}
//         {updateError && (
//           <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
//             <p className="text-red-700 text-sm font-medium">❌ {updateError}</p>
//           </div>
//         )}
//         {actionError && (
//           <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
//             <p className="text-red-700 text-sm font-medium">❌ Variant error: {actionError}</p>
//           </div>
//         )}

//         {/* Variant action loading indicator */}
//         {actionLoading && (
//           <div className="mx-6 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2">
//             <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
//             <p className="text-indigo-700 text-sm">Saving variant to database...</p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="p-6">
//           <ProductFormBody
//             formData={formData} setFormData={setFormData}
//             categories={categories} brands={brands}
//             onOpenCategoryModal={() => setShowCategoryModal(true)}
//             onOpenBrandModal={() => setShowBrandModal(true)}
//             onOpenAttributeModal={() => setShowAttributeModal(true)}
//             onOpenCustomMessage={() => setShowCustomMessageModal(true)}
//             onOpenAddVariant={openAddVariant}
//             onOpenEditVariant={openEditVariant}
//             onRemoveAttribute={removeAttribute}
//             onDeleteVariant={() => {}}       // not used in edit mode — ProductFormBody handles delete via productSlug
//             onToggleVariantActive={toggleVariantActive}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//             productSlug={product.slug}       // KEY: enables direct API calls for delete inside ProductFormBody
//           />

//           <div className="flex gap-3 mt-6">
//             <button type="button" onClick={onClose} disabled={updateLoading}
//               className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60">
//               Cancel
//             </button>
//             <button type="submit" disabled={updateLoading}
//               className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
//               {updateLoading
//                 ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
//                 : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {showCategoryModal && <CategoryModal onSelect={(catId) => setFormData(prev => ({ ...prev, category: catId }))} onClose={() => setShowCategoryModal(false)} />}
//       {showBrandModal && <BrandModal brands={brands} setBrands={setBrands} onSelect={(brand) => setFormData(prev => ({ ...prev, brand }))} onClose={() => setShowBrandModal(false)} />}
//       {showAttributeModal && <AttributeModal onAdd={handleAddAttribute} onClose={() => setShowAttributeModal(false)} />}
//       {showCustomMessageModal && <CustomMessageModal currentMessage={formData.fomo.customMessage} onSave={handleCustomMessageSave} onClose={() => setShowCustomMessageModal(false)} />}
//       {showVariantModal && (
//         <VariantModal
//           variantForm={variantForm} setVariantForm={setVariantForm}
//           editingVariantIndex={editingVariantIndex}
//           onSave={handleVariantSave}
//           onClose={closeVariantModal}
//           getDiscountPercentage={getDiscountPercentage} />
//       )}
//     </div>
//   );
// };

// export default EditProductModal;

// CODE IS WORKING BUT SO SOME MORE CHANGES TEH BARCIODE API INTGRATION THE VARIENTS API UPDATE 

// // PRODUCT_MODAL_SEGMENT/EditProductModal.jsx

// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";

// import ProductFormBody from "../Shared_components/ProductFormBody";
// import VariantModal, { defaultVariant } from "../Shared_components/VariantModal";
// import CategoryModal from "../Shared_components/CategoryModal";
// import BrandModal from "../Shared_components/BrandModal";
// import AttributeModal from "../Shared_components/AttributeModal";
// import CustomMessageModal from "../Shared_components/CustomMessageModal";

// import { updateProduct, resetUpdateSuccess } from "../ADMIN_REDUX_MANAGEMENT/adminProductsSlice";

// // ── Convert backend product → formData shape ──────────────────
// const productToFormData = (product) => ({
//   name: product.name || "",
//   title: product.title || "",
//   description: product.description || "",
//   brand: product.brand || "Generic",
//   category:
//     typeof product.category === "object" && product.category !== null
//       ? product.category._id
//       : product.category || "",
//   price: {
//     base: product.priceRange?.min || product.variants?.[0]?.price?.base || "",
//     sale: product.variants?.[0]?.price?.sale ?? "",
//     costPrice: product.price?.costPrice || "",
//   },
//   inventory: product.inventory || { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//   shipping: product.shipping || { weight: 0, dimensions: { length: "", width: "", height: "" } },
//   soldInfo: product.soldInfo || { enabled: false, count: 0 },
//   fomo: product.fomo || {
//     enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "",
//   },
//   images: product.images || [],
//   attributes: product.attributes || [],
//   variants: (product.variants || []).map((v) => ({
//     ...v,
//     price: { base: v.price?.base || "", sale: v.price?.sale ?? "" },
//     images: v.images || [],
//   })),
//   isFeatured: product.isFeatured || false,
//   status: product.status || "draft",
// });

// const EditProductModal = ({
//   product,
//   onClose,
//   brands,
//   setBrands,
//   formatIndianRupee,
//   getDiscountPercentage,
// }) => {
//   const dispatch = useDispatch();

//   const { updateLoading, updateError, updateSuccess } = useSelector(
//     (state) => state.adminProducts
//   );
//   // ✅ Categories come from Redux — real MongoDB _id values
//   const { categories } = useSelector((state) => state.categories);

//   const [formData, setFormData] = useState(() => productToFormData(product));

//   useEffect(() => {
//     if (updateSuccess) {
//       dispatch(resetUpdateSuccess());
//       onClose();
//     }
//   }, [updateSuccess]);

//   useEffect(() => {
//     setFormData(productToFormData(product));
//   }, [product]);

//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
//   const [showVariantModal, setShowVariantModal] = useState(false);

//   const [variantForm, setVariantForm] = useState(defaultVariant);
//   const [editingVariantIndex, setEditingVariantIndex] = useState(null);

//   const openAddVariant = () => {
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//     setShowVariantModal(true);
//   };

//   const openEditVariant = (index) => {
//     const v = formData.variants[index];
//     setVariantForm({
//       attributes: v.attributes.length > 0 ? v.attributes : [{ key: "", value: "" }],
//       price: { base: v.price.base, sale: v.price.sale ?? "" },
//       inventory: { ...v.inventory },
//       images: v.images || [],
//       isActive: v.isActive,
//     });
//     setEditingVariantIndex(index);
//     setShowVariantModal(true);
//   };

//   const handleVariantSave = (variantToSave) => {
//     if (editingVariantIndex !== null) {
//       setFormData((prev) => ({
//         ...prev,
//         variants: prev.variants.map((v, i) => i === editingVariantIndex ? variantToSave : v),
//       }));
//     } else {
//       setFormData((prev) => ({ ...prev, variants: [...prev.variants, variantToSave] }));
//     }
//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   const handleVariantModalClose = () => {
//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   const deleteVariant = (index) =>
//     setFormData((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));

//   const toggleVariantActive = (index) =>
//     setFormData((prev) => ({
//       ...prev,
//       variants: prev.variants.map((v, i) => i === index ? { ...v, isActive: !v.isActive } : v),
//     }));

//   const handleAddAttribute = (newAttr) =>
//     setFormData((prev) => ({ ...prev, attributes: [...prev.attributes, newAttr] }));

//   const removeAttribute = (attributeId) =>
//     setFormData((prev) => ({
//       ...prev,
//       attributes: prev.attributes.filter((attr) => attr.id !== attributeId),
//     }));

//   const handleCustomMessageSave = (message) =>
//     setFormData((prev) => ({ ...prev, fomo: { ...prev.fomo, customMessage: message } }));

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.name.trim()) { alert("Product name is required"); return; }
//     if (!formData.title.trim()) { alert("Product title is required"); return; }
//     if (!formData.category) { alert("Please select a category"); return; }
//     // if (formData.variants.length === 0) { alert("At least one variant is required"); return; }
//     dispatch(updateProduct({ slug: product.slug, formData }));
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">

//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Updating: <span className="font-medium text-gray-700">{product.name}</span>
//             </p>
//           </div>
//           <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
//             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Error Banner */}
//         {updateError && (
//           <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
//             <p className="text-red-700 text-sm font-medium">❌ {updateError}</p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="p-6">
//           <ProductFormBody
//             formData={formData}
//             setFormData={setFormData}
//             categories={categories}       // ✅ real categories from Redux
//             brands={brands}
//             onOpenCategoryModal={() => setShowCategoryModal(true)}
//             onOpenBrandModal={() => setShowBrandModal(true)}
//             onOpenAttributeModal={() => setShowAttributeModal(true)}
//             onOpenCustomMessage={() => setShowCustomMessageModal(true)}
//             onOpenAddVariant={openAddVariant}
//             onOpenEditVariant={openEditVariant}
//             onRemoveAttribute={removeAttribute}
//             onDeleteVariant={deleteVariant}
//             onToggleVariantActive={toggleVariantActive}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />

//           <div className="flex gap-3 mt-6">
//             <button type="button" onClick={onClose} disabled={updateLoading}
//               className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
//               Cancel
//             </button>
//             <button type="submit" disabled={updateLoading}
//               className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
//               {updateLoading ? (
//                 <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
//               ) : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* ── Shared Modals ── */}
//       {showCategoryModal && (
//         <CategoryModal
//           onSelect={(catId) => setFormData((prev) => ({ ...prev, category: catId }))}
//           onClose={() => setShowCategoryModal(false)}
//         />
//       )}
//       {showBrandModal && (
//         <BrandModal brands={brands} setBrands={setBrands}
//           onSelect={(brand) => setFormData((prev) => ({ ...prev, brand }))}
//           onClose={() => setShowBrandModal(false)} />
//       )}
//       {showAttributeModal && (
//         <AttributeModal onAdd={handleAddAttribute} onClose={() => setShowAttributeModal(false)} />
//       )}
//       {showCustomMessageModal && (
//         <CustomMessageModal currentMessage={formData.fomo.customMessage}
//           onSave={handleCustomMessageSave} onClose={() => setShowCustomMessageModal(false)} />
//       )}
//       {showVariantModal && (
//         <VariantModal variantForm={variantForm} setVariantForm={setVariantForm}
//           editingVariantIndex={editingVariantIndex} onSave={handleVariantSave}
//           onClose={handleVariantModalClose} getDiscountPercentage={getDiscountPercentage} />
//       )}
//     </div>
//   );
// };

// export default EditProductModal;

// CODE IS WORKING UPSIDE CODE INTEGRATE API 
// import React, { useState } from 'react';
// import ProductFormBody from '../Shared_components/ProductFormBody';
// import VariantModal, { defaultVariant } from '../Shared_components/VariantModal';
// import CategoryModal from '../Shared_components/CategoryModal';
// import BrandModal from '../Shared_components/BrandModal';
// import AttributeModal from '../Shared_components/AttributeModal';
// import CustomMessageModal from '../Shared_components/CustomMessageModal';

// const EditProductModal = ({
//   product,
//   onClose,
//   onSave,
//   categories,
//   brands,
//   setCategories,
//   setBrands,
//   formatIndianRupee,
//   getDiscountPercentage
// }) => {

//   // ================= FORM STATE (pre-filled from product) =================
//   const [formData, setFormData] = useState({
//     name: product.name || '',
//     title: product.title || '',
//     description: product.description || '',
//     brand: product.brand || 'Generic',
//     category: product.category?._id || '',
//     price: {
//       base: product.price?.base || '',
//       sale: product.price?.sale || '',
//       costPrice: product.price?.costPrice || ''
//     },
//     inventory: {
//       quantity: product.inventory?.quantity || 0,
//       lowStockThreshold: product.inventory?.lowStockThreshold || 5,
//       trackInventory: product.inventory?.trackInventory !== undefined ? product.inventory.trackInventory : true
//     },
//     shipping: {
//       weight: product.shipping?.weight || 0,
//       dimensions: {
//         length: product.shipping?.dimensions?.length || '',
//         width: product.shipping?.dimensions?.width || '',
//         height: product.shipping?.dimensions?.height || ''
//       }
//     },
//     soldInfo: {
//       enabled: product.soldInfo?.enabled || false,
//       count: product.soldInfo?.count || 0
//     },
//     fomo: {
//       enabled: product.fomo?.enabled || false,
//       type: product.fomo?.type || 'viewing_now',
//       viewingNow: product.fomo?.viewingNow || 0,
//       productLeft: product.fomo?.productLeft || 0,
//       customMessage: product.fomo?.customMessage || ''
//     },
//     images: product.images || [],
//     attributes: product.attributes || [],
//     variants: product.variants || [],
//     isFeatured: product.isFeatured || false,
//     status: product.status || 'draft'
//   });

//   // ================= MODAL VISIBILITY STATES =================
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
//   const [showVariantModal, setShowVariantModal] = useState(false);

//   // ================= VARIANT STATE =================
//   const [variantForm, setVariantForm] = useState(defaultVariant);
//   const [editingVariantIndex, setEditingVariantIndex] = useState(null);

//   // ================= VARIANT HANDLERS =================
//   const openAddVariant = () => {
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//     setShowVariantModal(true);
//   };

//   const openEditVariant = (index) => {
//     const v = formData.variants[index];
//     setVariantForm({
//       // safe fallback for existing products that may not have all variant fields
//       attributes: v.attributes && v.attributes.length > 0 ? v.attributes : [{ key: '', value: '' }],
//       price: { base: v.price?.base ?? '', sale: v.price?.sale ?? '' },
//       inventory: {
//         quantity: v.inventory?.quantity ?? 0,
//         lowStockThreshold: v.inventory?.lowStockThreshold ?? 5,
//         trackInventory: v.inventory?.trackInventory !== undefined ? v.inventory.trackInventory : true
//       },
//       images: v.images || [],
//       isActive: v.isActive !== undefined ? v.isActive : true
//     });
//     setEditingVariantIndex(index);
//     setShowVariantModal(true);
//   };

//   const handleVariantSave = (variantToSave) => {
//     if (editingVariantIndex !== null) {
//       setFormData(prev => ({
//         ...prev,
//         variants: prev.variants.map((v, i) => i === editingVariantIndex ? variantToSave : v)
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         variants: [...prev.variants, variantToSave]
//       }));
//     }
//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   const handleVariantModalClose = () => {
//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   const deleteVariant = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index)
//     }));
//   };

//   const toggleVariantActive = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.map((v, i) =>
//         i === index ? { ...v, isActive: !v.isActive } : v
//       )
//     }));
//   };

//   // ================= ATTRIBUTE HANDLERS =================
//   const handleAddAttribute = (newAttr) => {
//     setFormData(prev => ({
//       ...prev,
//       attributes: [...prev.attributes, newAttr]
//     }));
//   };

//   const removeAttribute = (attributeId) => {
//     setFormData(prev => ({
//       ...prev,
//       attributes: prev.attributes.filter(attr => attr.id !== attributeId)
//     }));
//   };

//   // ================= CUSTOM MESSAGE HANDLER =================
//   const handleCustomMessageSave = (message) => {
//     setFormData(prev => ({
//       ...prev,
//       fomo: { ...prev.fomo, customMessage: message }
//     }));
//   };

//   // ================= SUBMIT =================
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const categoryObj = categories.find(c => c._id === formData.category);

//     const updatedProduct = {
//       ...formData,
//       _id: product._id,                          // preserve original _id
//       category: categoryObj,
//       createdAt: product.createdAt,              // preserve original createdAt
//       inventory: { ...formData.inventory },
//       shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions } },
//       soldInfo: { ...formData.soldInfo },
//       fomo: { ...formData.fomo },
//       variants: formData.variants.map(v => ({ ...v, attributes: [...v.attributes], images: [...(v.images || [])] }))
//     };

//     onSave(updatedProduct);
//     onClose();
//   };

//   // ============================================================
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">

//         {/* Modal Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
//             <p className="text-sm text-gray-500 mt-1">Update your product details</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
//           >
//             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Modal Body */}
//         <form onSubmit={handleSubmit} className="p-6">

//           {/* All form sections rendered by ProductFormBody */}
//           <ProductFormBody
//             formData={formData}
//             setFormData={setFormData}
//             categories={categories}
//             brands={brands}
//             onOpenCategoryModal={() => setShowCategoryModal(true)}
//             onOpenBrandModal={() => setShowBrandModal(true)}
//             onOpenAttributeModal={() => setShowAttributeModal(true)}
//             onOpenCustomMessage={() => setShowCustomMessageModal(true)}
//             onOpenAddVariant={openAddVariant}
//             onOpenEditVariant={openEditVariant}
//             onRemoveAttribute={removeAttribute}
//             onDeleteVariant={deleteVariant}
//             onToggleVariantActive={toggleVariantActive}
//             formatIndianRupee={formatIndianRupee}
//             getDiscountPercentage={getDiscountPercentage}
//           />

//           {/* Submit Buttons — inside form, after ProductFormBody */}
//           <div className="flex gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700"
//             >
//               Update
//             </button>
//           </div>

//         </form>
//       </div>

//       {/* ================= SHARED MODALS ================= */}

//       {showCategoryModal && (
//         <CategoryModal
//           categories={categories}
//           setCategories={setCategories}
//           onSelect={(catId) => setFormData(prev => ({ ...prev, category: catId }))}
//           onClose={() => setShowCategoryModal(false)}
//         />
//       )}

//       {showBrandModal && (
//         <BrandModal
//           brands={brands}
//           setBrands={setBrands}
//           onSelect={(brand) => setFormData(prev => ({ ...prev, brand }))}
//           onClose={() => setShowBrandModal(false)}
//         />
//       )}

//       {showAttributeModal && (
//         <AttributeModal
//           onAdd={handleAddAttribute}
//           onClose={() => setShowAttributeModal(false)}
//         />
//       )}

//       {showCustomMessageModal && (
//         <CustomMessageModal
//           currentMessage={formData.fomo.customMessage}
//           onSave={handleCustomMessageSave}
//           onClose={() => setShowCustomMessageModal(false)}
//         />
//       )}

//       {showVariantModal && (
//         <VariantModal
//           variantForm={variantForm}
//           setVariantForm={setVariantForm}
//           editingVariantIndex={editingVariantIndex}
//           onSave={handleVariantSave}
//           onClose={handleVariantModalClose}
//           getDiscountPercentage={getDiscountPercentage}
//         />
//       )}

//     </div>
//   );
// };

// export default EditProductModal;

//THIS CODE IS ALSO WORKING BUT I REFACTORED IT TO MAKE IT CLEANER AND MORE MAINTAINABLE. THE NEW CODE IS IN THE EditProductModal.jsx FILE. I KEPT THIS AS A BACKUP IN CASE I NEEDED TO REFER TO IT FOR ANY REASON.
// import React, { useState } from 'react';

// const EditProductModal = ({ 
//   product,
//   onClose, 
//   onSave, 
//   categories, 
//   brands, 
//   setCategories, 
//   setBrands,
//   formatIndianRupee,
//   getDiscountPercentage 
// }) => {
//   // ================= FORM STATE with product data =================
//   const [formData, setFormData] = useState({
//     name: product.name || '',
//     title: product.title || '',
//     description: product.description || '',
//     brand: product.brand || 'Generic',
//     category: product.category?._id || '',
//     price: {
//       base: product.price?.base || '',
//       sale: product.price?.sale || '',
//       costPrice: product.price?.costPrice || ''
//     },
//     inventory: {
//       quantity: product.inventory?.quantity || 0,
//       lowStockThreshold: product.inventory?.lowStockThreshold || 5,
//       trackInventory: product.inventory?.trackInventory !== undefined ? product.inventory.trackInventory : true
//     },
//     shipping: {
//       weight: product.shipping?.weight || 0,
//       dimensions: {
//         length: product.shipping?.dimensions?.length || '',
//         width: product.shipping?.dimensions?.width || '',
//         height: product.shipping?.dimensions?.height || ''
//       }
//     },
//     soldInfo: {
//       enabled: product.soldInfo?.enabled || false,
//       count: product.soldInfo?.count || 0
//     },
//     fomo: {
//       enabled: product.fomo?.enabled || false,
//       type: product.fomo?.type || 'viewing_now',
//       viewingNow: product.fomo?.viewingNow || 0,
//       productLeft: product.fomo?.productLeft || 0,
//       customMessage: product.fomo?.customMessage || ''
//     },
//     images: product.images || [],
//     attributes: product.attributes || [],
//     variants: product.variants || [],
//     isFeatured: product.isFeatured || false,
//     status: product.status || 'draft'
//   });

//   // ================= UI STATES =================
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [draggedImageIndex, setDraggedImageIndex] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);

//   // ================= MODAL STATES =================
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
//   const [showVariantModal, setShowVariantModal] = useState(false);
//   const [editingVariantIndex, setEditingVariantIndex] = useState(null);

//   const [newCategory, setNewCategory] = useState('');
//   const [newBrand, setNewBrand] = useState('');
//   const [customMessage, setCustomMessage] = useState('');
//   const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });

//   // ================= VARIANT STATE =================
//   const defaultVariant = {
//     attributes: [{ key: '', value: '' }],
//     price: { base: '', sale: '' },
//     inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
//     images: [],
//     isActive: true
//   };
//   const [variantForm, setVariantForm] = useState(defaultVariant);
//   const [variantImageDragging, setVariantImageDragging] = useState(false);

//   // ================= IMAGE HANDLING (PRODUCT) =================
//   const handleImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = [...formData.images];
    
//     files.forEach((file, index) => {
//       if (newImages.length < 5) {
//         const reader = new FileReader();
//         const imageId = `img-${Date.now()}-${index}`;
        
//         setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
        
//         reader.onloadstart = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 10 }));
//         };
        
//         reader.onprogress = (progress) => {
//           if (progress.lengthComputable) {
//             const percent = (progress.loaded / progress.total) * 90 + 10;
//             setUploadProgress(prev => ({ ...prev, [imageId]: percent }));
//           }
//         };
        
//         reader.onloadend = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));
//           setTimeout(() => {
//             setUploadProgress(prev => {
//               const newProgress = { ...prev };
//               delete newProgress[imageId];
//               return newProgress;
//             });
//           }, 500);
          
//           newImages.push({
//             id: imageId,
//             url: reader.result,
//             file: file,
//             name: file.name,
//             size: file.size,
//             isMain: newImages.length === 0
//           });
          
//           setFormData(prev => ({ ...prev, images: newImages }));
//         };
        
//         reader.readAsDataURL(file);
//       }
//     });
//   };

//   const removeImage = (imageId) => {
//     const newImages = formData.images.filter(img => img.id !== imageId);
//     if (formData.images.find(img => img.id === imageId)?.isMain && newImages.length > 0) {
//       newImages[0].isMain = true;
//     }
//     setFormData(prev => ({ ...prev, images: newImages }));
//   };

//   const setMainImage = (imageId) => {
//     setFormData(prev => ({
//       ...prev,
//       images: prev.images.map(img => ({ ...img, isMain: img.id === imageId }))
//     }));
//   };

//   const handleImageDragStart = (e, index) => {
//     setDraggedImageIndex(index);
//     e.dataTransfer.effectAllowed = 'move';
//   };

//   const handleImageDragOver = (e, index) => {
//     e.preventDefault();
//     if (draggedImageIndex === null || draggedImageIndex === index) return;
    
//     const newImages = [...formData.images];
//     const draggedImage = newImages[draggedImageIndex];
//     newImages.splice(draggedImageIndex, 1);
//     newImages.splice(index, 0, draggedImage);
//     newImages.forEach((img, idx) => { img.isMain = idx === 0; });
    
//     setFormData(prev => ({ ...prev, images: newImages }));
//     setDraggedImageIndex(index);
//   };

//   const handleImageDragEnd = () => {
//     setDraggedImageIndex(null);
//     setIsDragging(false);
//   };

//   // ================= VARIANT IMAGE HANDLING =================
//   const handleVariantImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = [...variantForm.images];

//     files.forEach((file, index) => {
//       if (newImages.length < 4) {
//         const reader = new FileReader();
//         const imageId = `vimg-${Date.now()}-${index}`;

//         reader.onloadend = () => {
//           newImages.push({
//             id: imageId,
//             url: reader.result,
//             file: file,
//             name: file.name,
//             isMain: newImages.length === 0
//           });
//           setVariantForm(prev => ({ ...prev, images: [...newImages] }));
//         };

//         reader.readAsDataURL(file);
//       }
//     });
//   };

//   const removeVariantImage = (imageId) => {
//     const newImages = variantForm.images.filter(img => img.id !== imageId);
//     if (variantForm.images.find(img => img.id === imageId)?.isMain && newImages.length > 0) {
//       newImages[0].isMain = true;
//     }
//     setVariantForm(prev => ({ ...prev, images: newImages }));
//   };

//   const setVariantMainImage = (imageId) => {
//     setVariantForm(prev => ({
//       ...prev,
//       images: prev.images.map(img => ({ ...img, isMain: img.id === imageId }))
//     }));
//   };

//   // ================= VARIANT ATTRIBUTE HANDLING =================
//   const addVariantAttribute = () => {
//     setVariantForm(prev => ({
//       ...prev,
//       attributes: [...prev.attributes, { key: '', value: '' }]
//     }));
//   };

//   const removeVariantAttribute = (index) => {
//     setVariantForm(prev => ({
//       ...prev,
//       attributes: prev.attributes.filter((_, i) => i !== index)
//     }));
//   };

//   const updateVariantAttribute = (index, field, value) => {
//     setVariantForm(prev => ({
//       ...prev,
//       attributes: prev.attributes.map((attr, i) =>
//         i === index ? { ...attr, [field]: value } : attr
//       )
//     }));
//   };

//   // ================= VARIANT SAVE / EDIT / DELETE =================
//   const openAddVariant = () => {
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//     setShowVariantModal(true);
//   };

//   const openEditVariant = (index) => {
//     const v = formData.variants[index];
//     setVariantForm({
//       attributes: v.attributes && v.attributes.length > 0 ? v.attributes : [{ key: '', value: '' }],
//       price: { base: v.price?.base ?? '', sale: v.price?.sale ?? '' },
//       inventory: {
//         quantity: v.inventory?.quantity ?? 0,
//         lowStockThreshold: v.inventory?.lowStockThreshold ?? 5,
//         trackInventory: v.inventory?.trackInventory !== undefined ? v.inventory.trackInventory : true
//       },
//       images: v.images || [],
//       isActive: v.isActive !== undefined ? v.isActive : true
//     });
//     setEditingVariantIndex(index);
//     setShowVariantModal(true);
//   };

//   const saveVariant = () => {
//     const validAttributes = variantForm.attributes.filter(a => a.key.trim() && a.value.trim());
//     if (validAttributes.length === 0) {
//       alert('Please add at least one attribute (e.g., Color: Blue)');
//       return;
//     }
//     if (!variantForm.price.base) {
//       alert('Please enter base price for this variant');
//       return;
//     }

//     const variantToSave = {
//       ...variantForm,
//       attributes: validAttributes,
//       price: {
//         base: parseFloat(variantForm.price.base) || 0,
//         sale: variantForm.price.sale !== '' ? parseFloat(variantForm.price.sale) : null
//       }
//     };

//     if (editingVariantIndex !== null) {
//       setFormData(prev => ({
//         ...prev,
//         variants: prev.variants.map((v, i) => i === editingVariantIndex ? variantToSave : v)
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         variants: [...prev.variants, variantToSave]
//       }));
//     }

//     setShowVariantModal(false);
//     setVariantForm(defaultVariant);
//     setEditingVariantIndex(null);
//   };

//   const deleteVariant = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index)
//     }));
//   };

//   const toggleVariantActive = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.map((v, i) =>
//         i === index ? { ...v, isActive: !v.isActive } : v
//       )
//     }));
//   };

//   // ================= ATTRIBUTES HANDLING =================
//   const addAttribute = () => {
//     if (newAttribute.key && newAttribute.value) {
//       setFormData(prev => ({
//         ...prev,
//         attributes: [...prev.attributes, { ...newAttribute, id: Date.now() }]
//       }));
//       setNewAttribute({ key: '', value: '' });
//       setShowAttributeModal(false);
//     }
//   };

//   const removeAttribute = (attributeId) => {
//     setFormData(prev => ({
//       ...prev,
//       attributes: prev.attributes.filter(attr => attr.id !== attributeId)
//     }));
//   };

//   // ================= CATEGORY & BRAND HANDLING =================
//   const handleAddCategory = () => {
//     if (newCategory.trim()) {
//       const newCat = { _id: Date.now().toString(), name: newCategory };
//       setCategories([...categories, newCat]);
//       setFormData(prev => ({ ...prev, category: newCat._id }));
//       setNewCategory('');
//       setShowCategoryModal(false);
//     }
//   };

//   const handleAddBrand = () => {
//     if (newBrand.trim()) {
//       setBrands([...brands, newBrand]);
//       setFormData(prev => ({ ...prev, brand: newBrand }));
//       setNewBrand('');
//       setShowBrandModal(false);
//     }
//   };

//   // ================= FOMO CUSTOM MESSAGE =================
//   const handleCustomMessageSave = () => {
//     if (customMessage.trim()) {
//       setFormData(prev => ({
//         ...prev,
//         fomo: { ...prev.fomo, customMessage }
//       }));
//       setCustomMessage('');
//       setShowCustomMessageModal(false);
//     }
//   };

//   // ================= FORM HANDLING =================
//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [parent, child] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
//       }));
//     } else if (name.includes('shipping.dimensions.')) {
//       const dimension = name.split('.')[2];
//       setFormData(prev => ({
//         ...prev,
//         shipping: {
//           ...prev.shipping,
//           dimensions: { ...prev.shipping.dimensions, [dimension]: value }
//         }
//       }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     const categoryObj = categories.find(c => c._id === formData.category);
    
//     const updatedProduct = {
//       ...formData,
//       _id: product._id,
//       category: categoryObj,
//       createdAt: product.createdAt,
//       inventory: { ...formData.inventory },
//       shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions } },
//       soldInfo: { ...formData.soldInfo },
//       fomo: { ...formData.fomo },
//       variants: formData.variants.map(v => ({ ...v, attributes: [...v.attributes], images: [...(v.images || [])] }))
//     };
    
//     onSave(updatedProduct);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">

//         {/* Modal Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
//             <p className="text-sm text-gray-500 mt-1">Update your product details</p>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
//             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Modal Body - Form */}
//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="grid grid-cols-3 gap-6">

//             {/* ===== LEFT COLUMN ===== */}
//             <div className="col-span-2 space-y-6">

//               {/* Basic Details Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Essential Details</h3>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Product Name <span className="text-red-400">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={formData.name}
//                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="e.g., Premium Wireless Headphones"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Title <span className="text-red-400">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="title"
//                         value={formData.title}
//                         onChange={handleInputChange}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="e.g., Noise Cancelling Headphones"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Description <span className="text-red-400">*</span>
//                     </label>
//                     <textarea
//                       name="description"
//                       value={formData.description}
//                       onChange={handleInputChange}
//                       rows="3"
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
//                       placeholder="Describe your product in detail..."
//                       required
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
//                       <div className="flex gap-2">
//                         <select
//                           name="category"
//                           value={formData.category}
//                           onChange={handleInputChange}
//                           className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                         >
//                           <option value="">Select category</option>
//                           {categories.map(cat => (
//                             <option key={cat._id} value={cat._id}>{cat.name}</option>
//                           ))}
//                         </select>
//                         <button
//                           type="button"
//                           onClick={() => setShowCategoryModal(true)}
//                           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
//                       <div className="flex gap-2">
//                         <select
//                           name="brand"
//                           value={formData.brand}
//                           onChange={handleInputChange}
//                           className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                         >
//                           {brands.map(brand => (
//                             <option key={brand} value={brand}>{brand}</option>
//                           ))}
//                         </select>
//                         <button
//                           type="button"
//                           onClick={() => setShowBrandModal(true)}
//                           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Pricing Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
//                 </div>
//                 <div className="p-4">
//                   <div className="grid grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">MRP / Base Price (₹)</label>
//                       <input
//                         type="number"
//                         value={formData.price.base}
//                         onChange={(e) => setFormData({ ...formData, price: { ...formData.price, base: e.target.value } })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="29999"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (₹)</label>
//                       <input
//                         type="number"
//                         value={formData.price.sale}
//                         onChange={(e) => setFormData({ ...formData, price: { ...formData.price, sale: e.target.value } })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="19999"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
//                       <input
//                         type="number"
//                         value={formData.price.costPrice}
//                         onChange={(e) => setFormData({ ...formData, price: { ...formData.price, costPrice: e.target.value } })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="15000"
//                       />
//                     </div>
//                   </div>

//                   {/* Price Preview */}
//                   {formData.price.base && formData.price.sale && (
//                     <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                       <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
//                       <div className="flex items-center space-x-3">
//                         <span className="text-gray-400 line-through">{formatIndianRupee(formData.price.base)}</span>
//                         <span className="text-lg font-bold text-gray-900">{formatIndianRupee(formData.price.sale)}</span>
//                         {formData.price.sale < formData.price.base && (
//                           <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                             {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Inventory Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                   <h3 className="font-semibold text-gray-900">Inventory Management</h3>
//                   <button
//                     type="button"
//                     onClick={() => setFormData(prev => ({
//                       ...prev,
//                       inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory }
//                     }))}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'}`}
//                   >
//                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'}`} />
//                   </button>
//                 </div>
//                 {formData.inventory.trackInventory && (
//                   <div className="p-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Quantity in Stock</label>
//                         <input
//                           type="number"
//                           value={formData.inventory.quantity}
//                           onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 } })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="0"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
//                         <input
//                           type="number"
//                           value={formData.inventory.lowStockThreshold}
//                           onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="5"
//                         />
//                       </div>
//                     </div>
//                     <p className="text-xs text-gray-500 mt-2">Low stock alert will show when quantity is below threshold</p>
//                   </div>
//                 )}
//               </div>

//               {/* Shipping Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Shipping Details</h3>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
//                     <input
//                       type="number"
//                       step="0.1"
//                       value={formData.shipping.weight ?? ''}
//                       onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 } })}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                       placeholder="0.5"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
//                     <div className="grid grid-cols-3 gap-2">
//                       <input
//                         type="number"
//                         value={formData.shipping.dimensions.length ?? ''}
//                         onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, length: parseFloat(e.target.value) } } })}
//                         className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="Length"
//                       />
//                       <input
//                         type="number"
//                         value={formData.shipping.dimensions.width ?? ''}
//                         onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, width: parseFloat(e.target.value) } } })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="Width"
//                       />
//                       <input
//                         type="number"
//                         value={formData.shipping.dimensions.height ?? ''}
//                         onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, height: parseFloat(e.target.value) } } })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="Height"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Attributes Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                   <h3 className="font-semibold text-gray-900">Product Attributes</h3>
//                   <button
//                     type="button"
//                     onClick={() => setShowAttributeModal(true)}
//                     className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
//                   >
//                     + Add Attribute
//                   </button>
//                 </div>
//                 <div className="p-4">
//                   {formData.attributes.length === 0 ? (
//                     <p className="text-center text-gray-500 py-4">No attributes added yet</p>
//                   ) : (
//                     <div className="space-y-2">
//                       {formData.attributes.map((attr) => (
//                         <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
//                             <span className="text-sm text-gray-600">{attr.value}</span>
//                           </div>
//                           <button type="button" onClick={() => removeAttribute(attr.id)} className="text-gray-400 hover:text-red-500">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* ===== VARIANTS CARD ===== */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                   <div>
//                     <h3 className="font-semibold text-gray-900">Product Variants</h3>
//                     <p className="text-xs text-gray-500 mt-0.5">e.g., different colors, sizes with own price & stock</p>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={openAddVariant}
//                     className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 flex items-center gap-1.5"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                     Add Variant
//                   </button>
//                 </div>
//                 <div className="p-4">
//                   {formData.variants.length === 0 ? (
//                     <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
//                       <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                       </svg>
//                       <p className="text-gray-500 text-sm">No variants added yet</p>
//                       <p className="text-gray-400 text-xs mt-1">Click "Add Variant" to add color, size or other variants</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       {formData.variants.map((variant, index) => (
//                         <div
//                           key={index}
//                           className={`rounded-lg border-2 p-3 transition-all ${variant.isActive ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}
//                         >
//                           <div className="flex items-start justify-between gap-3">
//                             <div className="flex-1 min-w-0">
//                               {/* Attribute badges */}
//                               <div className="flex flex-wrap gap-1.5 mb-2">
//                                 {variant.attributes.map((attr, aIdx) => (
//                                   <span key={aIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
//                                     {attr.key}: {attr.value}
//                                   </span>
//                                 ))}
//                               </div>

//                               {/* Price row */}
//                               <div className="flex items-center gap-3 text-sm">
//                                 <span className="font-semibold text-gray-900">
//                                   ₹{Number(variant.price?.base || 0).toLocaleString('en-IN')}
//                                 </span>
//                                 {variant.price?.sale && (
//                                   <>
//                                     <span className="text-gray-400 line-through text-xs">
//                                       ₹{Number(variant.price.sale).toLocaleString('en-IN')}
//                                     </span>
//                                     {variant.price.sale < variant.price.base && (
//                                       <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
//                                         {getDiscountPercentage(variant.price.base, variant.price.sale)}% OFF
//                                       </span>
//                                     )}
//                                   </>
//                                 )}
//                                 <span className="text-gray-400 text-xs">•</span>
//                                 <span className="text-gray-600 text-xs">Qty: {variant.inventory?.quantity ?? 0}</span>
//                               </div>

//                               {/* Images preview */}
//                               {variant.images && variant.images.length > 0 && (
//                                 <div className="flex items-center gap-2 mt-2">
//                                   {variant.images.slice(0, 3).map((img, iIdx) => (
//                                     <div key={iIdx} className="w-8 h-8 rounded overflow-hidden border border-indigo-200">
//                                       <img src={img.url} alt="" className="w-full h-full object-cover" />
//                                     </div>
//                                   ))}
//                                   {variant.images.length > 3 && (
//                                     <span className="text-xs text-gray-400">+{variant.images.length - 3} more</span>
//                                   )}
//                                 </div>
//                               )}
//                             </div>

//                             {/* Actions */}
//                             <div className="flex items-center gap-2 flex-shrink-0">
//                               {/* Active toggle */}
//                               <button
//                                 type="button"
//                                 onClick={() => toggleVariantActive(index)}
//                                 className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${variant.isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}
//                                 title={variant.isActive ? 'Active' : 'Inactive'}
//                               >
//                                 <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${variant.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
//                               </button>

//                               {/* Edit */}
//                               <button
//                                 type="button"
//                                 onClick={() => openEditVariant(index)}
//                                 className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
//                                 title="Edit variant"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                                 </svg>
//                               </button>

//                               {/* Delete */}
//                               <button
//                                 type="button"
//                                 onClick={() => deleteVariant(index)}
//                                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                 title="Delete variant"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                 </svg>
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       ))}

//                       <p className="text-xs text-gray-400 text-center pt-1">
//                         {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} total
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//             </div>

//             {/* ===== RIGHT COLUMN ===== */}
//             <div className="space-y-6">

//               {/* Image Upload Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Product Gallery</h3>
//                   <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
//                 </div>
//                 <div className="p-4">
//                   <label
//                     className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
//                     onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                     onDragLeave={() => setIsDragging(false)}
//                     onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageUpload({ target: { files: e.dataTransfer.files } }); }}
//                   >
//                     <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={formData.images.length >= 5} />
//                     <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                     <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
//                   </label>

//                   {formData.images.length > 0 && (
//                     <div className="mt-4 space-y-2">
//                       {formData.images.map((image, index) => (
//                         <div
//                           key={image.id}
//                           draggable
//                           onDragStart={(e) => handleImageDragStart(e, index)}
//                           onDragOver={(e) => handleImageDragOver(e, index)}
//                           onDragEnd={handleImageDragEnd}
//                           className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 ${image.isMain ? 'border-blue-500' : 'border-transparent'}`}
//                         >
//                           <div className="w-12 h-12 rounded overflow-hidden bg-white">
//                             <img src={image.url} alt="" className="w-full h-full object-cover" />
//                           </div>
//                           <div className="flex-1 text-xs truncate">{image.name}</div>
//                           <div className="flex items-center space-x-1">
//                             {!image.isMain && (
//                               <button type="button" onClick={() => setMainImage(image.id)} className="p-1 text-gray-500 hover:text-blue-600" title="Make main">
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                                 </svg>
//                               </button>
//                             )}
//                             <button type="button" onClick={() => removeImage(image.id)} className="p-1 text-gray-500 hover:text-red-600">
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Marketing Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
//                 </div>
//                 <div className="p-4 space-y-4">

//                   {/* Featured Toggle */}
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-medium text-gray-700">Featured Product</span>
//                     <button
//                       type="button"
//                       onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
//                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'}`}
//                     >
//                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
//                     </button>
//                   </div>

//                   {/* Status */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//                     <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                       <option value="archived">Archived</option>
//                     </select>
//                   </div>

//                   {/* Sold Info */}
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium text-gray-700">Sold Info</span>
//                       <button
//                         type="button"
//                         onClick={() => setFormData(prev => ({ ...prev, soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled } }))}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
//                       >
//                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
//                       </button>
//                     </div>
//                     {formData.soldInfo.enabled && (
//                       <input
//                         type="number"
//                         value={formData.soldInfo.count}
//                         onChange={(e) => setFormData(prev => ({ ...prev, soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 } }))}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                         placeholder="Number sold"
//                       />
//                     )}
//                   </div>

//                   {/* FOMO */}
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium text-gray-700">FOMO</span>
//                       <button
//                         type="button"
//                         onClick={() => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, enabled: !prev.fomo.enabled } }))}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
//                       >
//                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
//                       </button>
//                     </div>
//                     {formData.fomo.enabled && (
//                       <div className="space-y-2">
//                         <select
//                           value={formData.fomo.type}
//                           onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, type: e.target.value } }))}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                         >
//                           <option value="viewing_now">Viewing Now</option>
//                           <option value="product_left">Product Left</option>
//                           <option value="custom">Custom</option>
//                         </select>

//                         {formData.fomo.type === 'viewing_now' && (
//                           <input
//                             type="number"
//                             value={formData.fomo.viewingNow}
//                             onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 } }))}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             placeholder="Viewing now"
//                           />
//                         )}

//                         {formData.fomo.type === 'product_left' && (
//                           <input
//                             type="number"
//                             value={formData.fomo.productLeft}
//                             onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 } }))}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             placeholder="Items left"
//                           />
//                         )}

//                         {formData.fomo.type === 'custom' && (
//                           <div className="flex gap-2">
//                             <input
//                               type="text"
//                               value={formData.fomo.customMessage}
//                               readOnly
//                               placeholder="Custom message"
//                               className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => { setCustomMessage(formData.fomo.customMessage || ''); setShowCustomMessageModal(true); }}
//                               className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
//                             >
//                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Submit Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700"
//                 >
//                   Update
//                 </button>
//               </div>
//             </div>

//           </div>
//         </form>
//       </div>

//       {/* ================= MODALS ================= */}

//       {/* Category Modal */}
//       {showCategoryModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
//             <input
//               type="text"
//               value={newCategory}
//               onChange={(e) => setNewCategory(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Electronics"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
//               <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Brand Modal */}
//       {showBrandModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h3>
//             <input
//               type="text"
//               value={newBrand}
//               onChange={(e) => setNewBrand(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Apple"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button onClick={() => setShowBrandModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
//               <button onClick={handleAddBrand} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Custom Message Modal */}
//       {showCustomMessageModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Enter FOMO Message</h3>
//             <textarea
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               rows="3"
//               placeholder="e.g., Only 5 left in stock!"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button onClick={() => setShowCustomMessageModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
//               <button onClick={handleCustomMessageSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Attribute Modal */}
//       {showAttributeModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add Attribute</h3>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 value={newAttribute.key}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Key (e.g., Material)"
//                 autoFocus
//               />
//               <input
//                 type="text"
//                 value={newAttribute.value}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Value (e.g., Cotton)"
//               />
//             </div>
//             <div className="flex justify-end gap-3 mt-6">
//               <button onClick={() => setShowAttributeModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
//               <button onClick={addAttribute} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ===== VARIANT MODAL ===== */}
//       {showVariantModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-4 z-[60] overflow-y-auto">
//           <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">

//             {/* Header */}
//             <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-indigo-50 rounded-t-2xl">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-900">
//                   {editingVariantIndex !== null ? 'Edit Variant' : 'Add New Variant'}
//                 </h3>
//                 <p className="text-xs text-gray-500 mt-0.5">Define attributes, price, stock and images for this variant</p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => { setShowVariantModal(false); setVariantForm(defaultVariant); setEditingVariantIndex(null); }}
//                 className="p-2 hover:bg-white rounded-xl transition-colors"
//               >
//                 <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="p-5 space-y-5">

//               {/* Attributes */}
//               <div>
//                 <div className="flex items-center justify-between mb-3">
//                   <label className="text-sm font-semibold text-gray-800">
//                     Variant Attributes <span className="text-red-400">*</span>
//                   </label>
//                   <button
//                     type="button"
//                     onClick={addVariantAttribute}
//                     className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium"
//                   >
//                     + Add More
//                   </button>
//                 </div>
//                 <div className="space-y-2">
//                   {variantForm.attributes.map((attr, index) => (
//                     <div key={index} className="flex gap-2 items-center">
//                       <input
//                         type="text"
//                         value={attr.key}
//                         onChange={(e) => updateVariantAttribute(index, 'key', e.target.value)}
//                         className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                         placeholder="Key (e.g., Color)"
//                       />
//                       <input
//                         type="text"
//                         value={attr.value}
//                         onChange={(e) => updateVariantAttribute(index, 'value', e.target.value)}
//                         className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                         placeholder="Value (e.g., Blue)"
//                       />
//                       {variantForm.attributes.length > 1 && (
//                         <button
//                           type="button"
//                           onClick={() => removeVariantAttribute(index)}
//                           className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Pricing */}
//               <div>
//                 <label className="text-sm font-semibold text-gray-800 mb-3 block">
//                   Variant Pricing (₹) <span className="text-red-400">*</span>
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="text-xs text-gray-500 mb-1 block">Base Price (₹)</label>
//                     <input
//                       type="number"
//                       value={variantForm.price.base}
//                       onChange={(e) => setVariantForm(prev => ({ ...prev, price: { ...prev.price, base: e.target.value } }))}
//                       className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                       placeholder="89000"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-gray-500 mb-1 block">Sale Price (₹) <span className="text-gray-400">(optional)</span></label>
//                     <input
//                       type="number"
//                       value={variantForm.price.sale}
//                       onChange={(e) => setVariantForm(prev => ({ ...prev, price: { ...prev.price, sale: e.target.value } }))}
//                       className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                       placeholder="79000"
//                     />
//                   </div>
//                 </div>
//                 {variantForm.price.base && variantForm.price.sale && Number(variantForm.price.sale) < Number(variantForm.price.base) && (
//                   <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
//                     <span>💰</span>
//                     <span>{getDiscountPercentage(variantForm.price.base, variantForm.price.sale)}% discount applied</span>
//                   </div>
//                 )}
//               </div>

//               {/* Inventory */}
//               <div>
//                 <div className="flex items-center justify-between mb-3">
//                   <label className="text-sm font-semibold text-gray-800">Variant Inventory</label>
//                   <button
//                     type="button"
//                     onClick={() => setVariantForm(prev => ({ ...prev, inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory } }))}
//                     className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${variantForm.inventory.trackInventory ? 'bg-indigo-500' : 'bg-gray-300'}`}
//                   >
//                     <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${variantForm.inventory.trackInventory ? 'translate-x-5' : 'translate-x-1'}`} />
//                   </button>
//                 </div>
//                 {variantForm.inventory.trackInventory && (
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
//                       <input
//                         type="number"
//                         value={variantForm.inventory.quantity}
//                         onChange={(e) => setVariantForm(prev => ({ ...prev, inventory: { ...prev.inventory, quantity: parseInt(e.target.value) || 0 } }))}
//                         className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                         placeholder="25"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-xs text-gray-500 mb-1 block">Low Stock Threshold</label>
//                       <input
//                         type="number"
//                         value={variantForm.inventory.lowStockThreshold}
//                         onChange={(e) => setVariantForm(prev => ({ ...prev, inventory: { ...prev.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } }))}
//                         className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:bg-white"
//                         placeholder="5"
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Variant Images */}
//               <div>
//                 <label className="text-sm font-semibold text-gray-800 mb-3 block">
//                   Variant Images <span className="text-gray-400 text-xs font-normal">(up to 4)</span>
//                 </label>
//                 <label
//                   className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all mb-3 ${variantImageDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
//                   onDragOver={(e) => { e.preventDefault(); setVariantImageDragging(true); }}
//                   onDragLeave={() => setVariantImageDragging(false)}
//                   onDrop={(e) => { e.preventDefault(); setVariantImageDragging(false); handleVariantImageUpload({ target: { files: e.dataTransfer.files } }); }}
//                 >
//                   <input
//                     type="file"
//                     multiple
//                     accept="image/*"
//                     onChange={handleVariantImageUpload}
//                     className="hidden"
//                     disabled={variantForm.images.length >= 4}
//                   />
//                   <svg className="w-7 h-7 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   <p className="text-xs text-gray-500">
//                     {variantForm.images.length >= 4 ? 'Max images reached' : `Click or drop images (${variantForm.images.length}/4)`}
//                   </p>
//                 </label>

//                 {variantForm.images.length > 0 && (
//                   <div className="grid grid-cols-4 gap-2">
//                     {variantForm.images.map((image) => (
//                       <div key={image.id} className={`relative rounded-lg overflow-hidden border-2 ${image.isMain ? 'border-indigo-500' : 'border-gray-200'}`}>
//                         <img src={image.url} alt="" className="w-full h-16 object-cover" />
//                         <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
//                           {!image.isMain && (
//                             <button type="button" onClick={() => setVariantMainImage(image.id)} className="p-1 bg-white rounded-full text-indigo-600" title="Set as main">
//                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                               </svg>
//                             </button>
//                           )}
//                           <button type="button" onClick={() => removeVariantImage(image.id)} className="p-1 bg-white rounded-full text-red-500" title="Remove">
//                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                           </button>
//                         </div>
//                         {image.isMain && (
//                           <div className="absolute top-1 left-1">
//                             <span className="text-[9px] bg-indigo-500 text-white px-1 rounded font-medium">MAIN</span>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Active Status */}
//               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                 <div>
//                   <span className="text-sm font-medium text-gray-700">Variant Active</span>
//                   <p className="text-xs text-gray-400">Inactive variants won't show on website</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setVariantForm(prev => ({ ...prev, isActive: !prev.isActive }))}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${variantForm.isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}
//                 >
//                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${variantForm.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
//                 </button>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={() => { setShowVariantModal(false); setVariantForm(defaultVariant); setEditingVariantIndex(null); }}
//                 className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={saveVariant}
//                 className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700"
//               >
//                 {editingVariantIndex !== null ? 'Update Variant' : 'Save Variant'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default EditProductModal;

// // EditProductModal.jsx
// import React, { useState } from 'react';

// const EditProductModal = ({ 
//   product,
//   onClose, 
//   onSave, 
//   categories, 
//   brands, 
//   setCategories, 
//   setBrands,
//   formatIndianRupee,
//   getDiscountPercentage 
// }) => {
//   // ================= FORM STATE with product data =================
//   const [formData, setFormData] = useState({
//     name: product.name || '',
//     title: product.title || '',
//     description: product.description || '',
//     brand: product.brand || 'Generic',
//     category: product.category?._id || '',
//     price: {
//       base: product.price?.base || '',
//       sale: product.price?.sale || '',
//       costPrice: product.price?.costPrice || ''
//     },
//     inventory: {
//       quantity: product.inventory?.quantity || 0,
//       lowStockThreshold: product.inventory?.lowStockThreshold || 5,
//       trackInventory: product.inventory?.trackInventory !== undefined ? product.inventory.trackInventory : true
//     },
//     shipping: {
//       weight: product.shipping?.weight || 0,
//       dimensions: {
//         length: product.shipping?.dimensions?.length || "",
//         width: product.shipping?.dimensions?.width || "",
//         height: product.shipping?.dimensions?.height || ""
//       }
//     },
//     soldInfo: {
//       enabled: product.soldInfo?.enabled || false,
//       count: product.soldInfo?.count || 0
//     },
//     fomo: {
//       enabled: product.fomo?.enabled || false,
//       type: product.fomo?.type || 'viewing_now',
//       viewingNow: product.fomo?.viewingNow || 0,
//       productLeft: product.fomo?.productLeft || 0,
//       customMessage: product.fomo?.customMessage || ''
//     },
//     images: product.images || [],
//     attributes: product.attributes || [],
//     isFeatured: product.isFeatured || false,
//     status: product.status || 'draft'
//   });

//   // ================= UI STATES =================
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [draggedImageIndex, setDraggedImageIndex] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);

//   // ================= MODAL STATES =================
//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showBrandModal, setShowBrandModal] = useState(false);
//   const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
//   const [showAttributeModal, setShowAttributeModal] = useState(false);
  
//   const [newCategory, setNewCategory] = useState('');
//   const [newBrand, setNewBrand] = useState('');
//   const [customMessage, setCustomMessage] = useState('');
//   const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });

//   // ================= IMAGE HANDLING =================
//   const handleImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = [...formData.images];
    
//     files.forEach((file, index) => {
//       if (newImages.length < 5) {
//         const reader = new FileReader();
//         const imageId = `img-${Date.now()}-${index}`;
        
//         setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
        
//         reader.onloadstart = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 10 }));
//         };
        
//         reader.onprogress = (progress) => {
//           if (progress.lengthComputable) {
//             const percent = (progress.loaded / progress.total) * 90 + 10;
//             setUploadProgress(prev => ({ ...prev, [imageId]: percent }));
//           }
//         };
        
//         reader.onloadend = () => {
//           setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));
//           setTimeout(() => {
//             setUploadProgress(prev => {
//               const newProgress = { ...prev };
//               delete newProgress[imageId];
//               return newProgress;
//             });
//           }, 500);
          
//           newImages.push({
//             id: imageId,
//             url: reader.result,
//             file: file,
//             name: file.name,
//             size: file.size,
//             isMain: newImages.length === 0
//           });
          
//           setFormData(prev => ({
//             ...prev,
//             images: newImages
//           }));
//         };
        
//         reader.readAsDataURL(file);
//       }
//     });
//   };

//   const removeImage = (imageId) => {
//     const newImages = formData.images.filter(img => img.id !== imageId);
//     if (formData.images.find(img => img.id === imageId)?.isMain && newImages.length > 0) {
//       newImages[0].isMain = true;
//     }
//     setFormData(prev => ({ ...prev, images: newImages }));
//   };

//   const setMainImage = (imageId) => {
//     setFormData(prev => ({
//       ...prev,
//       images: prev.images.map(img => ({
//         ...img,
//         isMain: img.id === imageId
//       }))
//     }));
//   };

//   const handleImageDragStart = (e, index) => {
//     setDraggedImageIndex(index);
//     e.dataTransfer.effectAllowed = 'move';
//   };

//   const handleImageDragOver = (e, index) => {
//     e.preventDefault();
//     if (draggedImageIndex === null || draggedImageIndex === index) return;
    
//     const newImages = [...formData.images];
//     const draggedImage = newImages[draggedImageIndex];
//     newImages.splice(draggedImageIndex, 1);
//     newImages.splice(index, 0, draggedImage);
//     newImages.forEach((img, idx) => { img.isMain = idx === 0; });
    
//     setFormData(prev => ({ ...prev, images: newImages }));
//     setDraggedImageIndex(index);
//   };

//   const handleImageDragEnd = () => {
//     setDraggedImageIndex(null);
//     setIsDragging(false);
//   };

//   // ================= ATTRIBUTES HANDLING =================
//   const addAttribute = () => {
//     if (newAttribute.key && newAttribute.value) {
//       setFormData(prev => ({
//         ...prev,
//         attributes: [...prev.attributes, { ...newAttribute, id: Date.now() }]
//       }));
//       setNewAttribute({ key: '', value: '' });
//       setShowAttributeModal(false);
//     }
//   };

//   const removeAttribute = (attributeId) => {
//     setFormData(prev => ({
//       ...prev,
//       attributes: prev.attributes.filter(attr => attr.id !== attributeId)
//     }));
//   };

//   // ================= CATEGORY & BRAND HANDLING =================
//   const handleAddCategory = () => {
//     if (newCategory.trim()) {
//       const newCat = { _id: Date.now().toString(), name: newCategory };
//       setCategories([...categories, newCat]);
//       setFormData(prev => ({ ...prev, category: newCat._id }));
//       setNewCategory('');
//       setShowCategoryModal(false);
//     }
//   };

//   const handleAddBrand = () => {
//     if (newBrand.trim()) {
//       setBrands([...brands, newBrand]);
//       setFormData(prev => ({ ...prev, brand: newBrand }));
//       setNewBrand('');
//       setShowBrandModal(false);
//     }
//   };

//   // ================= FOMO CUSTOM MESSAGE =================
//   const handleCustomMessageSave = () => {
//     if (customMessage.trim()) {
//       setFormData(prev => ({
//         ...prev,
//         fomo: { ...prev.fomo, customMessage }
//       }));
//       setCustomMessage('');
//       setShowCustomMessageModal(false);
//     }
//   };

//   // ================= FORM HANDLING =================
//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [parent, child] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
//       }));
//     } else if (name.includes('shipping.dimensions.')) {
//       const dimension = name.split('.')[2];
//       setFormData(prev => ({
//         ...prev,
//         shipping: {
//           ...prev.shipping,
//           dimensions: {
//             ...prev.shipping.dimensions,
//             [dimension]: value
//           }
//         }
//       }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     const categoryObj = categories.find(c => c._id === formData.category);
    
//     const updatedProduct = {
//       ...formData,
//       _id: product._id,
//       category: categoryObj,
//       createdAt: product.createdAt,
//       inventory: { ...formData.inventory },
//       shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions } },
//       soldInfo: { ...formData.soldInfo },
//       fomo: { ...formData.fomo }
//     };
    
//     onSave(updatedProduct);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
//       <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">
//         {/* Modal Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Update your product details
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
//           >
//             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Modal Body - Form */}
//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="grid grid-cols-3 gap-6">
//             {/* Left Column - Basic Info */}
//             <div className="col-span-2 space-y-6">
//               {/* Basic Details Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Essential Details</h3>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Product Name <span className="text-red-400">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={formData.name}
//                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="e.g., Premium Wireless Headphones"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Title <span className="text-red-400">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="title"
//                         value={formData.title}
//                         onChange={handleInputChange}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="e.g., Noise Cancelling Headphones"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Description <span className="text-red-400">*</span>
//                     </label>
//                     <textarea
//                       name="description"
//                       value={formData.description}
//                       onChange={handleInputChange}
//                       rows="3"
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
//                       placeholder="Describe your product in detail..."
//                       required
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Category
//                       </label>
//                       <div className="flex gap-2">
//                         <select
//                           name="category"
//                           value={formData.category}
//                           onChange={handleInputChange}
//                           className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                         >
//                           <option value="">Select category</option>
//                           {categories.map(cat => (
//                             <option key={cat._id} value={cat._id}>{cat.name}</option>
//                           ))}
//                         </select>
//                         <button
//                           type="button"
//                           onClick={() => setShowCategoryModal(true)}
//                           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Brand
//                       </label>
//                       <div className="flex gap-2">
//                         <select
//                           name="brand"
//                           value={formData.brand}
//                           onChange={handleInputChange}
//                           className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                         >
//                           {brands.map(brand => (
//                             <option key={brand} value={brand}>{brand}</option>
//                           ))}
//                         </select>
//                         <button
//                           type="button"
//                           onClick={() => setShowBrandModal(true)}
//                           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Pricing Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
//                 </div>
//                 <div className="p-4">
//                   <div className="grid grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         MRP / Base Price (₹)
//                       </label>
//                       <input
//                         type="number"
//                         value={formData.price.base}
//                         onChange={(e) => setFormData({
//                           ...formData,
//                           price: { ...formData.price, base: e.target.value }
//                         })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="29999"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Sale Price (₹)
//                       </label>
//                       <input
//                         type="number"
//                         value={formData.price.sale}
//                         onChange={(e) => setFormData({
//                           ...formData,
//                           price: { ...formData.price, sale: e.target.value }
//                         })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="19999"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Cost Price (₹)
//                       </label>
//                       <input
//                         type="number"
//                         value={formData.price.costPrice}
//                         onChange={(e) => setFormData({
//                           ...formData,
//                           price: { ...formData.price, costPrice: e.target.value }
//                         })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                         placeholder="15000"
//                       />
//                     </div>
//                   </div>
                  
//                   {/* Price Preview */}
//                   {formData.price.base && formData.price.sale && (
//                     <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                       <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
//                       <div className="flex items-center space-x-3">
//                         <span className="text-gray-400 line-through">
//                           {formatIndianRupee(formData.price.base)}
//                         </span>
//                         <span className="text-lg font-bold text-gray-900">
//                           {formatIndianRupee(formData.price.sale)}
//                         </span>
//                         {formData.price.sale < formData.price.base && (
//                           <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                             {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Inventory Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                   <h3 className="font-semibold text-gray-900">Inventory Management</h3>
//                   <button
//                     type="button"
//                     onClick={() => setFormData(prev => ({
//                       ...prev,
//                       inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory }
//                     }))}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                       formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'
//                     }`}
//                   >
//                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'
//                     }`} />
//                   </button>
//                 </div>
//                 {formData.inventory.trackInventory && (
//                   <div className="p-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Quantity in Stock
//                         </label>
//                         <input
//                           type="number"
//                           value={formData.inventory.quantity}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 }
//                           })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="0"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Low Stock Threshold
//                         </label>
//                         <input
//                           type="number"
//                           value={formData.inventory.lowStockThreshold}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 }
//                           })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="5"
//                         />
//                       </div>
//                     </div>
//                     <p className="text-xs text-gray-500 mt-2">
//                       Low stock alert will show when quantity is below threshold
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Shipping Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Shipping Details</h3>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Weight (kg)
//                     </label>
//                     <input
//                       type="number"
//                       step="0.1"
//                       value={formData.shipping.weight ?? ""}
//                       onChange={(e) => setFormData({
//                         ...formData,
//                         shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 }
//                       })}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                       placeholder="0.5"
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Dimensions (cm)
//                     </label>
//                     <div className="grid grid-cols-3 gap-2">
//                       <div>
//                         <input
//                           type="number"
//                           value={formData.shipping.dimensions.length ?? ""}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             shipping: {
//                               ...formData.shipping,
//                               dimensions: { ...formData.shipping.dimensions, length: parseFloat(e.target.value) }
//                             }
//                           })}
//                           className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="Length"
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           value={formData.shipping.dimensions.width ?? ""}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             shipping: {
//                               ...formData.shipping,
//                               dimensions: { ...formData.shipping.dimensions, width: parseFloat(e.target.value) }
//                             }
//                           })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="Width"
//                         />
//                       </div>
//                       <div>
//                         <input
//                           type="number"
//                           value={formData.shipping.dimensions.height ?? ""}
//                           onChange={(e) => setFormData({
//                             ...formData,
//                             shipping: {
//                               ...formData.shipping,
//                               dimensions: { ...formData.shipping.dimensions, height: parseFloat(e.target.value) }
//                             }
//                           })}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                           placeholder="Height"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Attributes Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                   <h3 className="font-semibold text-gray-900">Product Attributes</h3>
//                   <button
//                     type="button"
//                     onClick={() => setShowAttributeModal(true)}
//                     className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
//                   >
//                     + Add Attribute
//                   </button>
//                 </div>
//                 <div className="p-4">
//                   {formData.attributes.length === 0 ? (
//                     <p className="text-center text-gray-500 py-4">No attributes added yet</p>
//                   ) : (
//                     <div className="space-y-2">
//                       {formData.attributes.map((attr) => (
//                         <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
//                             <span className="text-sm text-gray-600">{attr.value}</span>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => removeAttribute(attr.id)}
//                             className="text-gray-400 hover:text-red-500"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Images & Marketing */}
//             <div className="space-y-6">
//               {/* Image Upload Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Product Gallery</h3>
//                   <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
//                 </div>
//                 <div className="p-4">
//                   <label className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
//                     isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
//                   }`}
//                   onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                   onDragLeave={() => setIsDragging(false)}
//                   onDrop={(e) => {
//                     e.preventDefault();
//                     setIsDragging(false);
//                     handleImageUpload({ target: { files: e.dataTransfer.files } });
//                   }}>
//                     <input
//                       type="file"
//                       multiple
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       className="hidden"
//                       disabled={formData.images.length >= 5}
//                     />
//                     <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                     <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
//                   </label>

//                   {formData.images.length > 0 && (
//                     <div className="mt-4 space-y-2">
//                       {formData.images.map((image, index) => (
//                         <div
//                           key={image.id}
//                           draggable
//                           onDragStart={(e) => handleImageDragStart(e, index)}
//                           onDragOver={(e) => handleImageDragOver(e, index)}
//                           onDragEnd={handleImageDragEnd}
//                           className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 ${
//                             image.isMain ? 'border-blue-500' : 'border-transparent'
//                           }`}
//                         >
//                           <div className="w-12 h-12 rounded overflow-hidden bg-white">
//                             <img src={image.url} alt="" className="w-full h-full object-cover" />
//                           </div>
//                           <div className="flex-1 text-xs truncate">{image.name}</div>
//                           <div className="flex items-center space-x-1">
//                             {!image.isMain && (
//                               <button
//                                 type="button"
//                                 onClick={() => setMainImage(image.id)}
//                                 className="p-1 text-gray-500 hover:text-blue-600"
//                                 title="Make main"
//                               >
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                                 </svg>
//                               </button>
//                             )}
//                             <button
//                               type="button"
//                               onClick={() => removeImage(image.id)}
//                               className="p-1 text-gray-500 hover:text-red-600"
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                               </svg>
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Marketing Card */}
//               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 bg-gray-50">
//                   <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   {/* Featured Toggle */}
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-medium text-gray-700">Featured Product</span>
//                     <button
//                       type="button"
//                       onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
//                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                         formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'
//                       }`}
//                     >
//                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                         formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
//                       }`} />
//                     </button>
//                   </div>

//                   {/* Status */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//                     <select
//                       name="status"
//                       value={formData.status}
//                       onChange={handleInputChange}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="active">Active</option>
//                       <option value="archived">Archived</option>
//                     </select>
//                   </div>

//                   {/* Sold Info */}
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium text-gray-700">Sold Info</span>
//                       <button
//                         type="button"
//                         onClick={() => setFormData(prev => ({
//                           ...prev,
//                           soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled }
//                         }))}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                           formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'
//                         }`}
//                       >
//                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                           formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'
//                         }`} />
//                       </button>
//                     </div>
//                     {formData.soldInfo.enabled && (
//                       <input
//                         type="number"
//                         value={formData.soldInfo.count}
//                         onChange={(e) => setFormData(prev => ({
//                           ...prev,
//                           soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 }
//                         }))}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                         placeholder="Number sold"
//                       />
//                     )}
//                   </div>

//                   {/* FOMO */}
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium text-gray-700">FOMO</span>
//                       <button
//                         type="button"
//                         onClick={() => setFormData(prev => ({
//                           ...prev,
//                           fomo: { ...prev.fomo, enabled: !prev.fomo.enabled }
//                         }))}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                           formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'
//                         }`}
//                       >
//                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                           formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'
//                         }`} />
//                       </button>
//                     </div>
//                     {formData.fomo.enabled && (
//                       <div className="space-y-2">
//                         <select
//                           value={formData.fomo.type}
//                           onChange={(e) => setFormData(prev => ({
//                             ...prev,
//                             fomo: { ...prev.fomo, type: e.target.value }
//                           }))}
//                           className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                         >
//                           <option value="viewing_now">Viewing Now</option>
//                           <option value="product_left">Product Left</option>
//                           <option value="custom">Custom</option>
//                         </select>

//                         {formData.fomo.type === 'viewing_now' && (
//                           <input
//                             type="number"
//                             value={formData.fomo.viewingNow}
//                             onChange={(e) => setFormData(prev => ({
//                               ...prev,
//                               fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 }
//                             }))}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             placeholder="Viewing now"
//                           />
//                         )}

//                         {formData.fomo.type === 'product_left' && (
//                           <input
//                             type="number"
//                             value={formData.fomo.productLeft}
//                             onChange={(e) => setFormData(prev => ({
//                               ...prev,
//                               fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 }
//                             }))}
//                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             placeholder="Items left"
//                           />
//                         )}

//                         {formData.fomo.type === 'custom' && (
//                           <div className="flex gap-2">
//                             <input
//                               type="text"
//                               value={formData.fomo.customMessage}
//                               readOnly
//                               placeholder="Custom message"
//                               className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 setCustomMessage(formData.fomo.customMessage || '');
//                                 setShowCustomMessageModal(true);
//                               }}
//                               className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
//                             >
//                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                               </svg>
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Submit Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700"
//                 >
//                   Update
//                 </button>
//               </div>
//             </div>
//           </div>
//         </form>
//       </div>

//       {/* ================= MODALS ================= */}
      
//       {/* Category Modal */}
//       {showCategoryModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
//             <input
//               type="text"
//               value={newCategory}
//               onChange={(e) => setNewCategory(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Electronics"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowCategoryModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddCategory}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Brand Modal */}
//       {showBrandModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h3>
//             <input
//               type="text"
//               value={newBrand}
//               onChange={(e) => setNewBrand(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               placeholder="e.g., Apple"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowBrandModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddBrand}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Custom Message Modal */}
//       {showCustomMessageModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Enter FOMO Message</h3>
//             <textarea
//               value={customMessage}
//               onChange={(e) => setCustomMessage(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//               rows="3"
//               placeholder="e.g., Only 5 left in stock!"
//               autoFocus
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowCustomMessageModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCustomMessageSave}
//                 className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Attribute Modal */}
//       {showAttributeModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Add Attribute</h3>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 value={newAttribute.key}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Key (e.g., Material)"
//               />
//               <input
//                 type="text"
//                 value={newAttribute.value}
//                 onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
//                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
//                 placeholder="Value (e.g., Cotton)"
//               />
//             </div>
//             <div className="flex justify-end gap-3 mt-6">
//               <button
//                 onClick={() => setShowAttributeModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={addAttribute}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EditProductModal;