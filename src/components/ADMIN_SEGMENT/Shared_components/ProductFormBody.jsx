// Shared_components/ProductFormBody.jsx
//
// BARCODE RULES:
//  • Product-level barcode: optional field in Essential Details (stored locally,
//    NOT sent to backend — backend doesn't have a product.barcode field)
//  • Variant-level barcode: REQUIRED by backend for each variant
//    Shown in variant list, managed inside VariantModal
//
// productSlug prop (from EditProductModal only):
//  • When set → variant DELETE hits API directly via deleteVariantFromProduct thunk
//  • When not set (create flow) → delegates to parent's onDeleteVariant (local state)

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteVariantFromProduct } from '../ADMIN_REDUX_MANAGEMENT/adminProductsSlice';

const ProductFormBody = ({
  formData,
  setFormData,
  categories,
  brands,
  onOpenCategoryModal,
  onOpenBrandModal,
  onOpenAttributeModal,
  onOpenCustomMessage,
  onOpenAddVariant,
  onOpenEditVariant,
  onRemoveAttribute,
  onDeleteVariant,        // create mode: local state
  onToggleVariantActive,
  formatIndianRupee,
  getDiscountPercentage,
  productSlug,            // edit mode: enables direct API calls
}) => {

  const dispatch = useDispatch();
  const { actionLoading, actionError } = useSelector(s => s.adminProducts);

  // Image state
  const [uploadProgress,    setUploadProgress]    = useState({});
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [isDragging,        setIsDragging]        = useState(false);

  // ── Image handlers ────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const files    = Array.from(e.target.files);
    const newImages = [...formData.images];
    files.forEach((file, index) => {
      if (newImages.length < 5) {
        const reader  = new FileReader();
        const imageId = `img-${Date.now()}-${index}`;
        setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
        reader.onloadstart = () => setUploadProgress(prev => ({ ...prev, [imageId]: 10 }));
        reader.onprogress  = (p) => {
          if (p.lengthComputable)
            setUploadProgress(prev => ({ ...prev, [imageId]: (p.loaded / p.total) * 90 + 10 }));
        };
        reader.onloadend = () => {
          setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));
          setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[imageId]; return n; }), 500);
          newImages.push({ id: imageId, url: reader.result, file, name: file.name, size: file.size, isMain: newImages.length === 0 });
          setFormData(prev => ({ ...prev, images: [...newImages] }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    const newImages = formData.images.filter(img => img.id !== imageId);
    if (formData.images.find(img => img.id === imageId)?.isMain && newImages.length > 0) newImages[0].isMain = true;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const setMainImage = (imageId) =>
    setFormData(prev => ({ ...prev, images: prev.images.map(img => ({ ...img, isMain: img.id === imageId })) }));

  const handleImageDragStart = (e, index) => { setDraggedImageIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleImageDragOver  = (e, index) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    const imgs   = [...formData.images];
    const dragged = imgs[draggedImageIndex];
    imgs.splice(draggedImageIndex, 1);
    imgs.splice(index, 0, dragged);
    imgs.forEach((img, idx) => { img.isMain = idx === 0; });
    setFormData(prev => ({ ...prev, images: imgs }));
    setDraggedImageIndex(index);
  };
  const handleImageDragEnd = () => { setDraggedImageIndex(null); setIsDragging(false); };

  // ── Input change handler ──────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('shipping.dimensions.')) {
      const dim = name.split('.')[2];
      setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, dimensions: { ...prev.shipping.dimensions, [dim]: value } } }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  // ── Variant delete ────────────────────────────────────────────
  // Edit mode (productSlug set): DELETE /admin/products/:slug/variants { barcode }
  // Create mode: local state via onDeleteVariant
  const handleDeleteVariant = (index) => {
    const variant = formData.variants[index];

    if (productSlug) {
      // EDIT MODE — hit real API
      if (!variant?.barcode && variant?.barcode !== 0) {
        alert("Cannot delete — variant has no barcode");
        return;
      }
      if (!window.confirm(`Delete variant with barcode ${variant.barcode}? This cannot be undone.`)) return;

      dispatch(deleteVariantFromProduct({ slug: productSlug, barcode: variant.barcode }))
        .unwrap()
        .then(({ product: updatedProduct }) => {
          // Sync formData variants from backend response
          setFormData(prev => ({
            ...prev,
            variants: (updatedProduct.variants || []).map((v) => ({
              ...v,
              price:  { base: v.price?.base ?? '', sale: v.price?.sale ?? '' },
              images: v.images || [],
            })),
          }));
        })
        .catch((err) => {
          alert(`Failed to delete variant: ${err}`);
        });
    } else {
      // CREATE MODE — local state
      onDeleteVariant(index);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* ════════════ LEFT COLUMN ════════════ */}
      <div className="col-span-2 space-y-6">

        {/* Essential Details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Essential Details</h3>
          </div>
          <div className="p-4 space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Premium Wireless Headphones" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" name="title" value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Noise Cancelling Headphones" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description" value={formData.description} onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe your product in detail..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex gap-2">
                  <select name="category" value={formData.category} onChange={handleInputChange}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={onOpenCategoryModal} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <div className="flex gap-2">
                  <select name="brand" value={formData.brand} onChange={handleInputChange}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <button type="button" onClick={onOpenBrandModal} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── PRODUCT-LEVEL BARCODE ──────────────────────────
                Optional. Stored locally in formData.
                NOT sent to backend (backend has no product.barcode field).
                Useful for internal reference / future API.
                Variant-level barcodes are separate (inside each variant).
            ─────────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Barcode
                <span className="ml-2 text-xs font-normal text-gray-400">(optional — internal reference, separate from variant barcodes)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 5h2M3 9h2M3 13h2M3 17h2M3 19h2 M7 5v14M10 5v14M13 5v4M13 11v8 M16 5v14M19 5h2M19 9h2M19 13h2M19 17h2M19 19h2" />
                  </svg>
                </div>
                <input
                  type="text" value={formData.barcode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-sm"
                  placeholder="e.g., 1234567890128"
                  maxLength={20} />
                {formData.barcode && (
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, barcode: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {formData.barcode && (
                <p className="text-xs text-blue-600 mt-1 font-mono">📦 {formData.barcode}</p>
              )}
            </div>

          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MRP / Base Price (₹)</label>
                <input type="number" value={formData.price.base}
                  onChange={(e) => setFormData({ ...formData, price: { ...formData.price, base: e.target.value } })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="29999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (₹)</label>
                <input type="number" value={formData.price.sale}
                  onChange={(e) => setFormData({ ...formData, price: { ...formData.price, sale: e.target.value } })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="19999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
                <input type="number" value={formData.price.costPrice}
                  onChange={(e) => setFormData({ ...formData, price: { ...formData.price, costPrice: e.target.value } })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="15000" />
              </div>
            </div>
            {formData.price.base && formData.price.sale && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 line-through">{formatIndianRupee(formData.price.base)}</span>
                  <span className="text-lg font-bold text-gray-900">{formatIndianRupee(formData.price.sale)}</span>
                  {Number(formData.price.sale) < Number(formData.price.base) && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Inventory Management</h3>
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory } }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {formData.inventory.trackInventory && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity in Stock</label>
                  <input type="number" value={formData.inventory.quantity}
                    onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 } })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                  <input type="number" value={formData.inventory.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                    placeholder="5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Low stock alert shows when quantity falls below threshold</p>
            </div>
          )}
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Shipping Details</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input type="number" step="0.1" value={formData.shipping.weight ?? ''}
                onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 } })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                placeholder="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-2">
                {['length', 'width', 'height'].map(dim => (
                  <input key={dim} type="number"
                    value={formData.shipping.dimensions?.[dim] ?? ''}
                    onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, [dim]: parseFloat(e.target.value) } } })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                    placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Product Attributes</h3>
            <button type="button" onClick={onOpenAttributeModal} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
              + Add Attribute
            </button>
          </div>
          <div className="p-4">
            {formData.attributes.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No attributes added yet</p>
            ) : (
              <div className="space-y-2">
                {formData.attributes.map((attr) => (
                  <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
                      <span className="text-sm text-gray-600">{attr.value}</span>
                    </div>
                    <button type="button" onClick={() => onRemoveAttribute(attr.id)} className="text-gray-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Product Variants</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {productSlug
                  ? 'Add → API immediately • Edit → updates price & inventory • Delete → API immediately'
                  : 'e.g., different colors, sizes — each needs a unique barcode'}
              </p>
            </div>
            <button type="button" onClick={onOpenAddVariant} disabled={actionLoading && !!productSlug}
              className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Variant
            </button>
          </div>
          <div className="p-4">

            {/* Action error in edit mode */}
            {actionError && productSlug && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">❌ {actionError}</p>
              </div>
            )}

            {formData.variants.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 text-sm">No variants added yet</p>
                <p className="text-gray-400 text-xs mt-1">Click "Add Variant" — each variant needs a unique barcode</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div
                    key={variant._id || variant.barcode || index}
                    className={`rounded-lg border-2 p-3 transition-all ${
                      variant.isActive !== false ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Attribute badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(variant.attributes || []).map((attr, aIdx) => (
                            <span key={aIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              {attr.key}: {attr.value}
                            </span>
                          ))}
                        </div>

                        {/* Price row */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
                          <span className="font-semibold text-gray-900">
                            ₹{Number(variant.price?.base || 0).toLocaleString('en-IN')}
                          </span>
                          {variant.price?.sale && Number(variant.price.sale) > 0 && (
                            <>
                              <span className="text-gray-400 line-through text-xs">
                                ₹{Number(variant.price.sale).toLocaleString('en-IN')}
                              </span>
                              {Number(variant.price.sale) < Number(variant.price.base) && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  {getDiscountPercentage(variant.price.base, variant.price.sale)}% OFF
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-600 text-xs">Qty: {variant.inventory?.quantity ?? 0}</span>

                          {/* VARIANT BARCODE BADGE — always visible */}
                          {(variant.barcode || variant.barcode === 0) && (
                            <>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs font-mono text-gray-700 bg-white border border-gray-300 px-1.5 py-0.5 rounded">
                                📦 {variant.barcode}
                              </span>
                            </>
                          )}
                          {/* Missing barcode warning (create mode only) */}
                          {!variant.barcode && variant.barcode !== 0 && !productSlug && (
                            <>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">⚠️ No barcode</span>
                            </>
                          )}

                          {/* SKU */}
                          {variant.sku && (
                            <>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs font-mono text-gray-400">SKU: {variant.sku}</span>
                            </>
                          )}
                        </div>

                        {/* Image thumbnails */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {variant.images.slice(0, 3).map((img, iIdx) => (
                              <div key={iIdx} className="w-8 h-8 rounded overflow-hidden border border-indigo-200">
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {variant.images.length > 3 && (
                              <span className="text-xs text-gray-400">+{variant.images.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Active toggle */}
                        <button type="button"
                          onClick={() => onToggleVariantActive(index)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            variant.isActive !== false ? 'bg-indigo-500' : 'bg-gray-300'
                          }`}
                          title={variant.isActive !== false ? 'Active' : 'Inactive'}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            variant.isActive !== false ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>

                        {/* Edit */}
                        <button type="button"
                          onClick={() => onOpenEditVariant(index)}
                          disabled={actionLoading && !!productSlug}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit variant">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button type="button"
                          onClick={() => handleDeleteVariant(index)}
                          disabled={actionLoading && !!productSlug}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete variant">
                          {actionLoading && productSlug ? (
                            <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <p className="text-xs text-gray-400 text-center pt-1">
                  {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''}
                  {productSlug && <span className="ml-2 text-indigo-400">• Add/delete saves immediately to DB</span>}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ════════════ RIGHT COLUMN ════════════ */}
      <div className="space-y-6">

        {/* Product Gallery */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Product Gallery</h3>
            <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
          </div>
          <div className="p-4">
            <label
              className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageUpload({ target: { files: e.dataTransfer.files } }); }}>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={formData.images.length >= 5} />
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
            </label>
            {formData.images.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.images.map((image, index) => (
                  <div key={image.id} draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragOver={(e)  => handleImageDragOver(e, index)}
                    onDragEnd={handleImageDragEnd}
                    className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 cursor-grab ${image.isMain ? 'border-blue-500' : 'border-transparent'}`}>
                    <div className="w-12 h-12 rounded overflow-hidden bg-white flex-shrink-0">
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-xs truncate">{image.name}</div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {!image.isMain && (
                        <button type="button" onClick={() => setMainImage(image.id)} className="p-1 text-gray-500 hover:text-blue-600" title="Make main">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(image.id)} className="p-1 text-gray-500 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Marketing & Visibility */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
          </div>
          <div className="p-4 space-y-4">

            {/* Featured */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Featured Product</span>
              <button type="button"
                onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Sold Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sold Info</span>
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {formData.soldInfo.enabled && (
                <input type="number" value={formData.soldInfo.count}
                  onChange={(e) => setFormData(prev => ({ ...prev, soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  placeholder="Number sold" />
              )}
            </div>

            {/* FOMO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">FOMO</span>
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, enabled: !prev.fomo.enabled } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {formData.fomo.enabled && (
                <div className="space-y-2">
                  <select value={formData.fomo.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, type: e.target.value } }))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <option value="viewing_now">Viewing Now</option>
                    <option value="product_left">Product Left</option>
                    <option value="custom">Custom</option>
                  </select>
                  {formData.fomo.type === 'viewing_now' && (
                    <input type="number" value={formData.fomo.viewingNow}
                      onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      placeholder="Viewing now" />
                  )}
                  {formData.fomo.type === 'product_left' && (
                    <input type="number" value={formData.fomo.productLeft}
                      onChange={(e) => setFormData(prev => ({ ...prev, fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      placeholder="Items left" />
                  )}
                  {formData.fomo.type === 'custom' && (
                    <div className="flex gap-2">
                      <input type="text" value={formData.fomo.customMessage} readOnly
                        placeholder="Custom message"
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                      <button type="button" onClick={() => onOpenCustomMessage(formData.fomo.customMessage || '')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductFormBody;

// ADD THE BARCODE API INTEGRATION DOWN CODE JUST HAVE INPUT FIELDS

// import React, { useState } from 'react';

// // ============================================================
// // ProductFormBody — receives formData + setFormData from parent
// // Owns its own image upload state (uploadProgress, draggedImageIndex, isDragging)
// // All modal open triggers passed as props from parent
// // ============================================================

// const ProductFormBody = ({
//   formData,
//   setFormData,
//   categories,
//   brands,
//   onOpenCategoryModal,
//   onOpenBrandModal,
//   onOpenAttributeModal,
//   onOpenCustomMessage,
//   onOpenAddVariant,
//   onOpenEditVariant,
//   onRemoveAttribute,
//   onDeleteVariant,
//   onToggleVariantActive,
//   formatIndianRupee,
//   getDiscountPercentage,
// }) => {

//   // ================= IMAGE STATE =================
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [draggedImageIndex, setDraggedImageIndex] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);

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

//   // ================= handleInputChange =================
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

//   // ============================================================
//   return (
//     <div className="grid grid-cols-3 gap-6">

//       {/* ===== LEFT COLUMN ===== */}
//       <div className="col-span-2 space-y-6">

//         {/* Essential Details Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Essential Details</h3>
//           </div>
//           <div className="p-4 space-y-4">

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Product Name <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g., Premium Wireless Headphones"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Title <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g., Noise Cancelling Headphones"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Description <span className="text-red-400">*</span>
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 rows="3"
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
//                 placeholder="Describe your product in detail..."
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
//                 <div className="flex gap-2">
//                   <select
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select category</option>
//                     {categories.map(cat => (
//                       <option key={cat._id} value={cat._id}>{cat.name}</option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={onOpenCategoryModal}
//                     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
//                 <div className="flex gap-2">
//                   <select
//                     name="brand"
//                     value={formData.brand}
//                     onChange={handleInputChange}
//                     className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     {brands.map(brand => (
//                       <option key={brand} value={brand}>{brand}</option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={onOpenBrandModal}
//                     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* ── Product-level Barcode ── */}
//             {/* LOCAL ONLY: not sent to backend. When API is ready, add
//                 fd.append("barcode", formData.barcode || "") in buildProductFormData */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Product Barcode
//                 <span className="ml-2 text-xs font-normal text-gray-400">(optional — stored locally)</span>
//               </label>
//               <div className="relative">
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                       d="M3 5h2M3 9h2M3 13h2M3 17h2M3 19h2
//                          M7 5v14M10 5v14M13 5v4M13 11v8
//                          M16 5v14M19 5h2M19 9h2M19 13h2M19 17h2M19 19h2" />
//                   </svg>
//                 </div>
//                 <input
//                   type="text"
//                   value={formData.barcode || ''}
//                   onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
//                   className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-sm"
//                   placeholder="e.g., 1234567890128"
//                   maxLength={20}
//                 />
//                 {formData.barcode && (
//                   <button
//                     type="button"
//                     onClick={() => setFormData(prev => ({ ...prev, barcode: '' }))}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//               {formData.barcode && (
//                 <p className="text-xs text-blue-600 mt-1 font-mono">📦 {formData.barcode}</p>
//               )}
//             </div>

//           </div>
//         </div>

//         {/* Pricing Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
//           </div>
//           <div className="p-4">
//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">MRP / Base Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.base}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, base: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="29999"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.sale}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, sale: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="19999"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.costPrice}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, costPrice: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="15000"
//                 />
//               </div>
//             </div>

//             {formData.price.base && formData.price.sale && (
//               <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                 <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
//                 <div className="flex items-center space-x-3">
//                   <span className="text-gray-400 line-through">{formatIndianRupee(formData.price.base)}</span>
//                   <span className="text-lg font-bold text-gray-900">{formatIndianRupee(formData.price.sale)}</span>
//                   {formData.price.sale < formData.price.base && (
//                     <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                       {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Inventory Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <h3 className="font-semibold text-gray-900">Inventory Management</h3>
//             <button
//               type="button"
//               onClick={() => setFormData(prev => ({
//                 ...prev,
//                 inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory }
//               }))}
//               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                 formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'
//               }`}
//             >
//               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                 formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'
//               }`} />
//             </button>
//           </div>
//           {formData.inventory.trackInventory && (
//             <div className="p-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Quantity in Stock</label>
//                   <input
//                     type="number"
//                     value={formData.inventory.quantity}
//                     onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 } })}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                     placeholder="0"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
//                   <input
//                     type="number"
//                     value={formData.inventory.lowStockThreshold}
//                     onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } })}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                     placeholder="5"
//                   />
//                 </div>
//               </div>
//               <p className="text-xs text-gray-500 mt-2">Low stock alert will show when quantity is below threshold</p>
//             </div>
//           )}
//         </div>

//         {/* Shipping Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Shipping Details</h3>
//           </div>
//           <div className="p-4 space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
//               <input
//                 type="number"
//                 step="0.1"
//                 value={formData.shipping.weight ?? ''}
//                 onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 } })}
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                 placeholder="0.5"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
//               <div className="grid grid-cols-3 gap-2">
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.length ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, length: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Length"
//                 />
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.width ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, width: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Width"
//                 />
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.height ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, height: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Height"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Attributes Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <h3 className="font-semibold text-gray-900">Product Attributes</h3>
//             <button
//               type="button"
//               onClick={onOpenAttributeModal}
//               className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
//             >
//               + Add Attribute
//             </button>
//           </div>
//           <div className="p-4">
//             {formData.attributes.length === 0 ? (
//               <p className="text-center text-gray-500 py-4">No attributes added yet</p>
//             ) : (
//               <div className="space-y-2">
//                 {formData.attributes.map((attr) => (
//                   <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//                     <div className="flex items-center space-x-2">
//                       <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
//                       <span className="text-sm text-gray-600">{attr.value}</span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => onRemoveAttribute(attr.id)}
//                       className="text-gray-400 hover:text-red-500"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Variants Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <div>
//               <h3 className="font-semibold text-gray-900">Product Variants</h3>
//               <p className="text-xs text-gray-500 mt-0.5">e.g., different colors, sizes with own price & stock</p>
//             </div>
//             <button
//               type="button"
//               onClick={onOpenAddVariant}
//               className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 flex items-center gap-1.5"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               Add Variant
//             </button>
//           </div>
//           <div className="p-4">
//             {formData.variants.length === 0 ? (
//               <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
//                 <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                 </svg>
//                 <p className="text-gray-500 text-sm">No variants added yet</p>
//                 <p className="text-gray-400 text-xs mt-1">Click "Add Variant" to add color, size or other variants</p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {formData.variants.map((variant, index) => (
//                   <div
//                     key={index}
//                     className={`rounded-lg border-2 p-3 transition-all ${
//                       variant.isActive ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50 opacity-60'
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex-1 min-w-0">

//                         {/* Attribute badges */}
//                         <div className="flex flex-wrap gap-1.5 mb-2">
//                           {variant.attributes.map((attr, aIdx) => (
//                             <span key={aIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
//                               {attr.key}: {attr.value}
//                             </span>
//                           ))}
//                         </div>

//                         {/* Price row */}
//                         <div className="flex items-center gap-3 text-sm">
//                           <span className="font-semibold text-gray-900">
//                             ₹{Number(variant.price.base).toLocaleString('en-IN')}
//                           </span>
//                           {variant.price.sale && (
//                             <>
//                               <span className="text-gray-400 line-through text-xs">
//                                 ₹{Number(variant.price.sale).toLocaleString('en-IN')}
//                               </span>
//                               {variant.price.sale < variant.price.base && (
//                                 <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
//                                   {getDiscountPercentage(variant.price.base, variant.price.sale)}% OFF
//                                 </span>
//                               )}
//                             </>
//                           )}
//                           <span className="text-gray-400 text-xs">•</span>
//                           <span className="text-gray-600 text-xs">Qty: {variant.inventory.quantity}</span>
//                           {/* Show barcode badge if present */}
//                           {variant.barcode && (
//                             <>
//                               <span className="text-gray-400 text-xs">•</span>
//                               <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
//                                 📦 {variant.barcode}
//                               </span>
//                             </>
//                           )}
//                         </div>

//                         {/* Image thumbnails */}
//                         {variant.images && variant.images.length > 0 && (
//                           <div className="flex items-center gap-2 mt-2">
//                             {variant.images.slice(0, 3).map((img, iIdx) => (
//                               <div key={iIdx} className="w-8 h-8 rounded overflow-hidden border border-indigo-200">
//                                 <img src={img.url} alt="" className="w-full h-full object-cover" />
//                               </div>
//                             ))}
//                             {variant.images.length > 3 && (
//                               <span className="text-xs text-gray-400">+{variant.images.length - 3} more</span>
//                             )}
//                           </div>
//                         )}
//                       </div>

//                       {/* Actions */}
//                       <div className="flex items-center gap-2 flex-shrink-0">
//                         <button
//                           type="button"
//                           onClick={() => onToggleVariantActive(index)}
//                           className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
//                             variant.isActive ? 'bg-indigo-500' : 'bg-gray-300'
//                           }`}
//                           title={variant.isActive ? 'Active' : 'Inactive'}
//                         >
//                           <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
//                             variant.isActive ? 'translate-x-5' : 'translate-x-1'
//                           }`} />
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => onOpenEditVariant(index)}
//                           className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
//                           title="Edit variant"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                           </svg>
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => onDeleteVariant(index)}
//                           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Delete variant"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}

//                 <p className="text-xs text-gray-400 text-center pt-1">
//                   {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} added
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//       </div>

//       {/* ===== RIGHT COLUMN ===== */}
//       <div className="space-y-6">

//         {/* Product Gallery Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Product Gallery</h3>
//             <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
//           </div>
//           <div className="p-4">
//             <label
//               className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
//                 isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
//               }`}
//               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//               onDragLeave={() => setIsDragging(false)}
//               onDrop={(e) => {
//                 e.preventDefault();
//                 setIsDragging(false);
//                 handleImageUpload({ target: { files: e.dataTransfer.files } });
//               }}
//             >
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 disabled={formData.images.length >= 5}
//               />
//               <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
//             </label>

//             {formData.images.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 {formData.images.map((image, index) => (
//                   <div
//                     key={image.id}
//                     draggable
//                     onDragStart={(e) => handleImageDragStart(e, index)}
//                     onDragOver={(e) => handleImageDragOver(e, index)}
//                     onDragEnd={handleImageDragEnd}
//                     className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 ${
//                       image.isMain ? 'border-blue-500' : 'border-transparent'
//                     }`}
//                   >
//                     <div className="w-12 h-12 rounded overflow-hidden bg-white">
//                       <img src={image.url} alt="" className="w-full h-full object-cover" />
//                     </div>
//                     <div className="flex-1 text-xs truncate">{image.name}</div>
//                     <div className="flex items-center space-x-1">
//                       {!image.isMain && (
//                         <button
//                           type="button"
//                           onClick={() => setMainImage(image.id)}
//                           className="p-1 text-gray-500 hover:text-blue-600"
//                           title="Make main"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                           </svg>
//                         </button>
//                       )}
//                       <button
//                         type="button"
//                         onClick={() => removeImage(image.id)}
//                         className="p-1 text-gray-500 hover:text-red-600"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Marketing & Visibility Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
//           </div>
//           <div className="p-4 space-y-4">

//             {/* Featured Toggle */}
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium text-gray-700">Featured Product</span>
//               <button
//                 type="button"
//                 onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
//                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                   formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'
//                 }`}
//               >
//                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                   formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>

//             {/* Status */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//               <select
//                 name="status"
//                 value={formData.status}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//               >
//                 <option value="draft">Draft</option>
//                 <option value="active">Active</option>
//                 <option value="archived">Archived</option>
//               </select>
//             </div>

//             {/* Sold Info */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-gray-700">Sold Info</span>
//                 <button
//                   type="button"
//                   onClick={() => setFormData(prev => ({
//                     ...prev,
//                     soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled }
//                   }))}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'
//                   }`} />
//                 </button>
//               </div>
//               {formData.soldInfo.enabled && (
//                 <input
//                   type="number"
//                   value={formData.soldInfo.count}
//                   onChange={(e) => setFormData(prev => ({
//                     ...prev,
//                     soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 }
//                   }))}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                   placeholder="Number sold"
//                 />
//               )}
//             </div>

//             {/* FOMO */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-gray-700">FOMO</span>
//                 <button
//                   type="button"
//                   onClick={() => setFormData(prev => ({
//                     ...prev,
//                     fomo: { ...prev.fomo, enabled: !prev.fomo.enabled }
//                   }))}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'
//                   }`} />
//                 </button>
//               </div>
//               {formData.fomo.enabled && (
//                 <div className="space-y-2">
//                   <select
//                     value={formData.fomo.type}
//                     onChange={(e) => setFormData(prev => ({
//                       ...prev,
//                       fomo: { ...prev.fomo, type: e.target.value }
//                     }))}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                   >
//                     <option value="viewing_now">Viewing Now</option>
//                     <option value="product_left">Product Left</option>
//                     <option value="custom">Custom</option>
//                   </select>

//                   {formData.fomo.type === 'viewing_now' && (
//                     <input
//                       type="number"
//                       value={formData.fomo.viewingNow}
//                       onChange={(e) => setFormData(prev => ({
//                         ...prev,
//                         fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 }
//                       }))}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       placeholder="Viewing now"
//                     />
//                   )}

//                   {formData.fomo.type === 'product_left' && (
//                     <input
//                       type="number"
//                       value={formData.fomo.productLeft}
//                       onChange={(e) => setFormData(prev => ({
//                         ...prev,
//                         fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 }
//                       }))}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       placeholder="Items left"
//                     />
//                   )}

//                   {formData.fomo.type === 'custom' && (
//                     <div className="flex gap-2">
//                       <input
//                         type="text"
//                         value={formData.fomo.customMessage}
//                         readOnly
//                         placeholder="Custom message"
//                         className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => onOpenCustomMessage(formData.fomo.customMessage || '')}
//                         className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
//                       >
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                         </svg>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default ProductFormBody;
// ADD THE BARCODE INPUT FIELDS AS DESIRE TO CLIENT
// import React, { useState } from 'react';

// // ============================================================
// // ProductFormBody — receives formData + setFormData from parent
// // Owns its own image upload state (uploadProgress, draggedImageIndex, isDragging)
// // All modal open triggers passed as props from parent
// // ============================================================

// const ProductFormBody = ({
//   // Core form data
//   formData,
//   setFormData,

//   // Dropdowns data
//   categories,
//   brands,

//   // Modal open triggers (parent owns modal visibility state)
//   onOpenCategoryModal,
//   onOpenBrandModal,
//   onOpenAttributeModal,
//   onOpenCustomMessage,    // called with current customMessage string
//   onOpenAddVariant,
//   onOpenEditVariant,      // called with (index)

//   // In-card actions that don't need a modal
//   onRemoveAttribute,      // (attributeId)
//   onDeleteVariant,        // (index)
//   onToggleVariantActive,  // (index)

//   // Helper functions
//   formatIndianRupee,
//   getDiscountPercentage,
// }) => {

//   // ================= IMAGE STATE (owned here) =================
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [draggedImageIndex, setDraggedImageIndex] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);

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

//   // ================= handleInputChange (for named inputs) =================
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

//   // ============================================================
//   return (
//     <div className="grid grid-cols-3 gap-6">

//       {/* ===== LEFT COLUMN ===== */}
//       <div className="col-span-2 space-y-6">

//         {/* Essential Details Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Essential Details</h3>
//           </div>
//           <div className="p-4 space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Product Name <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g., Premium Wireless Headphones"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Title <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g., Noise Cancelling Headphones"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Description <span className="text-red-400">*</span>
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 rows="3"
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
//                 placeholder="Describe your product in detail..."
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
//                 <div className="flex gap-2">
//                   <select
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select category</option>
//                     {categories.map(cat => (
//                       <option key={cat._id} value={cat._id}>{cat.name}</option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={onOpenCategoryModal}
//                     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
//                 <div className="flex gap-2">
//                   <select
//                     name="brand"
//                     value={formData.brand}
//                     onChange={handleInputChange}
//                     className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     {brands.map(brand => (
//                       <option key={brand} value={brand}>{brand}</option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={onOpenBrandModal}
//                     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Pricing Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Pricing (₹ Indian Rupees)</h3>
//           </div>
//           <div className="p-4">
//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">MRP / Base Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.base}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, base: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="29999"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.sale}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, sale: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="19999"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
//                 <input
//                   type="number"
//                   value={formData.price.costPrice}
//                   onChange={(e) => setFormData({ ...formData, price: { ...formData.price, costPrice: e.target.value } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="15000"
//                 />
//               </div>
//             </div>

//             {/* Price Preview */}
//             {formData.price.base && formData.price.sale && (
//               <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                 <p className="text-sm text-gray-600 mb-1">Price Preview:</p>
//                 <div className="flex items-center space-x-3">
//                   <span className="text-gray-400 line-through">{formatIndianRupee(formData.price.base)}</span>
//                   <span className="text-lg font-bold text-gray-900">{formatIndianRupee(formData.price.sale)}</span>
//                   {formData.price.sale < formData.price.base && (
//                     <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                       {getDiscountPercentage(formData.price.base, formData.price.sale)}% OFF
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Inventory Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <h3 className="font-semibold text-gray-900">Inventory Management</h3>
//             <button
//               type="button"
//               onClick={() => setFormData(prev => ({
//                 ...prev,
//                 inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory }
//               }))}
//               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                 formData.inventory.trackInventory ? 'bg-blue-500' : 'bg-gray-300'
//               }`}
//             >
//               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                 formData.inventory.trackInventory ? 'translate-x-6' : 'translate-x-1'
//               }`} />
//             </button>
//           </div>
//           {formData.inventory.trackInventory && (
//             <div className="p-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Quantity in Stock</label>
//                   <input
//                     type="number"
//                     value={formData.inventory.quantity}
//                     onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 } })}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                     placeholder="0"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
//                   <input
//                     type="number"
//                     value={formData.inventory.lowStockThreshold}
//                     onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } })}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                     placeholder="5"
//                   />
//                 </div>
//               </div>
//               <p className="text-xs text-gray-500 mt-2">Low stock alert will show when quantity is below threshold</p>
//             </div>
//           )}
//         </div>

//         {/* Shipping Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Shipping Details</h3>
//           </div>
//           <div className="p-4 space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
//               <input
//                 type="number"
//                 step="0.1"
//                 value={formData.shipping.weight ?? ''}
//                 onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, weight: parseFloat(e.target.value) || 0 } })}
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                 placeholder="0.5"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
//               <div className="grid grid-cols-3 gap-2">
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.length ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, length: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Length"
//                 />
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.width ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, width: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Width"
//                 />
//                 <input
//                   type="number"
//                   value={formData.shipping.dimensions.height ?? ''}
//                   onChange={(e) => setFormData({ ...formData, shipping: { ...formData.shipping, dimensions: { ...formData.shipping.dimensions, height: parseFloat(e.target.value) } } })}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
//                   placeholder="Height"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Attributes Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <h3 className="font-semibold text-gray-900">Product Attributes</h3>
//             <button
//               type="button"
//               onClick={onOpenAttributeModal}
//               className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
//             >
//               + Add Attribute
//             </button>
//           </div>
//           <div className="p-4">
//             {formData.attributes.length === 0 ? (
//               <p className="text-center text-gray-500 py-4">No attributes added yet</p>
//             ) : (
//               <div className="space-y-2">
//                 {formData.attributes.map((attr) => (
//                   <div key={attr.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//                     <div className="flex items-center space-x-2">
//                       <span className="text-sm font-medium text-gray-700">{attr.key}:</span>
//                       <span className="text-sm text-gray-600">{attr.value}</span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => onRemoveAttribute(attr.id)}
//                       className="text-gray-400 hover:text-red-500"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Variants Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//             <div>
//               <h3 className="font-semibold text-gray-900">Product Variants</h3>
//               <p className="text-xs text-gray-500 mt-0.5">e.g., different colors, sizes with own price & stock</p>
//             </div>
//             <button
//               type="button"
//               onClick={onOpenAddVariant}
//               className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 flex items-center gap-1.5"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               Add Variant
//             </button>
//           </div>
//           <div className="p-4">
//             {formData.variants.length === 0 ? (
//               <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
//                 <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                 </svg>
//                 <p className="text-gray-500 text-sm">No variants added yet</p>
//                 <p className="text-gray-400 text-xs mt-1">Click "Add Variant" to add color, size or other variants</p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {formData.variants.map((variant, index) => (
//                   <div
//                     key={index}
//                     className={`rounded-lg border-2 p-3 transition-all ${
//                       variant.isActive ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50 opacity-60'
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex-1 min-w-0">
//                         {/* Attribute badges */}
//                         <div className="flex flex-wrap gap-1.5 mb-2">
//                           {variant.attributes.map((attr, aIdx) => (
//                             <span key={aIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
//                               {attr.key}: {attr.value}
//                             </span>
//                           ))}
//                         </div>

//                         {/* Price row */}
//                         <div className="flex items-center gap-3 text-sm">
//                           <span className="font-semibold text-gray-900">
//                             ₹{Number(variant.price.base).toLocaleString('en-IN')}
//                           </span>
//                           {variant.price.sale && (
//                             <>
//                               <span className="text-gray-400 line-through text-xs">
//                                 ₹{Number(variant.price.sale).toLocaleString('en-IN')}
//                               </span>
//                               {variant.price.sale < variant.price.base && (
//                                 <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
//                                   {getDiscountPercentage(variant.price.base, variant.price.sale)}% OFF
//                                 </span>
//                               )}
//                             </>
//                           )}
//                           <span className="text-gray-400 text-xs">•</span>
//                           <span className="text-gray-600 text-xs">Qty: {variant.inventory.quantity}</span>
//                         </div>

//                         {/* Image thumbnails */}
//                         {variant.images && variant.images.length > 0 && (
//                           <div className="flex items-center gap-2 mt-2">
//                             {variant.images.slice(0, 3).map((img, iIdx) => (
//                               <div key={iIdx} className="w-8 h-8 rounded overflow-hidden border border-indigo-200">
//                                 <img src={img.url} alt="" className="w-full h-full object-cover" />
//                               </div>
//                             ))}
//                             {variant.images.length > 3 && (
//                               <span className="text-xs text-gray-400">+{variant.images.length - 3} more</span>
//                             )}
//                           </div>
//                         )}
//                       </div>

//                       {/* Actions */}
//                       <div className="flex items-center gap-2 flex-shrink-0">
//                         {/* Active toggle */}
//                         <button
//                           type="button"
//                           onClick={() => onToggleVariantActive(index)}
//                           className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
//                             variant.isActive ? 'bg-indigo-500' : 'bg-gray-300'
//                           }`}
//                           title={variant.isActive ? 'Active' : 'Inactive'}
//                         >
//                           <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
//                             variant.isActive ? 'translate-x-5' : 'translate-x-1'
//                           }`} />
//                         </button>

//                         {/* Edit */}
//                         <button
//                           type="button"
//                           onClick={() => onOpenEditVariant(index)}
//                           className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
//                           title="Edit variant"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                           </svg>
//                         </button>

//                         {/* Delete */}
//                         <button
//                           type="button"
//                           onClick={() => onDeleteVariant(index)}
//                           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Delete variant"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}

//                 <p className="text-xs text-gray-400 text-center pt-1">
//                   {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} added
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//       </div>

//       {/* ===== RIGHT COLUMN ===== */}
//       <div className="space-y-6">

//         {/* Product Gallery Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Product Gallery</h3>
//             <p className="text-xs text-gray-500 mt-1">Upload up to 5 images (drag to reorder)</p>
//           </div>
//           <div className="p-4">
//             <label
//               className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
//                 isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
//               }`}
//               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//               onDragLeave={() => setIsDragging(false)}
//               onDrop={(e) => {
//                 e.preventDefault();
//                 setIsDragging(false);
//                 handleImageUpload({ target: { files: e.dataTransfer.files } });
//               }}
//             >
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 disabled={formData.images.length >= 5}
//               />
//               <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <p className="text-sm text-gray-600">{formData.images.length}/5 images</p>
//             </label>

//             {formData.images.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 {formData.images.map((image, index) => (
//                   <div
//                     key={image.id}
//                     draggable
//                     onDragStart={(e) => handleImageDragStart(e, index)}
//                     onDragOver={(e) => handleImageDragOver(e, index)}
//                     onDragEnd={handleImageDragEnd}
//                     className={`flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border-2 ${
//                       image.isMain ? 'border-blue-500' : 'border-transparent'
//                     }`}
//                   >
//                     <div className="w-12 h-12 rounded overflow-hidden bg-white">
//                       <img src={image.url} alt="" className="w-full h-full object-cover" />
//                     </div>
//                     <div className="flex-1 text-xs truncate">{image.name}</div>
//                     <div className="flex items-center space-x-1">
//                       {!image.isMain && (
//                         <button
//                           type="button"
//                           onClick={() => setMainImage(image.id)}
//                           className="p-1 text-gray-500 hover:text-blue-600"
//                           title="Make main"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//                           </svg>
//                         </button>
//                       )}
//                       <button
//                         type="button"
//                         onClick={() => removeImage(image.id)}
//                         className="p-1 text-gray-500 hover:text-red-600"
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Marketing & Visibility Card */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="p-4 border-b border-gray-100 bg-gray-50">
//             <h3 className="font-semibold text-gray-900">Marketing & Visibility</h3>
//           </div>
//           <div className="p-4 space-y-4">

//             {/* Featured Toggle */}
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium text-gray-700">Featured Product</span>
//               <button
//                 type="button"
//                 onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
//                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                   formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'
//                 }`}
//               >
//                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                   formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>

//             {/* Status */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//               <select
//                 name="status"
//                 value={formData.status}
//                 onChange={handleInputChange}
//                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//               >
//                 <option value="draft">Draft</option>
//                 <option value="active">Active</option>
//                 <option value="archived">Archived</option>
//               </select>
//             </div>

//             {/* Sold Info */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-gray-700">Sold Info</span>
//                 <button
//                   type="button"
//                   onClick={() => setFormData(prev => ({
//                     ...prev,
//                     soldInfo: { ...prev.soldInfo, enabled: !prev.soldInfo.enabled }
//                   }))}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.soldInfo.enabled ? 'bg-blue-500' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     formData.soldInfo.enabled ? 'translate-x-6' : 'translate-x-1'
//                   }`} />
//                 </button>
//               </div>
//               {formData.soldInfo.enabled && (
//                 <input
//                   type="number"
//                   value={formData.soldInfo.count}
//                   onChange={(e) => setFormData(prev => ({
//                     ...prev,
//                     soldInfo: { ...prev.soldInfo, count: parseInt(e.target.value) || 0 }
//                   }))}
//                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                   placeholder="Number sold"
//                 />
//               )}
//             </div>

//             {/* FOMO */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-gray-700">FOMO</span>
//                 <button
//                   type="button"
//                   onClick={() => setFormData(prev => ({
//                     ...prev,
//                     fomo: { ...prev.fomo, enabled: !prev.fomo.enabled }
//                   }))}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.fomo.enabled ? 'bg-purple-500' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     formData.fomo.enabled ? 'translate-x-6' : 'translate-x-1'
//                   }`} />
//                 </button>
//               </div>
//               {formData.fomo.enabled && (
//                 <div className="space-y-2">
//                   <select
//                     value={formData.fomo.type}
//                     onChange={(e) => setFormData(prev => ({
//                       ...prev,
//                       fomo: { ...prev.fomo, type: e.target.value }
//                     }))}
//                     className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                   >
//                     <option value="viewing_now">Viewing Now</option>
//                     <option value="product_left">Product Left</option>
//                     <option value="custom">Custom</option>
//                   </select>

//                   {formData.fomo.type === 'viewing_now' && (
//                     <input
//                       type="number"
//                       value={formData.fomo.viewingNow}
//                       onChange={(e) => setFormData(prev => ({
//                         ...prev,
//                         fomo: { ...prev.fomo, viewingNow: parseInt(e.target.value) || 0 }
//                       }))}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       placeholder="Viewing now"
//                     />
//                   )}

//                   {formData.fomo.type === 'product_left' && (
//                     <input
//                       type="number"
//                       value={formData.fomo.productLeft}
//                       onChange={(e) => setFormData(prev => ({
//                         ...prev,
//                         fomo: { ...prev.fomo, productLeft: parseInt(e.target.value) || 0 }
//                       }))}
//                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       placeholder="Items left"
//                     />
//                   )}

//                   {formData.fomo.type === 'custom' && (
//                     <div className="flex gap-2">
//                       <input
//                         type="text"
//                         value={formData.fomo.customMessage}
//                         readOnly
//                         placeholder="Custom message"
//                         className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => onOpenCustomMessage(formData.fomo.customMessage || '')}
//                         className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
//                       >
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                         </svg>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default ProductFormBody;