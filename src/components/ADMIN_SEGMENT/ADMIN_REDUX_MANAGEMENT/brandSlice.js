import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance";

const initialState = {
  brands: [],
  loading: false,
  error: null,
  apiCalls: {
    brands: false
  }
};

// GET all brands (from products)
export const fetchBrands = createAsyncThunk(
  'brands/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/admin/products');
      const products = response.data.products || [];
      const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      return uniqueBrands.sort();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch brands');
    }
  }
);

// CREATE brand (just for UI - brands are stored in products)
export const addBrand = createAsyncThunk(
  'brands/add',
  async (brandName, { rejectWithValue }) => {
    try {
      // Brands are just strings in products, so we just return the name
      return brandName;
    } catch (error) {
      return rejectWithValue('Failed to add brand');
    }
  }
);

const brandSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
        state.apiCalls.brands = true;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBrand.fulfilled, (state, action) => {
        if (!state.brands.includes(action.payload)) {
          state.brands.push(action.payload);
          state.brands.sort();
        }
      });
  }
});

export const { clearError } = brandSlice.actions;
export default brandSlice.reducer;