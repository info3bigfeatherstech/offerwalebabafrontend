
// ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminProductCreateSlice.js
//
// VARIANTS ASSEMBLY:
//   top form fields (barcode, price, inventory, images) → variants[0]
//   "Add Variant" cards (formData.variants[])           → variants[1], [2]...
//
// FormData to backend:
//   variants        → JSON of all variants
//   variantImages_0 → files for variants[0]  (product gallery)
//   variantImages_N → files for variants[N]
//   images          → product-level images

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance";

// CRITICAL: backend checks if (!price.base) — rejects 0, undefined, missing key
const toNum = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return undefined;
  const n = parseFloat(raw);
  return isNaN(n) ? undefined : n;
};

// Throws if base price is missing/invalid — prevents silent backend rejection
const buildPriceObj = (price, label = "Base price") => {
  const base = toNum(price?.base);
  if (!base && base !== 0) throw new Error(`${label} is required`);
  if (base <= 0)           throw new Error(`${label} must be greater than 0`);
  const saleRaw = toNum(price?.sale);
  const sale    = (price?.sale !== "" && price?.sale != null && saleRaw !== undefined) ? saleRaw : null;
  
  // Build price object with optional wholesale fields
  const priceObj = { base, sale };
  
  // Add wholesale prices if they exist
  if (price?.wholesaleBase !== undefined && price?.wholesaleBase !== "") {
    priceObj.wholesaleBase = toNum(price.wholesaleBase) || 0;
  }
  if (price?.wholesaleSale !== undefined && price?.wholesaleSale !== "") {
    priceObj.wholesaleSale = toNum(price.wholesaleSale) || null;
  }
  
  return priceObj;
};

const buildInventoryObj = (inv) => ({
  quantity:          parseInt(inv?.quantity)          || 0,
  lowStockThreshold: parseInt(inv?.lowStockThreshold) || 5,
  trackInventory:    inv?.trackInventory !== false,
});

export const createProduct = createAsyncThunk(
  "adminProductCreate/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const fd = new FormData();

      if (productData.name)        fd.append("name",        productData.name);
      if (productData.title)       fd.append("title",       productData.title);
      if (productData.description) fd.append("description", productData.description);
      if (productData.category)    fd.append("category",    productData.category);
      if (productData.brand)       fd.append("brand",       productData.brand);
      if (productData.status)      fd.append("status",      productData.status);
      if (productData.isFeatured !== undefined) fd.append("isFeatured", String(productData.isFeatured));


       // Send hsnCode, taxRate, isFragile at ROOT level
      if (productData.hsnCode) fd.append("hsnCode", productData.hsnCode);
      if (productData.taxRate !== undefined && productData.taxRate !== "") {
        fd.append("taxRate", String(productData.taxRate));
      }
      if (productData.isFragile !== undefined) {
        fd.append("isFragile", String(productData.isFragile));
      }
      // DontInclude hsnCode, taxRate, isFragile in shipping
      const shippingData = {
        ...productData.shipping,
        weight: productData.shipping?.weight || 0,
        dimensions: productData.shipping?.dimensions || { length: 0, width: 0, height: 0 },
      };
      fd.append("shipping", JSON.stringify(shippingData));
      
      fd.append("soldInfo", JSON.stringify(productData.soldInfo  || { enabled: false, count: 0 }));
      fd.append("fomo",     JSON.stringify(productData.fomo      || { enabled: false }));
      if (productData.attributes?.length)
        fd.append("attributes", JSON.stringify(productData.attributes));

      // Product-level gallery → also becomes variantImages_0
      const productImageFiles = (productData.images || []).filter((img) => img.file instanceof File);
      productImageFiles.forEach((img) => fd.append("images", img.file));

      // Build all variants array — validate price before sending
      let primaryPrice;
      try {
        // Prepare price object with wholesale fields if enabled
        const priceData = {
          base: productData.price?.base,
          sale: productData.price?.sale
        };
        
        if (productData.wholesale) {
          priceData.wholesaleBase = productData.wholesaleBase;
          priceData.wholesaleSale = productData.wholesaleSale;
        }
        
        primaryPrice = buildPriceObj(priceData, "Main variant base price");
      } catch (priceErr) {
        return rejectWithValue(priceErr.message);
      }

      const extraVariants = [];
      for (let i = 0; i < (productData.variants || []).length; i++) {
        const v = productData.variants[i];
        let vPrice;
        try {
          // Prepare variant price object with wholesale fields if enabled
          const variantPriceData = {
            base: v.price?.base,
            sale: v.price?.sale
          };
          
          if (v.wholesale) {
            variantPriceData.wholesaleBase = v.wholesaleBase;
            variantPriceData.wholesaleSale = v.wholesaleSale;
          }
          
          vPrice = buildPriceObj(variantPriceData, `Variant ${i + 1} base price`);
        } catch (priceErr) {
          return rejectWithValue(priceErr.message);
        }
        
        extraVariants.push({
          barcode:    Number(v.barcode) || 0,
          attributes: (v.attributes || []).filter((a) => a.key && a.value),
          price:      vPrice,
          inventory:  buildInventoryObj(v.inventory),
          isActive:   v.isActive !== false,
          wholesale:  v.wholesale || false,
          minimumOrderQuantity: v.wholesale ? (parseInt(v.minimumOrderQuantity) || 1) : 1
        });
      }

      const primaryVariant = {
        barcode:    Number(productData.barcode) || 0,
        attributes: [],
        price:      primaryPrice,
        inventory:  buildInventoryObj(productData.inventory),
        isActive:   true,
        wholesale:  productData.wholesale || false,
        minimumOrderQuantity: productData.wholesale ? (parseInt(productData.minimumOrderQuantity) || 1) : 1
      };

      fd.append("variants", JSON.stringify([primaryVariant, ...extraVariants]));

      // Variant images
      productImageFiles.forEach((img) => fd.append("variantImages_0", img.file));
      (productData.variants || []).forEach((variant, vIdx) => {
        const realIndex = vIdx + 1;
        (variant.images || []).forEach((img) => {
          if (img?.file instanceof File) fd.append(`variantImages_${realIndex}`, img.file);
        });
      });

      const response = await axiosInstance.post("/admin/products", fd, {
        headers:          { "Content-Type": "multipart/form-data" },
        timeout:          60000,
        maxContentLength: Infinity,
        maxBodyLength:    Infinity,
      });

      if (response.data.success) return response.data.product;
      return rejectWithValue(response.data.message || "Failed to create product");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create product"
      );
    }
  }
);

const adminProductCreateSlice = createSlice({
  name: "adminProductCreate",
  initialState: {
    loading:        false,
    error:          null,
    success:        false,
    createdProduct: null,
  },
  reducers: {
    resetCreateSuccess: (state) => { state.success = false; state.createdProduct = null; },
    resetCreateError:   (state) => { state.error   = null; },
    resetCreateState:   ()      => ({ loading: false, error: null, success: false, createdProduct: null }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProduct.pending,   (state) => {
        state.loading = true; state.error = null; state.success = false; state.createdProduct = null;
      })
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.loading = false; state.success = true; state.createdProduct = payload;
      })
      .addCase(createProduct.rejected,  (state, { payload }) => {
        state.loading = false; state.error = payload || "Failed to create product";
      });
  },
});

export const { resetCreateSuccess, resetCreateError, resetCreateState } = adminProductCreateSlice.actions;
export default adminProductCreateSlice.reducer;

// code is working but upper code handle new fields 
// // ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminProductCreateSlice.js
// //
// // VARIANTS ASSEMBLY:
// //   top form fields (barcode, price, inventory, images) → variants[0]
// //   "Add Variant" cards (formData.variants[])           → variants[1], [2]...
// //
// // FormData to backend:
// //   variants        → JSON of all variants
// //   variantImages_0 → files for variants[0]  (product gallery)
// //   variantImages_N → files for variants[N]
// //   images          → product-level images

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../../../SERVICES/axiosInstance";

// // CRITICAL: backend checks if (!price.base) — rejects 0, undefined, missing key
// const toNum = (raw) => {
//   if (raw === "" || raw === null || raw === undefined) return undefined;
//   const n = parseFloat(raw);
//   return isNaN(n) ? undefined : n;
// };

// // Throws if base price is missing/invalid — prevents silent backend rejection
// const buildPriceObj = (price, label = "Base price") => {
//   const base = toNum(price?.base);
//   if (!base && base !== 0) throw new Error(`${label} is required`);
//   if (base <= 0)           throw new Error(`${label} must be greater than 0`);
//   const saleRaw = toNum(price?.sale);
//   const sale    = (price?.sale !== "" && price?.sale != null && saleRaw !== undefined) ? saleRaw : null;
//   return { base, sale };
// };

// const buildInventoryObj = (inv) => ({
//   quantity:          parseInt(inv?.quantity)          || 0,
//   lowStockThreshold: parseInt(inv?.lowStockThreshold) || 5,
//   trackInventory:    inv?.trackInventory !== false,
// });

// export const createProduct = createAsyncThunk(
//   "adminProductCreate/createProduct",
//   async (productData, { rejectWithValue }) => {
//     try {
//       const fd = new FormData();

//       if (productData.name)        fd.append("name",        productData.name);
//       if (productData.title)       fd.append("title",       productData.title);
//       if (productData.description) fd.append("description", productData.description);
//       if (productData.category)    fd.append("category",    productData.category);
//       if (productData.brand)       fd.append("brand",       productData.brand);
//       if (productData.status)      fd.append("status",      productData.status);
//       if (productData.isFeatured !== undefined) fd.append("isFeatured", String(productData.isFeatured));

//       fd.append("shipping", JSON.stringify(productData.shipping  || {}));
//       fd.append("soldInfo", JSON.stringify(productData.soldInfo  || { enabled: false, count: 0 }));
//       fd.append("fomo",     JSON.stringify(productData.fomo      || { enabled: false }));
//       if (productData.attributes?.length)
//         fd.append("attributes", JSON.stringify(productData.attributes));

//       // Product-level gallery → also becomes variantImages_0
//       const productImageFiles = (productData.images || []).filter((img) => img.file instanceof File);
//       productImageFiles.forEach((img) => fd.append("images", img.file));

//       // Build all variants array — validate price before sending
//       let primaryPrice;
//       try {
//         primaryPrice = buildPriceObj(productData.price, "Main variant base price");
//       } catch (priceErr) {
//         return rejectWithValue(priceErr.message);
//       }

//       const extraVariants = [];
//       for (let i = 0; i < (productData.variants || []).length; i++) {
//         const v = productData.variants[i];
//         let vPrice;
//         try {
//           vPrice = buildPriceObj(v.price, `Variant ${i + 1} base price`);
//         } catch (priceErr) {
//           return rejectWithValue(priceErr.message);
//         }
//         extraVariants.push({
//           barcode:    Number(v.barcode) || 0,
//           attributes: (v.attributes || []).filter((a) => a.key && a.value),
//           price:      vPrice,
//           inventory:  buildInventoryObj(v.inventory),
//           isActive:   v.isActive !== false,
//         });
//       }

//       const primaryVariant = {
//         barcode:    Number(productData.barcode) || 0,
//         attributes: [],
//         price:      primaryPrice,
//         inventory:  buildInventoryObj(productData.inventory),
//         isActive:   true,
//       };

//       fd.append("variants", JSON.stringify([primaryVariant, ...extraVariants]));

//       // Variant images
//       productImageFiles.forEach((img) => fd.append("variantImages_0", img.file));
//       (productData.variants || []).forEach((variant, vIdx) => {
//         const realIndex = vIdx + 1;
//         (variant.images || []).forEach((img) => {
//           if (img?.file instanceof File) fd.append(`variantImages_${realIndex}`, img.file);
//         });
//       });

//       const response = await axiosInstance.post("/admin/products", fd, {
//         headers:          { "Content-Type": "multipart/form-data" },
//         timeout:          60000,
//         maxContentLength: Infinity,
//         maxBodyLength:    Infinity,
//       });

//       if (response.data.success) return response.data.product;
//       return rejectWithValue(response.data.message || "Failed to create product");
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || error.message || "Failed to create product"
//       );
//     }
//   }
// );

// const adminProductCreateSlice = createSlice({
//   name: "adminProductCreate",
//   initialState: {
//     loading:        false,
//     error:          null,
//     success:        false,
//     createdProduct: null,
//   },
//   reducers: {
//     resetCreateSuccess: (state) => { state.success = false; state.createdProduct = null; },
//     resetCreateError:   (state) => { state.error   = null; },
//     resetCreateState:   ()      => ({ loading: false, error: null, success: false, createdProduct: null }),
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(createProduct.pending,   (state) => {
//         state.loading = true; state.error = null; state.success = false; state.createdProduct = null;
//       })
//       .addCase(createProduct.fulfilled, (state, { payload }) => {
//         state.loading = false; state.success = true; state.createdProduct = payload;
//       })
//       .addCase(createProduct.rejected,  (state, { payload }) => {
//         state.loading = false; state.error = payload || "Failed to create product";
//       });
//   },
// });

// export const { resetCreateSuccess, resetCreateError, resetCreateState } = adminProductCreateSlice.actions;
// export default adminProductCreateSlice.reducer;