// ADMIN_REDUX_MANAGEMENT/adminBulkUploadSlice.js
//
// Handles bulk product import via CSV
// Endpoint: POST /admin/products/import-csv
// Multer expects field name: "file" (CSV)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// THUNK — uploads CSV file and tracks progress via onUploadProgress
// ─────────────────────────────────────────────────────────────────────────────
export const importProductsCSV = createAsyncThunk(
  "adminBulkUpload/importCSV",
  async ({ file, onProgress }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("file", file);

      const response = await axiosInstance.post(
        "/admin/products/import-csv",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const pct = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              onProgress(pct);
            }
          },
        }
      );

      if (response.data.success) return response.data;
      return rejectWithValue(response.data.message || "Import failed");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────
const adminBulkUploadSlice = createSlice({
  name: "adminBulkUpload",
  initialState: {
    uploading:  false,
    uploadPct:  0,       // 0–100 file upload progress
    processing: false,   // true while backend processes rows after upload hits 100%
    result:     null,    // { totalRows, insertedProducts, failedCount, failed[] }
    error:      null,
  },
  reducers: {
    setUploadPct: (state, { payload }) => {
      state.uploadPct  = payload;
      state.processing = payload === 100;
    },
    resetBulkUpload: (state) => {
      state.uploading  = false;
      state.uploadPct  = 0;
      state.processing = false;
      state.result     = null;
      state.error      = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(importProductsCSV.pending, (state) => {
        state.uploading  = true;
        state.uploadPct  = 0;
        state.processing = false;
        state.result     = null;
        state.error      = null;
      })
      .addCase(importProductsCSV.fulfilled, (state, { payload }) => {
        state.uploading  = false;
        state.uploadPct  = 100;
        state.processing = false;
        state.result     = payload;
      })
      .addCase(importProductsCSV.rejected, (state, { payload }) => {
        state.uploading  = false;
        state.processing = false;
        state.error      = payload;
      });
  },
});

export const { setUploadPct, resetBulkUpload } = adminBulkUploadSlice.actions;
export default adminBulkUploadSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// // Initial state - remove file object from state
// const initialState = {
//   uploadProgress: 0,
//   uploadStatus: 'idle', // 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
//   uploadResult: null,
//   previewData: [],
//   previewLoading: false,
//   previewError: null,
//   uploadError: null,
//   // Store file metadata instead of the actual File object
//   currentFile: {
//     name: null,
//     size: null,
//     type: null,
//   },
//   validationErrors: [],
// };

// // Async thunk for previewing CSV data
// export const previewBulkUpload = createAsyncThunk(
//   'bulkUpload/preview',
//   async (file, { rejectWithValue }) => {
//     const formData = new FormData();
//     formData.append('csvFile', file);

//     try {
//       const response = await axios.post('/api/admin/products/preview-csv', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Preview failed');
//     }
//   }
// );

// // Async thunk for bulk upload
// export const uploadBulkProducts = createAsyncThunk(
//   'bulkUpload/upload',
//   async (file, { rejectWithValue, dispatch }) => {
//     const formData = new FormData();
//     formData.append('csvFile', file);

//     try {
//       const response = await axios.post('/api/admin/products/import-csv', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           dispatch(setUploadProgress(percentCompleted));
//         },
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Upload failed');
//     }
//   }
// );

// const bulkUploadSlice = createSlice({
//   name: 'bulkUpload',
//   initialState,
//   reducers: {
//     setUploadProgress: (state, action) => {
//       state.uploadProgress = action.payload;
//     },
//     resetUpload: (state) => {
//       state.uploadProgress = 0;
//       state.uploadStatus = 'idle';
//       state.uploadResult = null;
//       state.uploadError = null;
//       state.currentFile = {
//         name: null,
//         size: null,
//         type: null,
//       };
//       state.previewData = [];
//       state.validationErrors = [];
//     },
//     setCurrentFile: (state, action) => {
//       // Store only serializable file metadata
//       const file = action.payload;
//       state.currentFile = {
//         name: file?.name || null,
//         size: file?.size || null,
//         type: file?.type || null,
//       };
//     },
//     clearPreview: (state) => {
//       state.previewData = [];
//       state.previewError = null;
//       state.validationErrors = [];
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Preview cases
//       .addCase(previewBulkUpload.pending, (state) => {
//         state.previewLoading = true;
//         state.previewError = null;
//         state.validationErrors = [];
//       })
//       .addCase(previewBulkUpload.fulfilled, (state, action) => {
//         state.previewLoading = false;
//         state.previewData = action.payload.preview || [];
//         state.validationErrors = action.payload.errors || [];
//       })
//       .addCase(previewBulkUpload.rejected, (state, action) => {
//         state.previewLoading = false;
//         state.previewError = action.payload;
//       })
      
//       // Upload cases
//       .addCase(uploadBulkProducts.pending, (state) => {
//         state.uploadStatus = 'uploading';
//         state.uploadError = null;
//         state.uploadProgress = 0;
//       })
//       .addCase(uploadBulkProducts.fulfilled, (state, action) => {
//         state.uploadStatus = 'completed';
//         state.uploadResult = action.payload;
//         state.uploadProgress = 100;
//       })
//       .addCase(uploadBulkProducts.rejected, (state, action) => {
//         state.uploadStatus = 'failed';
//         state.uploadError = action.payload;
//         state.uploadProgress = 0;
//       });
//   },
// });

// export const { setUploadProgress, resetUpload, setCurrentFile, clearPreview } = bulkUploadSlice.actions;
// export default bulkUploadSlice.reducer;