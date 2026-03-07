// ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance";
import {
  toggleFeaturedProduct,
  changeProductStatus,
  softDeleteProduct,
} from "./adminEditProductSlice";

export const fetchProducts = createAsyncThunk(
  "adminGetProducts/fetchProducts",
  async ({ page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/admin/products/all", {
        params: { page, limit },
      });
      if (response.data.success) return response.data.products;
      return rejectWithValue(response.data.message || "Failed to fetch products");
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const adminGetProductsSlice = createSlice({
  name: "adminGetProducts",
  initialState: {
    products: [],
    loading:  false,
    error:    null,
  },
  reducers: {
    // Optimistic in-place update — called BEFORE API for zero-latency UI
    optimisticUpdateProduct: (state, { payload }) => {
      const idx = state.products.findIndex((p) => p._id === payload._id);
      if (idx !== -1) state.products[idx] = { ...state.products[idx], ...payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => { state.loading = false; state.products = payload; })
      .addCase(fetchProducts.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })

      // Cross-slice: when toggle/status API succeeds, update product in list immediately
      .addCase(toggleFeaturedProduct.fulfilled, (state, { payload }) => {
        if (!payload?.product) return;
        const idx = state.products.findIndex((p) => p._id === payload.product._id);
        if (idx !== -1) state.products[idx] = { ...state.products[idx], ...payload.product };
      })
      .addCase(changeProductStatus.fulfilled, (state, { payload }) => {
        if (!payload?.product) return;
        const idx = state.products.findIndex((p) => p._id === payload.product._id);
        if (idx !== -1) state.products[idx] = { ...state.products[idx], ...payload.product };
      })
      .addCase(softDeleteProduct.fulfilled, (state, { payload }) => {
        if (!payload?.slug) return;
        state.products = state.products.filter((p) => p.slug !== payload.slug);
      });
  },
});

export const { optimisticUpdateProduct } = adminGetProductsSlice.actions;
export default adminGetProductsSlice.reducer;