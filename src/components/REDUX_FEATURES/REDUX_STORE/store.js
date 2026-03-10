import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../REDUX_SLICES/authSlice";
import adminProductCreateReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminProductCreateSlice"; 
import adminGetProductsReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice";
import adminArchivedReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminArchivedSlice"
import adminEditProductReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminEditProductSlice"; // NEW
import categoriesReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/categoriesSlice";
// import bulkUploadReducer from '../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/bulkUploadSlice';
import adminBulkUploadReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/bulkUploadSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
     adminProductCreate: adminProductCreateReducer,
         adminGetProducts: adminGetProductsReducer,
             adminEditProduct: adminEditProductReducer,
    adminArchived: adminArchivedReducer,
      categories: categoriesReducer,
      // bulkUpload: bulkUploadReducer,
      adminBulkUpload: adminBulkUploadReducer,
  },
  devTools: import.meta.env.MODE !== "production", // Redux DevTools only in dev
});

export default store;

// import { configureStore } from "@reduxjs/toolkit";

// const store = configureStore({
//   reducer: {
//     // Add your reducers here
//   },
// });

// export default store;