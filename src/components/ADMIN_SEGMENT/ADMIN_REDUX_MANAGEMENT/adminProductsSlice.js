import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const extractProducts = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.products)) return payload.data.products;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  console.warn("[Slice] Unknown response shape:", Object.keys(payload));
  return [];
};

// ✅ FIXED: extractProduct that properly preserves images
const extractProduct = (payload) => {
  if (!payload) return null;
  
  // Case 1: Direct product object with _id
  if (payload._id) {
    console.log("[Slice] 📦 Extracting direct product:", {
      name: payload.name,
      hasImages: !!payload.images,
      imagesCount: payload.images?.length || 0
    });
    return payload;
  }
  
  // Case 2: Nested under product property
  if (payload.product) {
    console.log("[Slice] 📦 Extracting from payload.product:", {
      name: payload.product.name,
      hasImages: !!payload.product.images,
      imagesCount: payload.product.images?.length || 0
    });
    return payload.product;
  }
  
  // Case 3: Nested under data.product
  if (payload.data?.product) {
    console.log("[Slice] 📦 Extracting from data.product:", {
      name: payload.data.product.name,
      hasImages: !!payload.data.product.images,
      imagesCount: payload.data.product.images?.length || 0
    });
    return payload.data.product;
  }
  
  // Case 4: Data is the product
  if (payload.data && payload.data._id) {
    console.log("[Slice] 📦 Extracting from data:", {
      name: payload.data.name,
      hasImages: !!payload.data.images,
      imagesCount: payload.data.images?.length || 0
    });
    return payload.data;
  }
  
  // Case 5: Success wrapper with product
  if (payload.success && payload.product) {
    console.log("[Slice] 📦 Extracting from success.product:", {
      name: payload.product.name,
      hasImages: !!payload.product.images,
      imagesCount: payload.product.images?.length || 0
    });
    return payload.product;
  }
  
  console.warn("[Slice] ⚠️ Unknown response shape:", Object.keys(payload));
  return null;
};

// ─────────────────────────────────────────────
//  buildProductFormData
//  Used for: createProduct, updateProduct (full),
//            toggleFeatured, changeStatus
//
//  BARCODE FIX: barcode is ALWAYS included in each variant
//  when present. Uses Number() conversion.
//  On create: every variant must have barcode (validated upstream)
//  On update (toggle/status): existing variants already have barcode from DB
// ─────────────────────────────────────────────
// const buildProductFormData = (data) => {
//   const fd = new FormData();

//   fd.append("name",        data.name        || "");
//   fd.append("title",       data.title       || "");
//   fd.append("description", data.description || "");
//   fd.append("brand",       data.brand       || "Generic");
//   fd.append("status",      data.status      || "draft");
//   fd.append("isFeatured",  data.isFeatured  ? "true" : "false");

//   const categoryId =
//     data.category && typeof data.category === "object"
//       ? data.category._id
//       : data.category;
//   fd.append("category", categoryId || "");

//   fd.append("soldInfo",   JSON.stringify(data.soldInfo   || { enabled: false, count: 0 }));
//   fd.append("fomo",       JSON.stringify(data.fomo       || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" }));
//   fd.append("shipping",   JSON.stringify(data.shipping   || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } }));
//   fd.append("attributes", JSON.stringify(data.attributes || []));

//   const variantsJson = (data.variants || []).map((v) => {
//     // Separate existing DB images (have url, no File object) from new uploads
//     const existingImages = (v.images || []).filter(
//       (img) => img.url && !(img.file instanceof File)
//     ).map((img) => ({
//       url:       img.url,
//       publicId:  img.publicId  || img.public_id || "",
//       altText:   img.altText   || "",
//       order:     img.order     ?? 0,
//     }));

//     const variant = {
//       attributes: (v.attributes || []).map((a) => ({ key: a.key || "", value: a.value || "" })),
//       price: {
//         base: Number(v.price?.base) || 0,
//         sale: (v.price?.sale !== "" && v.price?.sale != null) ? Number(v.price.sale) : null,
//       },
//       inventory: {
//         quantity:          Number(v.inventory?.quantity)          || 0,
//         lowStockThreshold: Number(v.inventory?.lowStockThreshold) || 5,
//         trackInventory:    v.inventory?.trackInventory !== false,
//       },
//       images:   existingImages,   // existing DB images preserved in JSON
//       isActive: v.isActive !== false,
//     };

//     // barcode — required on create, preserved on update
//     if (v.barcode !== undefined && v.barcode !== null && v.barcode !== "") {
//       variant.barcode = Number(v.barcode);
//     }

//     // sku — auto-generated by backend on create, preserved on update
//     if (v.sku) variant.sku = v.sku;

//     return variant;
//   });

//   fd.append("variants", JSON.stringify(variantsJson));

//   // Append new variant image File uploads
//   (data.variants || []).forEach((v, variantIndex) => {
//     (v.images || []).forEach((img) => {
//       if (img?.file instanceof File) {
//         fd.append(`variantImages_${variantIndex}`, img.file);
//       }
//     });
//   });

//   return fd;
// };


const buildProductFormData = (data) => {
  const fd = new FormData();

  fd.append("name",        data.name        || "");
  fd.append("title",       data.title       || "");
  fd.append("description", data.description || "");
  fd.append("brand",       data.brand       || "Generic");
  fd.append("status",      data.status      || "draft");
  fd.append("isFeatured",  data.isFeatured  ? "true" : "false");

  const categoryId =
    data.category && typeof data.category === "object"
      ? data.category._id
      : data.category;
  fd.append("category", categoryId || "");

  fd.append("soldInfo",   JSON.stringify(data.soldInfo   || { enabled: false, count: 0 }));
  fd.append("fomo",       JSON.stringify(data.fomo       || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" }));
  fd.append("shipping",   JSON.stringify(data.shipping   || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } }));
  fd.append("attributes", JSON.stringify(data.attributes || []));

  // =============================================
  // ✅ FIX: Handle MAIN PRODUCT IMAGES correctly
  // =============================================
  if (data.images && data.images.length > 0) {
    // Separate existing DB images (have url, no File object) from new uploads
    const existingImages = data.images.filter(
      (img) => img.url && !(img.file instanceof File)
    ).map((img) => ({
      url: img.url,
      publicId: img.publicId || img.public_id || "",
      altText: img.altText || "",
      order: img.order ?? 0,
      isMain: img.isMain || false,
    }));

    // Append existing images as JSON (only if there are any)
    if (existingImages.length > 0) {
      fd.append("images", JSON.stringify(existingImages));
    } else {
      // If no existing images, append empty array to preserve removal
      fd.append("images", JSON.stringify([]));
    }

    // Append new image file uploads with proper indexing
    const newImages = data.images.filter(img => img.file instanceof File);
    newImages.forEach((img, index) => {
      if (img?.file instanceof File) {
        fd.append(`productImages_${index}`, img.file);
      }
    });
  } else {
    // If no images at all, send empty array
    fd.append("images", JSON.stringify([]));
  }

  // Handle variants (your existing code)
  const variantsJson = (data.variants || []).map((v) => {
    // Separate existing DB images (have url, no File object) from new uploads
    const existingImages = (v.images || []).filter(
      (img) => img.url && !(img.file instanceof File)
    ).map((img) => ({
      url:       img.url,
      publicId:  img.publicId  || img.public_id || "",
      altText:   img.altText   || "",
      order:     img.order     ?? 0,
    }));

    const variant = {
      attributes: (v.attributes || []).map((a) => ({ key: a.key || "", value: a.value || "" })),
      price: {
        base: Number(v.price?.base) || 0,
        sale: (v.price?.sale !== "" && v.price?.sale != null) ? Number(v.price.sale) : null,
      },
      inventory: {
        quantity:          Number(v.inventory?.quantity)          || 0,
        lowStockThreshold: Number(v.inventory?.lowStockThreshold) || 5,
        trackInventory:    v.inventory?.trackInventory !== false,
      },
      images:   existingImages,   // existing DB images preserved in JSON
      isActive: v.isActive !== false,
    };

    // barcode — required on create, preserved on update
    if (v.barcode !== undefined && v.barcode !== null && v.barcode !== "") {
      variant.barcode = Number(v.barcode);
    }

    // sku — auto-generated by backend on create, preserved on update
    if (v.sku) variant.sku = v.sku;

    return variant;
  });

  fd.append("variants", JSON.stringify(variantsJson));

  // Append new variant image File uploads
  (data.variants || []).forEach((v, variantIndex) => {
    (v.images || []).forEach((img) => {
      if (img?.file instanceof File) {
        fd.append(`variantImages_${variantIndex}`, img.file);
      }
    });
  });

  return fd;
};
// ─────────────────────────────────────────────
//  productToUpdateData
//  Converts a full Redux product to update payload shape.
//  Used by toggleFeatured + changeStatus to avoid extra GET.
// ─────────────────────────────────────────────
const productToUpdateData = (product, overrides = {}) => ({
  name:        product.name,
  title:       product.title,
  description: product.description || "",
  brand:       product.brand       || "Generic",
  status:      product.status,
  isFeatured:  product.isFeatured  || false,
  category:    product.category?._id || product.category,
  soldInfo:    product.soldInfo    || { enabled: false, count: 0 },
  fomo:        product.fomo        || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" },
  shipping:    product.shipping    || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } },
  attributes:  product.attributes  || [],
  variants: (product.variants || []).map((v) => ({
    sku:        v.sku,
    barcode:    v.barcode,   // preserve barcode from DB
    attributes: v.attributes || [],
    price: { base: v.price?.base || 0, sale: v.price?.sale ?? null },
    inventory: {
      quantity:          v.inventory?.quantity          || 0,
      lowStockThreshold: v.inventory?.lowStockThreshold || 5,
      trackInventory:    v.inventory?.trackInventory    !== false,
    },
    images:   [],
    isActive: v.isActive !== false,
  })),
  ...overrides,
});

// ─────────────────────────────────────────────
//  THUNKS
// ─────────────────────────────────────────────

// 1. Fetch all products (active + draft)
export const fetchAllProducts = createAsyncThunk(
  "adminProducts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/products/all");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  }
);

// 2. Fetch archived
export const fetchArchivedProducts = createAsyncThunk(
  "adminProducts/fetchArchived",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/products/archived");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch archived products");
    }
  }
);

// 3. Create product
//    Validates barcodes client-side before hitting API
export const createProduct = createAsyncThunk(
  "adminProducts/create",
  async (formData, { rejectWithValue }) => {
    try {
      // Client-side barcode validation
      const variants = formData.variants || [];
      for (let i = 0; i < variants.length; i++) {
        const bc = variants[i].barcode;
        if (bc === undefined || bc === null || bc === "") {
          return rejectWithValue(`Variant ${i + 1}: barcode is required`);
        }
        if (isNaN(Number(bc))) {
          return rejectWithValue(`Variant ${i + 1}: barcode must be a valid number`);
        }
      }
      const fd = buildProductFormData(formData);
      const res = await axiosInstance.post("/admin/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create product");
    }
  }
);

// 4. Full product update (EditProductModal — product-level fields)
export const updateProduct = createAsyncThunk(
  "adminProducts/update",
  async ({ slug, formData, silent = false }, { rejectWithValue }) => {
    try {
      const fd = buildProductFormData(formData);
      const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // silent=true means variant edit — don't set updateSuccess (keeps modal open)
      return { ...res.data, silent };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update product");
    }
  }
);

// 5. Soft delete
export const softDeleteProduct = createAsyncThunk(
  "adminProducts/softDelete",
  async (slug, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/products/${slug}`);
      return { slug };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to archive product");
    }
  }
);

// 6. Hard delete
export const hardDeleteProduct = createAsyncThunk(
  "adminProducts/hardDelete",
  async (slug, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/products/hard/${slug}`);
      return { slug };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to permanently delete product");
    }
  }
);

// 7. Restore
export const restoreProduct = createAsyncThunk(
  "adminProducts/restore",
  async (slug, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/admin/products/restore/${slug}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to restore product");
    }
  }
);

// ─────────────────────────────────────────────
//  8. ADD VARIANT
//  POST /admin/products/:slug/variants
//  Body: JSON { barcode, attributes, price, inventory, isActive }
//  Backend auto-generates SKU
// ─────────────────────────────────────────────
// export const addVariantToProduct = createAsyncThunk(
//   "adminProducts/addVariant",
//   async ({ slug, variantData }, { rejectWithValue }) => {
//     try {
//       if (!variantData.barcode && variantData.barcode !== 0) {
//         return rejectWithValue("Barcode is required to add a variant");
//       }
//       if (isNaN(Number(variantData.barcode))) {
//         return rejectWithValue("Barcode must be a valid number");
//       }

//       const payload = {
//         barcode:    Number(variantData.barcode),
//         attributes: variantData.attributes || [],
//         price: {
//           base: Number(variantData.price?.base) || 0,
//           sale: (variantData.price?.sale !== "" && variantData.price?.sale != null)
//             ? Number(variantData.price.sale)
//             : null,
//         },
//         inventory: {
//           quantity:          Number(variantData.inventory?.quantity)          || 0,
//           lowStockThreshold: Number(variantData.inventory?.lowStockThreshold) || 5,
//           trackInventory:    variantData.inventory?.trackInventory !== false,
//         },
//         isActive: variantData.isActive !== false,
//       };

//       console.log("[Slice] addVariant POST /admin/products/" + slug + "/variants, barcode:", payload.barcode);
//       const res = await axiosInstance.post(`/admin/products/${slug}/variants`, payload);
//       console.log("[Slice] addVariant response:", res.data);

//       const updatedProduct = extractProduct(res.data) || res.data;
//       return { slug, product: updatedProduct };
//     } catch (err) {
//       console.error("[Slice] addVariant error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to add variant");
//     }
//   }
// );
// Replace in adminProductsSlice.js

export const addVariantToProduct = createAsyncThunk(
  "adminProducts/addVariant",
  async ({ slug, variantData }, { rejectWithValue }) => {
    try {
      if (!variantData.barcode && variantData.barcode !== 0) {
        return rejectWithValue("Barcode is required to add a variant");
      }
      if (isNaN(Number(variantData.barcode))) {
        return rejectWithValue("Barcode must be a valid number");
      }

      // CRITICAL FIX: Use FormData to support image uploads
      const fd = new FormData();
      
      fd.append("barcode", String(Number(variantData.barcode)));
      fd.append("attributes", JSON.stringify(variantData.attributes || []));
      fd.append("price", JSON.stringify({
        base: Number(variantData.price?.base) || 0,
        sale: (variantData.price?.sale !== "" && variantData.price?.sale != null)
          ? Number(variantData.price.sale)
          : null,
      }));
      fd.append("inventory", JSON.stringify({
        quantity: Number(variantData.inventory?.quantity) || 0,
        lowStockThreshold: Number(variantData.inventory?.lowStockThreshold) || 5,
        trackInventory: variantData.inventory?.trackInventory !== false,
      }));
      fd.append("isActive", variantData.isActive !== false ? "true" : "false");

      // Append images
      if (variantData.images && variantData.images.length > 0) {
        variantData.images.forEach((img, index) => {
          if (img?.file instanceof File) {
            fd.append(`variantImages`, img.file);
          }
        });
      }

      console.log("[Slice] addVariant POST /admin/products/" + slug + "/variants with FormData");
      
      // Use POST with FormData
      const res = await axiosInstance.post(`/admin/products/${slug}/variants`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("[Slice] addVariant response:", res.data);

      const updatedProduct = extractProduct(res.data) || res.data;
      return { slug, product: updatedProduct };
    } catch (err) {
      console.error("[Slice] addVariant error:", err.response?.data);
      return rejectWithValue(err.response?.data?.message || "Failed to add variant");
    }
  }
);

// ─────────────────────────────────────────────
//  9. DELETE VARIANT
//  DELETE /admin/products/:slug/variants
//  Body: { barcode: Number }
//  axios DELETE body goes under `data` key
// ─────────────────────────────────────────────
export const deleteVariantFromProduct = createAsyncThunk(
  "adminProducts/deleteVariant",
  async ({ slug, barcode }, { rejectWithValue }) => {
    try {
      console.log("[Slice] deleteVariant DELETE /admin/products/" + slug + "/variants, barcode:", barcode);

      const res = await axiosInstance.delete(`/admin/products/${slug}/variants`, {
        data: { barcode: Number(barcode) },
      });

      console.log("[Slice] deleteVariant response:", res.data);
      const updatedProduct = extractProduct(res.data) || res.data;
      return { slug, product: updatedProduct };
    } catch (err) {
      console.error("[Slice] deleteVariant error:", err.response?.data);
      return rejectWithValue(err.response?.data?.message || "Failed to delete variant");
    }
  }
);

// ─────────────────────────────────────────────
//  10. UPDATE VARIANT BY BARCODE
//  PUT /admin/products/:slug
//  Controller checks: if (updates.barcode) → variant update path
//
//  CRITICAL: Route has uploadProductImages (multer) middleware.
//  Multer only populates req.body for multipart/form-data.
//  If we send application/json, req.body is EMPTY after multer runs
//  → updates.barcode is undefined → goes into full-product update → wrong.
//
//  FIX: Send as FormData (multipart/form-data).
//  barcode → string in FormData → Number(updates.barcode) in controller → fine.
//  price / inventory → JSON.stringify strings → parseIfString() in controller → fine.
// ─────────────────────────────────────────────
// export const updateVariantByBarcode = createAsyncThunk(
//   "adminProducts/updateVariant",
//   async ({ slug, barcode, price, inventory }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] updateVariant PUT /admin/products/" + slug + " barcode:", barcode);

//       // Send as FormData so multer middleware populates req.body correctly
//       const fd = new FormData();
//       fd.append("barcode", String(Number(barcode)));

//       if (price) {
//         // Controller calls parseIfString(updates.price) → JSON.parse works
//         fd.append("price", JSON.stringify({
//           base: Number(price.base),
//           sale: (price.sale !== "" && price.sale != null) ? Number(price.sale) : null,
//         }));
//       }

//       if (inventory) {
//         fd.append("inventory", JSON.stringify({
//           quantity:          Number(inventory.quantity),
//           lowStockThreshold: Number(inventory.lowStockThreshold),
//           trackInventory:    inventory.trackInventory !== false,
//         }));
//       }

//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       console.log("[Slice] updateVariant OK:", res.data?.product?.name || res.data);
//       const updatedProduct = extractProduct(res.data) || res.data;
//       return { slug, product: updatedProduct };
//     } catch (err) {
//       console.error("[Slice] updateVariant error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to update variant");
//     }
//   }
// );


// ADMIN_REDUX_MANAGEMENT/adminProductsSlice.js

export const updateVariantByBarcode = createAsyncThunk(
  "adminProducts/updateVariant",
  async ({ slug, barcode, attributes, price, inventory, images, isActive }, { rejectWithValue }) => {
    try {
      console.log("[Slice] updateVariant PUT /admin/products/" + slug + " barcode:", barcode);

      const fd = new FormData();
      fd.append("barcode", String(Number(barcode)));

      // ✅ Attributes bhejo
      if (attributes) {
        fd.append("attributes", JSON.stringify(attributes));
      }

      // ✅ Price bhejo
      if (price) {
        fd.append("price", JSON.stringify({
          base: Number(price.base),
          sale: (price.sale !== "" && price.sale != null) ? Number(price.sale) : null,
        }));
      }

      // ✅ Inventory bhejo
      if (inventory) {
        fd.append("inventory", JSON.stringify({
          quantity: Number(inventory.quantity),
          lowStockThreshold: Number(inventory.lowStockThreshold),
          trackInventory: inventory.trackInventory !== false,
        }));
      }

      // ✅ isActive bhejo
      if (isActive !== undefined) {
        fd.append("isActive", String(isActive));
      }

      // ✅ Images handle karo (existing + new uploads)
      if (images && images.length > 0) {
        // Existing images (jo DB se aayi hain, unka sirf URL hai)
        const existingImages = images.filter(img => img.url && !img.file)
          .map(img => ({
            url: img.url,
            publicId: img.publicId || "",
            altText: img.altText || "",
          }));
        
        if (existingImages.length > 0) {
          fd.append("images", JSON.stringify(existingImages));
        }

        // New file uploads
        images.forEach((img, index) => {
          if (img?.file instanceof File) {
            fd.append(`variantImages_${index}`, img.file);
          }
        });
      }

      const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[Slice] updateVariant OK:", res.data?.product?.name || res.data);
      const updatedProduct = extractProduct(res.data) || res.data;
      return { slug, product: updatedProduct };
    } catch (err) {
      console.error("[Slice] updateVariant error:", err.response?.data);
      return rejectWithValue(err.response?.data?.message || "Failed to update variant");
    }
  }
);

// ─────────────────────────────────────────────
//  11. FETCH VARIANT BY BARCODE
//  GET /admin/products/variant/:barcode
//  Returns { product, variant } — for barcode scanner feature
// ─────────────────────────────────────────────
export const fetchVariantByBarcode = createAsyncThunk(
  "adminProducts/fetchVariantByBarcode",
  async (barcode, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/products/variant/${barcode}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Variant not found for this barcode");
    }
  }
);

// ─────────────────────────────────────────────
//  12. TOGGLE FEATURED
//  Uses full product from Redux — no extra GET
// ─────────────────────────────────────────────
export const toggleFeaturedProduct = createAsyncThunk(
  "adminProducts/toggleFeatured",
  async ({ product }, { rejectWithValue }) => {
    try {
      const newIsFeatured = !product.isFeatured;
      console.log("[Slice] toggleFeatured PUT /admin/products/" + product.slug, "→", newIsFeatured);

      const updateData = productToUpdateData(product, { isFeatured: newIsFeatured });
      const fd = buildProductFormData(updateData);

      const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const serverProduct = extractProduct(res.data);
      return {
        product: {
          ...product,
          ...(serverProduct || {}),
          isFeatured: newIsFeatured,
          category: serverProduct?.category?.name ? serverProduct.category : product.category,
        },
      };
    } catch (err) {
      console.error("[Slice] toggleFeatured error:", err.response?.data);
      return rejectWithValue(err.response?.data?.message || "Failed to toggle featured");
    }
  }
);

// ─────────────────────────────────────────────
//  13. CHANGE STATUS
//  Uses full product from Redux — no extra GET
// ─────────────────────────────────────────────
export const changeProductStatus = createAsyncThunk(
  "adminProducts/changeStatus",
  async ({ product, status }, { rejectWithValue }) => {
    try {
      console.log("[Slice] changeStatus PUT /admin/products/" + product.slug, "→", status);

      const updateData = productToUpdateData(product, { status });
      const fd = buildProductFormData(updateData);

      const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const serverProduct = extractProduct(res.data);
      return {
        product: {
          ...product,
          ...(serverProduct || {}),
          status,
          category: serverProduct?.category?.name ? serverProduct.category : product.category,
        },
      };
    } catch (err) {
      console.error("[Slice] changeStatus error:", err.response?.data);
      return rejectWithValue(err.response?.data?.message || "Failed to change status");
    }
  }
);

// ─────────────────────────────────────────────
//  SLICE
// ─────────────────────────────────────────────
const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState: {
    products:        [],
    productsLoading: false,
    productsLoaded:  false,
    productsError:   null,

    archivedProducts: [],
    archivedLoading:  false,
    archivedLoaded:   false,
    archivedError:    null,

    createLoading:  false,
    createError:    null,
    createSuccess:  false,

    updateLoading:  false,
    updateError:    null,
    updateSuccess:  false,

    // covers toggleFeatured, changeStatus, softDelete, hardDelete,
    // restore, addVariant, deleteVariant, updateVariant
    actionLoading:  false,
    actionError:    null,

    // barcode scanner / lookup
    barcodeResult:   null,
    barcodeLoading:  false,
    barcodeError:    null,
  },
  reducers: {
    resetCreateSuccess(state) { state.createSuccess = false; state.createError = null; },
    resetUpdateSuccess(state) { state.updateSuccess = false; state.updateError = null; },
    clearErrors(state) {
      state.productsError = null; state.archivedError = null;
      state.createError   = null; state.updateError   = null;
      state.actionError   = null; state.barcodeError  = null;
    },
    clearBarcodeResult(state) {
      state.barcodeResult = null; state.barcodeError = null; state.barcodeLoading = false;
    },
  },
  extraReducers: (builder) => {

    // fetchAllProducts
    builder
      .addCase(fetchAllProducts.pending,   (s) => { s.productsLoading = true;  s.productsError = null; })
      .addCase(fetchAllProducts.fulfilled, (s, a) => {
        s.productsLoading = false; s.productsLoaded = true;
        s.products = extractProducts(a.payload);
        console.log("[Slice] ✅ Products loaded:", s.products.length);
      })
      .addCase(fetchAllProducts.rejected,  (s, a) => { s.productsLoading = false; s.productsError = a.payload; });

    // fetchArchivedProducts
    builder
      .addCase(fetchArchivedProducts.pending,   (s) => { s.archivedLoading = true; s.archivedError = null; })
      .addCase(fetchArchivedProducts.fulfilled, (s, a) => {
        s.archivedLoading = false; s.archivedLoaded = true;
        s.archivedProducts = extractProducts(a.payload);
      })
      .addCase(fetchArchivedProducts.rejected,  (s, a) => { s.archivedLoading = false; s.archivedError = a.payload; });

    // createProduct
    builder
      .addCase(createProduct.pending,   (s) => { s.createLoading = true;  s.createError = null;  s.createSuccess = false; })
      .addCase(createProduct.fulfilled, (s, a) => {
        s.createLoading = false; s.createSuccess = true;
        const p = extractProduct(a.payload) || a.payload;
        s.products = [p, ...s.products];
        console.log("[Slice] ✅ Created:", p?.name);
      })
      .addCase(createProduct.rejected,  (s, a) => { s.createLoading = false; s.createError = a.payload; });

    // ✅ FIXED: updateProduct with better image handling
    builder
      .addCase(updateProduct.pending,   (s) => { s.updateLoading = true;  s.updateError = null;  s.updateSuccess = false; })
      .addCase(updateProduct.fulfilled, (s, a) => {
        s.updateLoading = false;
        // silent=true → variant edit, don't set updateSuccess (modal stays open)
        if (!a.payload?.silent) s.updateSuccess = true;
        
        // ✅ FIXED: Better extraction with logging
        const u = extractProduct(a.payload) || a.payload;
        
        console.log("[Slice] 📸 Update response - extracted product:", {
          name: u?.name,
          hasMainImages: !!(u?.images && u.images.length > 0),
          mainImagesCount: u?.images?.length || 0,
          hasVariants: !!(u?.variants && u.variants.length > 0),
          variantsCount: u?.variants?.length || 0
        });
        
        if (u?._id) {
          s.products = s.products.map((p) => p._id === u._id ? u : p);
        }
        console.log("[Slice] ✅ Updated:", u?.name);
      })
      .addCase(updateProduct.rejected,  (s, a) => { s.updateLoading = false; s.updateError = a.payload; });

    // softDeleteProduct
    builder
      .addCase(softDeleteProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(softDeleteProduct.fulfilled, (s, a) => {
        s.actionLoading = false;
        const { slug } = a.payload;
        const product = s.products.find((p) => p.slug === slug);
        if (product) {
          s.products         = s.products.filter((p) => p.slug !== slug);
          s.archivedProducts = [{ ...product, status: "archived" }, ...s.archivedProducts];
        }
      })
      .addCase(softDeleteProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // hardDeleteProduct
    builder
      .addCase(hardDeleteProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(hardDeleteProduct.fulfilled, (s, a) => {
        s.actionLoading    = false;
        s.archivedProducts = s.archivedProducts.filter((p) => p.slug !== a.payload.slug);
      })
      .addCase(hardDeleteProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // restoreProduct
    builder
      .addCase(restoreProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(restoreProduct.fulfilled, (s, a) => {
        s.actionLoading = false;
        const r = extractProduct(a.payload) || a.payload;
        s.archivedProducts = s.archivedProducts.filter((p) => p._id !== r._id);
        s.products         = [r, ...s.products];
      })
      .addCase(restoreProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ✅ FIXED: addVariantToProduct with image logging
    builder
      .addCase(addVariantToProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(addVariantToProduct.fulfilled, (s, a) => {
        s.actionLoading = false;
        const u = a.payload.product;
        
        console.log("[Slice] ➕ Variant added - product images:", {
          name: u?.name,
          mainImagesCount: u?.images?.length || 0
        });
        
        if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
        console.log("[Slice] ✅ Variant added to:", u?.name);
      })
      .addCase(addVariantToProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // deleteVariantFromProduct
    builder
      .addCase(deleteVariantFromProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(deleteVariantFromProduct.fulfilled, (s, a) => {
        s.actionLoading = false;
        const u = a.payload.product;
        if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
        console.log("[Slice] ✅ Variant deleted from:", u?.name);
      })
      .addCase(deleteVariantFromProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // ✅ FIXED: updateVariantByBarcode with image logging
    builder
      .addCase(updateVariantByBarcode.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(updateVariantByBarcode.fulfilled, (s, a) => {
        s.actionLoading = false;
        const u = a.payload.product;
        
        console.log("[Slice] ✏️ Variant updated - product images:", {
          name: u?.name,
          mainImagesCount: u?.images?.length || 0
        });
        
        if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
        console.log("[Slice] ✅ Variant updated in:", u?.name);
      })
      .addCase(updateVariantByBarcode.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // fetchVariantByBarcode
    builder
      .addCase(fetchVariantByBarcode.pending,   (s) => { s.barcodeLoading = true;  s.barcodeError = null; s.barcodeResult = null; })
      .addCase(fetchVariantByBarcode.fulfilled, (s, a) => { s.barcodeLoading = false; s.barcodeResult = a.payload; })
      .addCase(fetchVariantByBarcode.rejected,  (s, a) => { s.barcodeLoading = false; s.barcodeError  = a.payload; });

    // toggleFeaturedProduct
    builder
      .addCase(toggleFeaturedProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(toggleFeaturedProduct.fulfilled, (s, a) => {
        s.actionLoading = false;
        const u = a.payload.product;
        s.products = s.products.map((p) => p._id === u._id ? u : p);
        console.log("[Slice] ✅ Featured:", u?.name, "→", u?.isFeatured);
      })
      .addCase(toggleFeaturedProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

    // changeProductStatus
    builder
      .addCase(changeProductStatus.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
      .addCase(changeProductStatus.fulfilled, (s, a) => {
        s.actionLoading = false;
        const u = a.payload.product;
        s.products = s.products.map((p) => p._id === u._id ? u : p);
        console.log("[Slice] ✅ Status:", u?.name, "→", u?.status);
      })
      .addCase(changeProductStatus.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
  },
});

export const { resetCreateSuccess, resetUpdateSuccess, clearErrors, clearBarcodeResult } =
  adminProductsSlice.actions;

export default adminProductsSlice.reducer;

// // ADMIN_REDUX_MANAGEMENT/adminProductsSlice.js

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path

// // ─────────────────────────────────────────────
// //  HELPERS
// // ─────────────────────────────────────────────
// const extractProducts = (payload) => {
//   if (!payload) return [];
//   if (Array.isArray(payload)) return payload;
//   if (Array.isArray(payload.products)) return payload.products;
//   if (Array.isArray(payload.data)) return payload.data;
//   if (payload.data && Array.isArray(payload.data.products)) return payload.data.products;
//   if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
//   console.warn("[Slice] Unknown response shape:", Object.keys(payload));
//   return [];
// };

// const extractProduct = (payload) => {
//   if (!payload) return null;
//   if (payload.product) return payload.product;
//   if (payload.data?.product) return payload.data.product;
//   if (payload._id) return payload;
//   return null;
// };

// // ─────────────────────────────────────────────
// //  buildProductFormData
// //  Used for: createProduct, updateProduct (full),
// //            toggleFeatured, changeStatus
// //
// //  BARCODE FIX: barcode is ALWAYS included in each variant
// //  when present. Uses Number() conversion.
// //  On create: every variant must have barcode (validated upstream)
// //  On update (toggle/status): existing variants already have barcode from DB
// // ─────────────────────────────────────────────
// const buildProductFormData = (data) => {
//   const fd = new FormData();

//   fd.append("name",        data.name        || "");
//   fd.append("title",       data.title       || "");
//   fd.append("description", data.description || "");
//   fd.append("brand",       data.brand       || "Generic");
//   fd.append("status",      data.status      || "draft");
//   fd.append("isFeatured",  data.isFeatured  ? "true" : "false");

//   const categoryId =
//     data.category && typeof data.category === "object"
//       ? data.category._id
//       : data.category;
//   fd.append("category", categoryId || "");

//   fd.append("soldInfo",   JSON.stringify(data.soldInfo   || { enabled: false, count: 0 }));
//   fd.append("fomo",       JSON.stringify(data.fomo       || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" }));
//   fd.append("shipping",   JSON.stringify(data.shipping   || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } }));
//   fd.append("attributes", JSON.stringify(data.attributes || []));

//   const variantsJson = (data.variants || []).map((v) => {
//     const variant = {
//       attributes: v.attributes || [],
//       price: {
//         base: Number(v.price?.base) || 0,
//         sale: (v.price?.sale !== "" && v.price?.sale != null) ? Number(v.price.sale) : null,
//       },
//       inventory: {
//         quantity:          Number(v.inventory?.quantity)          || 0,
//         lowStockThreshold: Number(v.inventory?.lowStockThreshold) || 5,
//         trackInventory:    v.inventory?.trackInventory !== false,
//       },
//       images:   [],
//       isActive: v.isActive !== false,
//     };

//     // ALWAYS include barcode when it exists (required by backend for create)
//     // Use Number() — barcode can be string "123" or number 123 from DB
//     if (v.barcode !== undefined && v.barcode !== null && v.barcode !== "") {
//       variant.barcode = Number(v.barcode);
//     }

//     // ALWAYS include sku when it exists (preserves existing SKU on update)
//     if (v.sku) variant.sku = v.sku;

//     return variant;
//   });

//   fd.append("variants", JSON.stringify(variantsJson));

//   // Variant image files
//   (data.variants || []).forEach((v, variantIndex) => {
//     (v.images || []).forEach((img) => {
//       if (img?.file instanceof File) {
//         fd.append(`variantImages_${variantIndex}`, img.file);
//       }
//     });
//   });

//   return fd;
// };

// // ─────────────────────────────────────────────
// //  productToUpdateData
// //  Converts a full Redux product to update payload shape.
// //  Used by toggleFeatured + changeStatus to avoid extra GET.
// // ─────────────────────────────────────────────
// const productToUpdateData = (product, overrides = {}) => ({
//   name:        product.name,
//   title:       product.title,
//   description: product.description || "",
//   brand:       product.brand       || "Generic",
//   status:      product.status,
//   isFeatured:  product.isFeatured  || false,
//   category:    product.category?._id || product.category,
//   soldInfo:    product.soldInfo    || { enabled: false, count: 0 },
//   fomo:        product.fomo        || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" },
//   shipping:    product.shipping    || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } },
//   attributes:  product.attributes  || [],
//   variants: (product.variants || []).map((v) => ({
//     sku:        v.sku,
//     barcode:    v.barcode,   // preserve barcode from DB
//     attributes: v.attributes || [],
//     price: { base: v.price?.base || 0, sale: v.price?.sale ?? null },
//     inventory: {
//       quantity:          v.inventory?.quantity          || 0,
//       lowStockThreshold: v.inventory?.lowStockThreshold || 5,
//       trackInventory:    v.inventory?.trackInventory    !== false,
//     },
//     images:   [],
//     isActive: v.isActive !== false,
//   })),
//   ...overrides,
// });

// // ─────────────────────────────────────────────
// //  THUNKS
// // ─────────────────────────────────────────────

// // 1. Fetch all products (active + draft)
// export const fetchAllProducts = createAsyncThunk(
//   "adminProducts/fetchAll",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get("/admin/products/all");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
//     }
//   }
// );

// // 2. Fetch archived
// export const fetchArchivedProducts = createAsyncThunk(
//   "adminProducts/fetchArchived",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get("/admin/products/archived");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to fetch archived products");
//     }
//   }
// );

// // 3. Create product
// //    Validates barcodes client-side before hitting API
// export const createProduct = createAsyncThunk(
//   "adminProducts/create",
//   async (formData, { rejectWithValue }) => {
//     try {
//       // Client-side barcode validation
//       const variants = formData.variants || [];
//       for (let i = 0; i < variants.length; i++) {
//         const bc = variants[i].barcode;
//         if (bc === undefined || bc === null || bc === "") {
//           return rejectWithValue(`Variant ${i + 1}: barcode is required`);
//         }
//         if (isNaN(Number(bc))) {
//           return rejectWithValue(`Variant ${i + 1}: barcode must be a valid number`);
//         }
//       }
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.post("/admin/products", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to create product");
//     }
//   }
// );

// // 4. Full product update (EditProductModal — product-level fields)
// export const updateProduct = createAsyncThunk(
//   "adminProducts/update",
//   async ({ slug, formData }, { rejectWithValue }) => {
//     try {
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to update product");
//     }
//   }
// );

// // 5. Soft delete
// export const softDeleteProduct = createAsyncThunk(
//   "adminProducts/softDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       await axiosInstance.delete(`/admin/products/${slug}`);
//       return { slug };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to archive product");
//     }
//   }
// );

// // 6. Hard delete
// export const hardDeleteProduct = createAsyncThunk(
//   "adminProducts/hardDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       await axiosInstance.delete(`/admin/products/hard/${slug}`);
//       return { slug };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to permanently delete product");
//     }
//   }
// );

// // 7. Restore
// export const restoreProduct = createAsyncThunk(
//   "adminProducts/restore",
//   async (slug, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.patch(`/admin/products/restore/${slug}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Failed to restore product");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  8. ADD VARIANT
// //  POST /admin/products/:slug/variants
// //  Body: JSON { barcode, attributes, price, inventory, isActive }
// //  Backend auto-generates SKU
// // ─────────────────────────────────────────────
// export const addVariantToProduct = createAsyncThunk(
//   "adminProducts/addVariant",
//   async ({ slug, variantData }, { rejectWithValue }) => {
//     try {
//       if (!variantData.barcode && variantData.barcode !== 0) {
//         return rejectWithValue("Barcode is required to add a variant");
//       }
//       if (isNaN(Number(variantData.barcode))) {
//         return rejectWithValue("Barcode must be a valid number");
//       }

//       const payload = {
//         barcode:    Number(variantData.barcode),
//         attributes: variantData.attributes || [],
//         price: {
//           base: Number(variantData.price?.base) || 0,
//           sale: (variantData.price?.sale !== "" && variantData.price?.sale != null)
//             ? Number(variantData.price.sale)
//             : null,
//         },
//         inventory: {
//           quantity:          Number(variantData.inventory?.quantity)          || 0,
//           lowStockThreshold: Number(variantData.inventory?.lowStockThreshold) || 5,
//           trackInventory:    variantData.inventory?.trackInventory !== false,
//         },
//         isActive: variantData.isActive !== false,
//       };

//       console.log("[Slice] addVariant POST /admin/products/" + slug + "/variants, barcode:", payload.barcode);
//       const res = await axiosInstance.post(`/admin/products/${slug}/variants`, payload);
//       console.log("[Slice] addVariant response:", res.data);

//       const updatedProduct = extractProduct(res.data) || res.data;
//       return { slug, product: updatedProduct };
//     } catch (err) {
//       console.error("[Slice] addVariant error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to add variant");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  9. DELETE VARIANT
// //  DELETE /admin/products/:slug/variants
// //  Body: { barcode: Number }
// //  axios DELETE body goes under `data` key
// // ─────────────────────────────────────────────
// export const deleteVariantFromProduct = createAsyncThunk(
//   "adminProducts/deleteVariant",
//   async ({ slug, barcode }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] deleteVariant DELETE /admin/products/" + slug + "/variants, barcode:", barcode);

//       const res = await axiosInstance.delete(`/admin/products/${slug}/variants`, {
//         data: { barcode: Number(barcode) },
//       });

//       console.log("[Slice] deleteVariant response:", res.data);
//       const updatedProduct = extractProduct(res.data) || res.data;
//       return { slug, product: updatedProduct };
//     } catch (err) {
//       console.error("[Slice] deleteVariant error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to delete variant");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  10. UPDATE VARIANT BY BARCODE
// //  PUT /admin/products/:slug
// //  Body: JSON { barcode, price?, inventory? }
// //  Backend detects `barcode` in req.body → routes to variant update
// //  Must be JSON not FormData
// // ─────────────────────────────────────────────
// export const updateVariantByBarcode = createAsyncThunk(
//   "adminProducts/updateVariant",
//   async ({ slug, barcode, price, inventory }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] updateVariant PUT /admin/products/" + slug + ", barcode:", barcode);

//       const payload = { barcode: Number(barcode) };
//       if (price) {
//         payload.price = {
//           base: Number(price.base),
//           sale: (price.sale !== "" && price.sale != null) ? Number(price.sale) : null,
//         };
//       }
//       if (inventory) {
//         payload.inventory = {
//           quantity:          Number(inventory.quantity),
//           lowStockThreshold: Number(inventory.lowStockThreshold),
//           trackInventory:    inventory.trackInventory !== false,
//         };
//       }

//       const res = await axiosInstance.put(`/admin/products/${slug}`, payload, {
//         headers: { "Content-Type": "application/json" },
//       });

//       console.log("[Slice] updateVariant response:", res.data);
//       const updatedProduct = extractProduct(res.data) || res.data;
//       return { slug, product: updatedProduct };
//     } catch (err) {
//       console.error("[Slice] updateVariant error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to update variant");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  11. FETCH VARIANT BY BARCODE
// //  GET /admin/products/variant/:barcode
// //  Returns { product, variant } — for barcode scanner feature
// // ─────────────────────────────────────────────
// export const fetchVariantByBarcode = createAsyncThunk(
//   "adminProducts/fetchVariantByBarcode",
//   async (barcode, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get(`/admin/products/variant/${barcode}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || "Variant not found for this barcode");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  12. TOGGLE FEATURED
// //  Uses full product from Redux — no extra GET
// // ─────────────────────────────────────────────
// export const toggleFeaturedProduct = createAsyncThunk(
//   "adminProducts/toggleFeatured",
//   async ({ product }, { rejectWithValue }) => {
//     try {
//       const newIsFeatured = !product.isFeatured;
//       console.log("[Slice] toggleFeatured PUT /admin/products/" + product.slug, "→", newIsFeatured);

//       const updateData = productToUpdateData(product, { isFeatured: newIsFeatured });
//       const fd = buildProductFormData(updateData);

//       const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const serverProduct = extractProduct(res.data);
//       return {
//         product: {
//           ...product,
//           ...(serverProduct || {}),
//           isFeatured: newIsFeatured,
//           category: serverProduct?.category?.name ? serverProduct.category : product.category,
//         },
//       };
//     } catch (err) {
//       console.error("[Slice] toggleFeatured error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to toggle featured");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  13. CHANGE STATUS
// //  Uses full product from Redux — no extra GET
// // ─────────────────────────────────────────────
// export const changeProductStatus = createAsyncThunk(
//   "adminProducts/changeStatus",
//   async ({ product, status }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] changeStatus PUT /admin/products/" + product.slug, "→", status);

//       const updateData = productToUpdateData(product, { status });
//       const fd = buildProductFormData(updateData);

//       const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const serverProduct = extractProduct(res.data);
//       return {
//         product: {
//           ...product,
//           ...(serverProduct || {}),
//           status,
//           category: serverProduct?.category?.name ? serverProduct.category : product.category,
//         },
//       };
//     } catch (err) {
//       console.error("[Slice] changeStatus error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to change status");
//     }
//   }
// );

// // ─────────────────────────────────────────────
// //  SLICE
// // ─────────────────────────────────────────────
// const adminProductsSlice = createSlice({
//   name: "adminProducts",
//   initialState: {
//     products:        [],
//     productsLoading: false,
//     productsLoaded:  false,
//     productsError:   null,

//     archivedProducts: [],
//     archivedLoading:  false,
//     archivedLoaded:   false,
//     archivedError:    null,

//     createLoading:  false,
//     createError:    null,
//     createSuccess:  false,

//     updateLoading:  false,
//     updateError:    null,
//     updateSuccess:  false,

//     // covers toggleFeatured, changeStatus, softDelete, hardDelete,
//     // restore, addVariant, deleteVariant, updateVariant
//     actionLoading:  false,
//     actionError:    null,

//     // barcode scanner / lookup
//     barcodeResult:   null,
//     barcodeLoading:  false,
//     barcodeError:    null,
//   },
//   reducers: {
//     resetCreateSuccess(state) { state.createSuccess = false; state.createError = null; },
//     resetUpdateSuccess(state) { state.updateSuccess = false; state.updateError = null; },
//     clearErrors(state) {
//       state.productsError = null; state.archivedError = null;
//       state.createError   = null; state.updateError   = null;
//       state.actionError   = null; state.barcodeError  = null;
//     },
//     clearBarcodeResult(state) {
//       state.barcodeResult = null; state.barcodeError = null; state.barcodeLoading = false;
//     },
//   },
//   extraReducers: (builder) => {

//     // fetchAllProducts
//     builder
//       .addCase(fetchAllProducts.pending,   (s) => { s.productsLoading = true;  s.productsError = null; })
//       .addCase(fetchAllProducts.fulfilled, (s, a) => {
//         s.productsLoading = false; s.productsLoaded = true;
//         s.products = extractProducts(a.payload);
//         console.log("[Slice] ✅ Products loaded:", s.products.length);
//       })
//       .addCase(fetchAllProducts.rejected,  (s, a) => { s.productsLoading = false; s.productsError = a.payload; });

//     // fetchArchivedProducts
//     builder
//       .addCase(fetchArchivedProducts.pending,   (s) => { s.archivedLoading = true; s.archivedError = null; })
//       .addCase(fetchArchivedProducts.fulfilled, (s, a) => {
//         s.archivedLoading = false; s.archivedLoaded = true;
//         s.archivedProducts = extractProducts(a.payload);
//       })
//       .addCase(fetchArchivedProducts.rejected,  (s, a) => { s.archivedLoading = false; s.archivedError = a.payload; });

//     // createProduct
//     builder
//       .addCase(createProduct.pending,   (s) => { s.createLoading = true;  s.createError = null;  s.createSuccess = false; })
//       .addCase(createProduct.fulfilled, (s, a) => {
//         s.createLoading = false; s.createSuccess = true;
//         const p = extractProduct(a.payload) || a.payload;
//         s.products = [p, ...s.products];
//         console.log("[Slice] ✅ Created:", p?.name);
//       })
//       .addCase(createProduct.rejected,  (s, a) => { s.createLoading = false; s.createError = a.payload; });

//     // updateProduct
//     builder
//       .addCase(updateProduct.pending,   (s) => { s.updateLoading = true;  s.updateError = null;  s.updateSuccess = false; })
//       .addCase(updateProduct.fulfilled, (s, a) => {
//         s.updateLoading = false; s.updateSuccess = true;
//         const u = extractProduct(a.payload) || a.payload;
//         s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Updated:", u?.name);
//       })
//       .addCase(updateProduct.rejected,  (s, a) => { s.updateLoading = false; s.updateError = a.payload; });

//     // softDeleteProduct
//     builder
//       .addCase(softDeleteProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(softDeleteProduct.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const { slug } = a.payload;
//         const product = s.products.find((p) => p.slug === slug);
//         if (product) {
//           s.products         = s.products.filter((p) => p.slug !== slug);
//           s.archivedProducts = [{ ...product, status: "archived" }, ...s.archivedProducts];
//         }
//       })
//       .addCase(softDeleteProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // hardDeleteProduct
//     builder
//       .addCase(hardDeleteProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(hardDeleteProduct.fulfilled, (s, a) => {
//         s.actionLoading    = false;
//         s.archivedProducts = s.archivedProducts.filter((p) => p.slug !== a.payload.slug);
//       })
//       .addCase(hardDeleteProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // restoreProduct
//     builder
//       .addCase(restoreProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(restoreProduct.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const r = extractProduct(a.payload) || a.payload;
//         s.archivedProducts = s.archivedProducts.filter((p) => p._id !== r._id);
//         s.products         = [r, ...s.products];
//       })
//       .addCase(restoreProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // addVariantToProduct
//     builder
//       .addCase(addVariantToProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(addVariantToProduct.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const u = a.payload.product;
//         if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Variant added to:", u?.name);
//       })
//       .addCase(addVariantToProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // deleteVariantFromProduct
//     builder
//       .addCase(deleteVariantFromProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(deleteVariantFromProduct.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const u = a.payload.product;
//         if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Variant deleted from:", u?.name);
//       })
//       .addCase(deleteVariantFromProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // updateVariantByBarcode
//     builder
//       .addCase(updateVariantByBarcode.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(updateVariantByBarcode.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const u = a.payload.product;
//         if (u?._id) s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Variant updated in:", u?.name);
//       })
//       .addCase(updateVariantByBarcode.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // fetchVariantByBarcode
//     builder
//       .addCase(fetchVariantByBarcode.pending,   (s) => { s.barcodeLoading = true;  s.barcodeError = null; s.barcodeResult = null; })
//       .addCase(fetchVariantByBarcode.fulfilled, (s, a) => { s.barcodeLoading = false; s.barcodeResult = a.payload; })
//       .addCase(fetchVariantByBarcode.rejected,  (s, a) => { s.barcodeLoading = false; s.barcodeError  = a.payload; });

//     // toggleFeaturedProduct
//     builder
//       .addCase(toggleFeaturedProduct.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(toggleFeaturedProduct.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const u = a.payload.product;
//         s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Featured:", u?.name, "→", u?.isFeatured);
//       })
//       .addCase(toggleFeaturedProduct.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });

//     // changeProductStatus
//     builder
//       .addCase(changeProductStatus.pending,   (s) => { s.actionLoading = true;  s.actionError = null; })
//       .addCase(changeProductStatus.fulfilled, (s, a) => {
//         s.actionLoading = false;
//         const u = a.payload.product;
//         s.products = s.products.map((p) => p._id === u._id ? u : p);
//         console.log("[Slice] ✅ Status:", u?.name, "→", u?.status);
//       })
//       .addCase(changeProductStatus.rejected,  (s, a) => { s.actionLoading = false; s.actionError = a.payload; });
//   },
// });

// export const { resetCreateSuccess, resetUpdateSuccess, clearErrors, clearBarcodeResult } =
//   adminProductsSlice.actions;

// export default adminProductsSlice.reducer;

// CODE IS WORKING BUT UPSIDE CODE HAVE BARCODE API NEW UPDATED CODE >>>>>>>>>>>>>>>>>>>>>>>>>

// // ADMIN_REDUX_MANAGEMENT/adminProductsSlice.js

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path if needed

// // ─────────────────────────────────────────────────────────────
// //  HELPER — extract products array from ANY backend response shape
// //  Handles all variants:
// //    { products: [] }
// //    { data: [] }
// //    { data: { products: [] } }
// //    { success: true, products: [] }
// //    direct array []
// // ─────────────────────────────────────────────────────────────
// const extractProducts = (payload) => {
//   if (!payload) return [];
//   if (Array.isArray(payload)) return payload;
//   if (Array.isArray(payload.products)) return payload.products;
//   if (Array.isArray(payload.data)) return payload.data;
//   if (payload.data && Array.isArray(payload.data.products)) return payload.data.products;
//   if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
//   console.warn("[adminProductsSlice] Unknown response shape — add handler:", JSON.stringify(Object.keys(payload)));
//   return [];
// };

// // ─────────────────────────────────────────────────────────────
// //  HELPER — extract single product from backend response
// // ─────────────────────────────────────────────────────────────
// const extractProduct = (payload) => {
//   if (!payload) return null;
//   if (payload.product) return payload.product;
//   if (payload.data?.product) return payload.data.product;
//   if (payload._id) return payload;
//   return null;
// };

// // ─────────────────────────────────────────────────────────────
// //  HELPER — build complete multipart/form-data
// //  CRITICAL: passes existing variant `sku` back so backend
// //  Mongoose validation doesn't fail with "sku is required"
// // ─────────────────────────────────────────────────────────────
// const buildProductFormData = (data) => {
//   const fd = new FormData();

//   fd.append("name", data.name || "");
//   fd.append("title", data.title || "");
//   fd.append("description", data.description || "");
//   fd.append("brand", data.brand || "Generic");
//   fd.append("status", data.status || "draft");
//   fd.append("isFeatured", data.isFeatured ? "true" : "false");

//   const categoryId =
//     data.category && typeof data.category === "object"
//       ? data.category._id
//       : data.category;
//   fd.append("category", categoryId || "");

//   fd.append("soldInfo", JSON.stringify(data.soldInfo || { enabled: false, count: 0 }));
//   fd.append("fomo", JSON.stringify(data.fomo || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" }));
//   fd.append("shipping", JSON.stringify(data.shipping || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } }));
//   fd.append("attributes", JSON.stringify(data.attributes || []));

//   const variantsJson = (data.variants || []).map((v) => {
//     const variant = {
//       attributes: v.attributes || [],
//       price: {
//         base: Number(v.price?.base) || 0,
//         sale: (v.price?.sale !== "" && v.price?.sale != null) ? Number(v.price.sale) : null,
//       },
//       inventory: {
//         quantity: Number(v.inventory?.quantity) || 0,
//         lowStockThreshold: Number(v.inventory?.lowStockThreshold) || 5,
//         trackInventory: v.inventory?.trackInventory !== false,
//       },
//       images: [],
//       isActive: v.isActive !== false,
//     };
//     if (v.sku) variant.sku = v.sku; // CRITICAL: preserve sku on updates
//     return variant;
//   });

//   fd.append("variants", JSON.stringify(variantsJson));

//   (data.variants || []).forEach((v, variantIndex) => {
//     (v.images || []).forEach((img) => {
//       if (img?.file instanceof File) {
//         fd.append(`variantImages_${variantIndex}`, img.file);
//       }
//     });
//   });

//   return fd;
// };

// // ─────────────────────────────────────────────────────────────
// //  HELPER — convert a Redux product into update payload shape
// //  Used by toggleFeatured + changeStatus (no extra GET needed)
// // ─────────────────────────────────────────────────────────────
// const productToUpdateData = (product, overrides = {}) => ({
//   name: product.name,
//   title: product.title,
//   description: product.description || "",
//   brand: product.brand || "Generic",
//   status: product.status,
//   isFeatured: product.isFeatured || false,
//   category: product.category?._id || product.category,
//   soldInfo: product.soldInfo || { enabled: false, count: 0 },
//   fomo: product.fomo || { enabled: false, type: "viewing_now", viewingNow: 0, productLeft: 0, customMessage: "" },
//   shipping: product.shipping || { weight: 0, dimensions: { length: 0, width: 0, height: 0 } },
//   attributes: product.attributes || [],
//   variants: (product.variants || []).map((v) => ({
//     sku: v.sku,           // CRITICAL: preserve sku from Redux state
//     attributes: v.attributes || [],
//     price: { base: v.price?.base || 0, sale: v.price?.sale ?? null },
//     inventory: {
//       quantity: v.inventory?.quantity || 0,
//       lowStockThreshold: v.inventory?.lowStockThreshold || 5,
//       trackInventory: v.inventory?.trackInventory !== false,
//     },
//     images: [],
//     isActive: v.isActive !== false,
//   })),
//   ...overrides, // applied LAST: { status: "active" } or { isFeatured: true }
// });

// // ─────────────────────────────────────────────────────────────
// //  ASYNC THUNKS
// // ─────────────────────────────────────────────────────────────

// // 1. Fetch all products (active + draft)
// export const fetchAllProducts = createAsyncThunk(
//   "adminProducts/fetchAll",
//   async (_, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] fetchAllProducts → GET /admin/products/all");
//       const res = await axiosInstance.get("/admin/products/all"); // /all returns active + draft; GET "/" is active only
//       console.log("[Slice] fetchAllProducts response keys:", Object.keys(res.data || {}));
//       return res.data;
//     } catch (err) {
//       console.error("[Slice] fetchAllProducts error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
//     }
//   }
// );

// // 2. Fetch archived products
// export const fetchArchivedProducts = createAsyncThunk(
//   "adminProducts/fetchArchived",
//   async (_, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] fetchArchivedProducts → GET /admin/products/archived");
//       const res = await axiosInstance.get("/admin/products/archived");
//       return res.data;
//     } catch (err) {
//       console.error("[Slice] fetchArchivedProducts error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to fetch archived products");
//     }
//   }
// );

// // 3. Create product
// export const createProduct = createAsyncThunk(
//   "adminProducts/create",
//   async (formData, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] createProduct → POST /admin/products");
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.post("/admin/products", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       console.log("[Slice] createProduct response:", res.data);
//       return res.data;
//     } catch (err) {
//       console.error("[Slice] createProduct error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to create product");
//     }
//   }
// );

// // 4. Full update (used by EditProductModal)
// export const updateProduct = createAsyncThunk(
//   "adminProducts/update",
//   async ({ slug, formData }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] updateProduct → PUT /admin/products/" + slug);
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       console.log("[Slice] updateProduct response:", res.data);
//       return res.data;
//     } catch (err) {
//       console.error("[Slice] updateProduct error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to update product");
//     }
//   }
// );

// // 5. Soft delete (archive)
// export const softDeleteProduct = createAsyncThunk(
//   "adminProducts/softDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] softDelete → DELETE /admin/products/" + slug);
//       await axiosInstance.delete(`/admin/products/${slug}`);
//       return { slug };
//     } catch (err) {
//       console.error("[Slice] softDelete error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to archive product");
//     }
//   }
// );

// // 6. Hard delete
// export const hardDeleteProduct = createAsyncThunk(
//   "adminProducts/hardDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] hardDelete → DELETE /admin/products/hard/" + slug);
//       await axiosInstance.delete(`/admin/products/hard/${slug}`);
//       return { slug };
//     } catch (err) {
//       console.error("[Slice] hardDelete error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to permanently delete product");
//     }
//   }
// );

// // 7. Restore archived product
// export const restoreProduct = createAsyncThunk(
//   "adminProducts/restore",
//   async (slug, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] restore → PATCH /admin/products/restore/" + slug);
//       const res = await axiosInstance.patch(`/admin/products/restore/${slug}`);
//       return res.data;
//     } catch (err) {
//       console.error("[Slice] restore error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to restore product");
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// //  TOGGLE FEATURED
// //
// //  FIX: Receives full product object from Redux state.
// //  - product.slug is correct (from actual Redux data, not "path")
// //  - product.variants[].sku is preserved → no SKU validation error
// //  - No extra GET call → no "Product not found" error
// //  - After PUT, merges with local data to preserve category.name
// //
// //  Admin_dashboard must call:
// //    dispatch(toggleFeaturedProduct({ product }))
// //  NOT:
// //    dispatch(toggleFeaturedProduct({ slug, isFeatured }))
// // ─────────────────────────────────────────────────────────────
// export const toggleFeaturedProduct = createAsyncThunk(
//   "adminProducts/toggleFeatured",
//   async ({ product }, { rejectWithValue }) => {
//     try {
//       const newIsFeatured = !product.isFeatured;
//       console.log("[Slice] toggleFeatured → PUT /admin/products/" + product.slug);
//       console.log("[Slice] isFeatured:", product.isFeatured, "→", newIsFeatured);
//       console.log("[Slice] variant SKUs:", product.variants?.map(v => v.sku));

//       const updateData = productToUpdateData(product, { isFeatured: newIsFeatured });
//       const fd = buildProductFormData(updateData);

//       const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       console.log("[Slice] toggleFeatured response:", res.data);
//       const serverProduct = extractProduct(res.data);

//       return {
//         product: {
//           ...product,                          // base: full Redux product (has category.name)
//           ...(serverProduct || {}),            // override with fresh server fields
//           isFeatured: newIsFeatured,           // guarantee correct value
//           category: serverProduct?.category?.name  // if server returned populated object, use it
//             ? serverProduct.category           // fully populated → use server's
//             : product.category,               // server returned ObjectId → keep Redux's populated one
//         }
//       };
//     } catch (err) {
//       console.error("[Slice] toggleFeatured error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to toggle featured");
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// //  CHANGE STATUS
// //
// //  Same approach as toggleFeatured.
// //  Admin_dashboard must call:
// //    dispatch(changeProductStatus({ product, status: newStatus }))
// //  NOT:
// //    dispatch(changeProductStatus({ slug, status }))
// // ─────────────────────────────────────────────────────────────
// export const changeProductStatus = createAsyncThunk(
//   "adminProducts/changeStatus",
//   async ({ product, status }, { rejectWithValue }) => {
//     try {
//       console.log("[Slice] changeStatus → PUT /admin/products/" + product.slug);
//       console.log("[Slice] status:", product.status, "→", status);
//       console.log("[Slice] variant SKUs:", product.variants?.map(v => v.sku));

//       const updateData = productToUpdateData(product, { status });
//       const fd = buildProductFormData(updateData);

//       const res = await axiosInstance.put(`/admin/products/${product.slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       console.log("[Slice] changeStatus response:", res.data);
//       const serverProduct = extractProduct(res.data);

//       return {
//         product: {
//           ...product,
//           ...(serverProduct || {}),
//           status,
//           category: serverProduct?.category?.name
//             ? serverProduct.category
//             : product.category,
//         }
//       };
//     } catch (err) {
//       console.error("[Slice] changeStatus error:", err.response?.data);
//       return rejectWithValue(err.response?.data?.message || "Failed to change status");
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// //  SLICE
// // ─────────────────────────────────────────────────────────────
// const adminProductsSlice = createSlice({
//   name: "adminProducts",
//   initialState: {
//     products: [],
//     productsLoading: false,
//     productsLoaded: false,
//     productsError: null,

//     archivedProducts: [],
//     archivedLoading: false,
//     archivedLoaded: false,
//     archivedError: null,

//     createLoading: false,
//     createError: null,
//     createSuccess: false,

//     updateLoading: false,
//     updateError: null,
//     updateSuccess: false,

//     actionLoading: false,
//     actionError: null,
//   },
//   reducers: {
//     resetCreateSuccess(state) {
//       state.createSuccess = false;
//       state.createError = null;
//     },
//     resetUpdateSuccess(state) {
//       state.updateSuccess = false;
//       state.updateError = null;
//     },
//     clearErrors(state) {
//       state.productsError = null;
//       state.archivedError = null;
//       state.createError = null;
//       state.updateError = null;
//       state.actionError = null;
//     },
//   },
//   extraReducers: (builder) => {

//     // ── fetchAllProducts ──────────────────────────────────────
//     builder
//       .addCase(fetchAllProducts.pending, (state) => {
//         state.productsLoading = true;
//         state.productsError = null;
//       })
//       .addCase(fetchAllProducts.fulfilled, (state, action) => {
//         state.productsLoading = false;
//         state.productsLoaded = true;
//         const list = extractProducts(action.payload);
//         state.products = list;
//         console.log("[Slice] ✅ Products in Redux:", list.length);
//         if (list[0]) {
//           console.log("[Slice] First product:", { slug: list[0].slug, name: list[0].name, category: list[0].category });
//         }
//       })
//       .addCase(fetchAllProducts.rejected, (state, action) => {
//         state.productsLoading = false;
//         state.productsError = action.payload;
//         console.error("[Slice] ❌ fetchAllProducts rejected:", action.payload);
//       });

//     // ── fetchArchivedProducts ─────────────────────────────────
//     builder
//       .addCase(fetchArchivedProducts.pending, (state) => {
//         state.archivedLoading = true;
//         state.archivedError = null;
//       })
//       .addCase(fetchArchivedProducts.fulfilled, (state, action) => {
//         state.archivedLoading = false;
//         state.archivedLoaded = true;
//         state.archivedProducts = extractProducts(action.payload);
//         console.log("[Slice] ✅ Archived products:", state.archivedProducts.length);
//       })
//       .addCase(fetchArchivedProducts.rejected, (state, action) => {
//         state.archivedLoading = false;
//         state.archivedError = action.payload;
//         console.error("[Slice] ❌ fetchArchivedProducts rejected:", action.payload);
//       });

//     // ── createProduct ─────────────────────────────────────────
//     builder
//       .addCase(createProduct.pending, (state) => {
//         state.createLoading = true;
//         state.createError = null;
//         state.createSuccess = false;
//       })
//       .addCase(createProduct.fulfilled, (state, action) => {
//         state.createLoading = false;
//         state.createSuccess = true;
//         const newProduct = extractProduct(action.payload) || action.payload;
//         state.products = [newProduct, ...state.products];
//         console.log("[Slice] ✅ Product created:", newProduct?.name);
//       })
//       .addCase(createProduct.rejected, (state, action) => {
//         state.createLoading = false;
//         state.createError = action.payload;
//         console.error("[Slice] ❌ createProduct rejected:", action.payload);
//       });

//     // ── updateProduct ─────────────────────────────────────────
//     builder
//       .addCase(updateProduct.pending, (state) => {
//         state.updateLoading = true;
//         state.updateError = null;
//         state.updateSuccess = false;
//       })
//       .addCase(updateProduct.fulfilled, (state, action) => {
//         state.updateLoading = false;
//         state.updateSuccess = true;
//         const updated = extractProduct(action.payload) || action.payload;
//         state.products = state.products.map((p) => p._id === updated._id ? updated : p);
//         console.log("[Slice] ✅ Product updated:", updated?.name);
//       })
//       .addCase(updateProduct.rejected, (state, action) => {
//         state.updateLoading = false;
//         state.updateError = action.payload;
//         console.error("[Slice] ❌ updateProduct rejected:", action.payload);
//       });

//     // ── softDeleteProduct ─────────────────────────────────────
//     builder
//       .addCase(softDeleteProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(softDeleteProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const { slug } = action.payload;
//         const product = state.products.find((p) => p.slug === slug);
//         if (product) {
//           state.products = state.products.filter((p) => p.slug !== slug);
//           state.archivedProducts = [{ ...product, status: "archived" }, ...state.archivedProducts];
//           console.log("[Slice] ✅ Archived:", slug);
//         }
//       })
//       .addCase(softDeleteProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//         console.error("[Slice] ❌ softDelete rejected:", action.payload);
//       });

//     // ── hardDeleteProduct ─────────────────────────────────────
//     builder
//       .addCase(hardDeleteProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(hardDeleteProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.archivedProducts = state.archivedProducts.filter(
//           (p) => p.slug !== action.payload.slug
//         );
//         console.log("[Slice] ✅ Hard deleted:", action.payload.slug);
//       })
//       .addCase(hardDeleteProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//         console.error("[Slice] ❌ hardDelete rejected:", action.payload);
//       });

//     // ── restoreProduct ────────────────────────────────────────
//     builder
//       .addCase(restoreProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(restoreProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const restored = extractProduct(action.payload) || action.payload;
//         state.archivedProducts = state.archivedProducts.filter((p) => p._id !== restored._id);
//         state.products = [restored, ...state.products];
//         console.log("[Slice] ✅ Restored:", restored?.name);
//       })
//       .addCase(restoreProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//         console.error("[Slice] ❌ restore rejected:", action.payload);
//       });

//     // ── toggleFeaturedProduct ─────────────────────────────────
//     builder
//       .addCase(toggleFeaturedProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(toggleFeaturedProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const updated = action.payload.product;
//         state.products = state.products.map((p) => p._id === updated._id ? updated : p);
//         console.log("[Slice] ✅ Featured toggled:", updated?.name, "→", updated?.isFeatured);
//       })
//       .addCase(toggleFeaturedProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//         console.error("[Slice] ❌ toggleFeatured rejected:", action.payload);
//       });

//     // ── changeProductStatus ───────────────────────────────────
//     builder
//       .addCase(changeProductStatus.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(changeProductStatus.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const updated = action.payload.product;
//         state.products = state.products.map((p) => p._id === updated._id ? updated : p);
//         console.log("[Slice] ✅ Status changed:", updated?.name, "→", updated?.status);
//       })
//       .addCase(changeProductStatus.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//         console.error("[Slice] ❌ changeStatus rejected:", action.payload);
//       });
//   },
// });

// export const { resetCreateSuccess, resetUpdateSuccess, clearErrors } =
//   adminProductsSlice.actions;

// export default adminProductsSlice.reducer;


// // ADMIN_REDUX_MANAGEMENT/adminProductsSlice.js

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path to your axiosInstance

// // ─────────────────────────────────────────────────────────────
// //  HELPER — build FormData from product formData object
// //  Backend expects multipart/form-data because of image uploads
// // ─────────────────────────────────────────────────────────────
// const buildProductFormData = (formData) => {
//   const fd = new FormData();

//   // ── Scalar fields ──
//   fd.append("name", formData.name);
//   fd.append("title", formData.title);
//   fd.append("description", formData.description || "");
//   fd.append("brand", formData.brand || "Generic");
//   fd.append("status", formData.status || "draft");
//   fd.append("isFeatured", formData.isFeatured ? "true" : "false");

//   // ── Category — send _id string ──
//   const categoryId =
//     typeof formData.category === "object" && formData.category !== null
//       ? formData.category._id
//       : formData.category;
//   fd.append("category", categoryId);

//   // ── JSON stringified fields ──
//   fd.append(
//     "soldInfo",
//     JSON.stringify(formData.soldInfo || { enabled: false, count: 0 })
//   );
//   fd.append(
//     "fomo",
//     JSON.stringify(
//       formData.fomo || {
//         enabled: false,
//         type: "viewing_now",
//         viewingNow: 0,
//         productLeft: 0,
//         customMessage: "",
//       }
//     )
//   );
//   fd.append(
//     "shipping",
//     JSON.stringify(
//       formData.shipping || {
//         weight: 0,
//         dimensions: { length: 0, width: 0, height: 0 },
//       }
//     )
//   );
//   fd.append("attributes", JSON.stringify(formData.attributes || []));

//   // ── Variants — strip File objects before serialising ──
//   // Real File objects are appended separately as variantImages_<index>
//   const variantsForJson = (formData.variants || []).map((v) => ({
//     attributes: v.attributes || [],
//     price: {
//       base: Number(v.price?.base) || 0,
//       sale:
//         v.price?.sale !== "" && v.price?.sale != null
//           ? Number(v.price.sale)
//           : null,
//     },
//     inventory: {
//       quantity: Number(v.inventory?.quantity) || 0,
//       lowStockThreshold: Number(v.inventory?.lowStockThreshold) || 5,
//       trackInventory: v.inventory?.trackInventory !== false,
//     },
//     images: [], // backend builds this from uploaded files
//     isActive: v.isActive !== false,
//   }));

//   fd.append("variants", JSON.stringify(variantsForJson));

//   // ── Append variant image Files as variantImages_<variantIndex> ──
//   (formData.variants || []).forEach((v, variantIndex) => {
//     (v.images || []).forEach((img) => {
//       // img.file is the raw File object stored by VariantModal
//       if (img.file instanceof File) {
//         fd.append(`variantImages_${variantIndex}`, img.file);
//       }
//     });
//   });

//   return fd;
// };

// // ─────────────────────────────────────────────────────────────
// //  ASYNC THUNKS
// // ─────────────────────────────────────────────────────────────

// // 1. Fetch all active/draft products
// export const fetchAllProducts = createAsyncThunk(
//   "adminProducts/fetchAll",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get("/admin/products");
//       return res.data; // { success, products (or data) }
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to fetch products"
//       );
//     }
//   }
// );

// // 2. Fetch archived products
// export const fetchArchivedProducts = createAsyncThunk(
//   "adminProducts/fetchArchived",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get("/admin/products/archived");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to fetch archived products"
//       );
//     }
//   }
// );

// // 3. Create product
// export const createProduct = createAsyncThunk(
//   "adminProducts/create",
//   async (formData, { rejectWithValue }) => {
//     try {
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.post("/admin/products", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data; // { success, product }
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to create product"
//       );
//     }
//   }
// );

// // 4. Update product (by slug)
// export const updateProduct = createAsyncThunk(
//   "adminProducts/update",
//   async ({ slug, formData }, { rejectWithValue }) => {
//     try {
//       const fd = buildProductFormData(formData);
//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data; // { success, product }
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to update product"
//       );
//     }
//   }
// );

// // 5. Soft delete / archive (by slug)
// export const softDeleteProduct = createAsyncThunk(
//   "adminProducts/softDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.delete(`/admin/products/${slug}`);
//       return { slug, data: res.data };
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to archive product"
//       );
//     }
//   }
// );

// // 6. Hard delete (by slug, only archived)
// export const hardDeleteProduct = createAsyncThunk(
//   "adminProducts/hardDelete",
//   async (slug, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.delete(`/admin/products/hard/${slug}`);
//       return { slug, data: res.data };
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to permanently delete product"
//       );
//     }
//   }
// );

// // 7. Restore archived product (by slug)
// export const restoreProduct = createAsyncThunk(
//   "adminProducts/restore",
//   async (slug, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.patch(`/admin/products/restore/${slug}`);
//       return res.data; // { success, product }
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to restore product"
//       );
//     }
//   }
// );

// // 8. Toggle featured (optimistic — no dedicated endpoint, uses update)
// // We pass slug + current isFeatured value
// export const toggleFeaturedProduct = createAsyncThunk(
//   "adminProducts/toggleFeatured",
//   async ({ slug, isFeatured }, { rejectWithValue }) => {
//     try {
//       // Backend update endpoint accepts partial form-data
//       const fd = new FormData();
//       fd.append("isFeatured", (!isFeatured).toString());
//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to toggle featured"
//       );
//     }
//   }
// );

// // 9. Change product status
// export const changeProductStatus = createAsyncThunk(
//   "adminProducts/changeStatus",
//   async ({ slug, status }, { rejectWithValue }) => {
//     try {
//       const fd = new FormData();
//       fd.append("status", status);
//       const res = await axiosInstance.put(`/admin/products/${slug}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to change status"
//       );
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// //  SLICE
// // ─────────────────────────────────────────────────────────────
// const adminProductsSlice = createSlice({
//   name: "adminProducts",
//   initialState: {
//     // Active + draft products list
//     products: [],
//     productsLoading: false,
//     productsLoaded: false, // true once fetched at least once
//     productsError: null,

//     // Archived products list
//     archivedProducts: [],
//     archivedLoading: false,
//     archivedLoaded: false,
//     archivedError: null,

//     // Create
//     createLoading: false,
//     createError: null,
//     createSuccess: false,

//     // Update
//     updateLoading: false,
//     updateError: null,
//     updateSuccess: false,

//     // Delete / Restore
//     actionLoading: false,
//     actionError: null,
//   },
//   reducers: {
//     // Reset create/update success flags (call after modal closes)
//     resetCreateSuccess(state) {
//       state.createSuccess = false;
//       state.createError = null;
//     },
//     resetUpdateSuccess(state) {
//       state.updateSuccess = false;
//       state.updateError = null;
//     },
//     clearErrors(state) {
//       state.productsError = null;
//       state.archivedError = null;
//       state.createError = null;
//       state.updateError = null;
//       state.actionError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     // ── fetchAllProducts ──────────────────────────────────────
//     builder
//       .addCase(fetchAllProducts.pending, (state) => {
//         state.productsLoading = true;
//         state.productsError = null;
//       })
//       .addCase(fetchAllProducts.fulfilled, (state, action) => {
//         state.productsLoading = false;
//         state.productsLoaded = true;
//         // Backend may return { products: [] } or { data: [] } — handle both
//         state.products =
//           action.payload.products ||
//           action.payload.data ||
//           action.payload || [];
//       })
//       .addCase(fetchAllProducts.rejected, (state, action) => {
//         state.productsLoading = false;
//         state.productsError = action.payload;
//       });

//     // ── fetchArchivedProducts ─────────────────────────────────
//     builder
//       .addCase(fetchArchivedProducts.pending, (state) => {
//         state.archivedLoading = true;
//         state.archivedError = null;
//       })
//       .addCase(fetchArchivedProducts.fulfilled, (state, action) => {
//         state.archivedLoading = false;
//         state.archivedLoaded = true;
//         state.archivedProducts =
//           action.payload.products ||
//           action.payload.data ||
//           action.payload || [];
//       })
//       .addCase(fetchArchivedProducts.rejected, (state, action) => {
//         state.archivedLoading = false;
//         state.archivedError = action.payload;
//       });

//     // ── createProduct ─────────────────────────────────────────
//     builder
//       .addCase(createProduct.pending, (state) => {
//         state.createLoading = true;
//         state.createError = null;
//         state.createSuccess = false;
//       })
//       .addCase(createProduct.fulfilled, (state, action) => {
//         state.createLoading = false;
//         state.createSuccess = true;
//         const newProduct = action.payload.product || action.payload;
//         // Prepend to products list
//         state.products = [newProduct, ...state.products];
//       })
//       .addCase(createProduct.rejected, (state, action) => {
//         state.createLoading = false;
//         state.createError = action.payload;
//       });

//     // ── updateProduct ─────────────────────────────────────────
//     builder
//       .addCase(updateProduct.pending, (state) => {
//         state.updateLoading = true;
//         state.updateError = null;
//         state.updateSuccess = false;
//       })
//       .addCase(updateProduct.fulfilled, (state, action) => {
//         state.updateLoading = false;
//         state.updateSuccess = true;
//         const updated = action.payload.product || action.payload;
//         state.products = state.products.map((p) =>
//           p._id === updated._id ? updated : p
//         );
//       })
//       .addCase(updateProduct.rejected, (state, action) => {
//         state.updateLoading = false;
//         state.updateError = action.payload;
//       });

//     // ── softDeleteProduct ─────────────────────────────────────
//     builder
//       .addCase(softDeleteProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(softDeleteProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const { slug } = action.payload;
//         // Move product from products → archivedProducts
//         const product = state.products.find((p) => p.slug === slug);
//         if (product) {
//           const archived = { ...product, status: "archived" };
//           state.products = state.products.filter((p) => p.slug !== slug);
//           state.archivedProducts = [archived, ...state.archivedProducts];
//         }
//       })
//       .addCase(softDeleteProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//       });

//     // ── hardDeleteProduct ─────────────────────────────────────
//     builder
//       .addCase(hardDeleteProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(hardDeleteProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const { slug } = action.payload;
//         state.archivedProducts = state.archivedProducts.filter(
//           (p) => p.slug !== slug
//         );
//       })
//       .addCase(hardDeleteProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//       });

//     // ── restoreProduct ────────────────────────────────────────
//     builder
//       .addCase(restoreProduct.pending, (state) => {
//         state.actionLoading = true;
//         state.actionError = null;
//       })
//       .addCase(restoreProduct.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         const restored = action.payload.product || action.payload;
//         // Move from archivedProducts → products
//         state.archivedProducts = state.archivedProducts.filter(
//           (p) => p._id !== restored._id
//         );
//         state.products = [restored, ...state.products];
//       })
//       .addCase(restoreProduct.rejected, (state, action) => {
//         state.actionLoading = false;
//         state.actionError = action.payload;
//       });

//     // ── toggleFeaturedProduct ─────────────────────────────────
//     builder
//       .addCase(toggleFeaturedProduct.fulfilled, (state, action) => {
//         const updated = action.payload.product || action.payload;
//         state.products = state.products.map((p) =>
//           p._id === updated._id ? updated : p
//         );
//       });

//     // ── changeProductStatus ───────────────────────────────────
//     builder
//       .addCase(changeProductStatus.fulfilled, (state, action) => {
//         const updated = action.payload.product || action.payload;
//         state.products = state.products.map((p) =>
//           p._id === updated._id ? updated : p
//         );
//       });
//   },
// });

// export const { resetCreateSuccess, resetUpdateSuccess, clearErrors } =
//   adminProductsSlice.actions;

// export default adminProductsSlice.reducer;