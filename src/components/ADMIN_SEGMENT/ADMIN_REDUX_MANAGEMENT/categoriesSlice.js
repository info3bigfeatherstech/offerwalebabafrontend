// ADMIN_REDUX_MANAGEMENT/categoriesSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path

// ─────────────────────────────────────────────────────────────
//  ASYNC THUNKS
// ─────────────────────────────────────────────────────────────

// 1. Fetch all categories (public endpoint)
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/categories/categories");
      // backend returns { success, categories } or array directly
      return res.data.categories || res.data.data || res.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// 2. Create category (admin) — supports optional image upload
export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData, { rejectWithValue }) => {
    try {
      // categoryData = { name, description?, parent?, status?, showInMenu?, imageFile? }
      const fd = new FormData();
      fd.append("name", categoryData.name);
      if (categoryData.description) fd.append("description", categoryData.description);
      if (categoryData.parent) fd.append("parent", categoryData.parent);
      if (categoryData.status) fd.append("status", categoryData.status);
      if (categoryData.showInMenu !== undefined)
        fd.append("showInMenu", categoryData.showInMenu.toString());
      if (categoryData.imageFile instanceof File)
        fd.append("image", categoryData.imageFile);

      const res = await axiosInstance.post("/categories/admin/categories", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.category || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create category"
      );
    }
  }
);

// 3. Update category (admin)
export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      if (categoryData.name) fd.append("name", categoryData.name);
      if (categoryData.description !== undefined)
        fd.append("description", categoryData.description);
      if (categoryData.status) fd.append("status", categoryData.status);
      if (categoryData.imageFile instanceof File)
        fd.append("image", categoryData.imageFile);

      const res = await axiosInstance.put(`/categories/admin/categories/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.category || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update category"
      );
    }
  }
);

// 4. Delete category (admin) — soft delete
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/categories/admin/categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────
//  SLICE
// ─────────────────────────────────────────────────────────────
const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    loading: false,
    loaded: false,
    error: null,

    createLoading: false,
    createError: null,

    updateLoading: false,
    updateError: null,

    deleteLoading: false,
    deleteError: null,
  },
  reducers: {
    clearCategoryErrors(state) {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchCategories ───────────────────────────────────────
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── createCategory ────────────────────────────────────────
    builder
      .addCase(createCategory.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.createLoading = false;
        state.categories = [...state.categories, action.payload];
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // ── updateCategory ────────────────────────────────────────
    builder
      .addCase(updateCategory.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updated = action.payload;
        state.categories = state.categories.map((c) =>
          c._id === updated._id ? updated : c
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });

    // ── deleteCategory ────────────────────────────────────────
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Soft delete — set status inactive or remove from list
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  },
});

export const { clearCategoryErrors } = categoriesSlice.actions;
export default categoriesSlice.reducer;

// // ADMIN_REDUX_MANAGEMENT/categoriesSlice.js

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../../../SERVICES/axiosInstance"; // adjust path

// // ─────────────────────────────────────────────────────────────
// //  ASYNC THUNKS
// // ─────────────────────────────────────────────────────────────

// // 1. Fetch all categories (public endpoint)
// export const fetchCategories = createAsyncThunk(
//   "categories/fetchAll",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.get("/categories/categories");
//       // backend returns { success, categories } or array directly
//       return res.data.categories || res.data.data || res.data || [];
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to fetch categories"
//       );
//     }
//   }
// );

// // 2. Create category (admin) — supports optional image upload
// export const createCategory = createAsyncThunk(
//   "categories/create",
//   async (categoryData, { rejectWithValue }) => {
//     try {
//       // categoryData = { name, description?, parent?, status?, showInMenu?, imageFile? }
//       const fd = new FormData();
//       fd.append("name", categoryData.name);
//       if (categoryData.description) fd.append("description", categoryData.description);
//       if (categoryData.parent) fd.append("parent", categoryData.parent);
//       if (categoryData.status) fd.append("status", categoryData.status);
//       if (categoryData.showInMenu !== undefined)
//         fd.append("showInMenu", categoryData.showInMenu.toString());
//       if (categoryData.imageFile instanceof File)
//         fd.append("image", categoryData.imageFile);

//       const res = await axiosInstance.post("/categories/admin/categories", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data.category || res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to create category"
//       );
//     }
//   }
// );

// // 3. Update category (admin)
// export const updateCategory = createAsyncThunk(
//   "categories/update",
//   async ({ id, categoryData }, { rejectWithValue }) => {
//     try {
//       const fd = new FormData();
//       if (categoryData.name) fd.append("name", categoryData.name);
//       if (categoryData.description !== undefined)
//         fd.append("description", categoryData.description);
//       if (categoryData.status) fd.append("status", categoryData.status);
//       if (categoryData.imageFile instanceof File)
//         fd.append("image", categoryData.imageFile);

//       const res = await axiosInstance.put(`/categories/admin/categories/${id}`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data.category || res.data;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to update category"
//       );
//     }
//   }
// );

// // 4. Delete category (admin) — soft delete
// export const deleteCategory = createAsyncThunk(
//   "categories/delete",
//   async (id, { rejectWithValue }) => {
//     try {
//       await axiosInstance.delete(`/categories/admin/categories/${id}`);
//       return id;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to delete category"
//       );
//     }
//   }
// );

// // ─────────────────────────────────────────────────────────────
// //  SLICE
// // ─────────────────────────────────────────────────────────────
// const categoriesSlice = createSlice({
//   name: "categories",
//   initialState: {
//     categories: [],
//     loading: false,
//     loaded: false,
//     error: null,

//     createLoading: false,
//     createError: null,

//     updateLoading: false,
//     updateError: null,

//     deleteLoading: false,
//     deleteError: null,
//   },
//   reducers: {
//     clearCategoryErrors(state) {
//       state.error = null;
//       state.createError = null;
//       state.updateError = null;
//       state.deleteError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     // ── fetchCategories ───────────────────────────────────────
//     builder
//       .addCase(fetchCategories.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCategories.fulfilled, (state, action) => {
//         state.loading = false;
//         state.loaded = true;
//         state.categories = action.payload;
//       })
//       .addCase(fetchCategories.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     // ── createCategory ────────────────────────────────────────
//     builder
//       .addCase(createCategory.pending, (state) => {
//         state.createLoading = true;
//         state.createError = null;
//       })
//       .addCase(createCategory.fulfilled, (state, action) => {
//         state.createLoading = false;
//         state.categories = [...state.categories, action.payload];
//       })
//       .addCase(createCategory.rejected, (state, action) => {
//         state.createLoading = false;
//         state.createError = action.payload;
//       });

//     // ── updateCategory ────────────────────────────────────────
//     builder
//       .addCase(updateCategory.pending, (state) => {
//         state.updateLoading = true;
//         state.updateError = null;
//       })
//       .addCase(updateCategory.fulfilled, (state, action) => {
//         state.updateLoading = false;
//         const updated = action.payload;
//         state.categories = state.categories.map((c) =>
//           c._id === updated._id ? updated : c
//         );
//       })
//       .addCase(updateCategory.rejected, (state, action) => {
//         state.updateLoading = false;
//         state.updateError = action.payload;
//       });

//     // ── deleteCategory ────────────────────────────────────────
//     builder
//       .addCase(deleteCategory.pending, (state) => {
//         state.deleteLoading = true;
//         state.deleteError = null;
//       })
//       .addCase(deleteCategory.fulfilled, (state, action) => {
//         state.deleteLoading = false;
//         // Soft delete — set status inactive or remove from list
//         state.categories = state.categories.filter(
//           (c) => c._id !== action.payload
//         );
//       })
//       .addCase(deleteCategory.rejected, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteError = action.payload;
//       });
//   },
// });

// export const { clearCategoryErrors } = categoriesSlice.actions;
// export default categoriesSlice.reducer;