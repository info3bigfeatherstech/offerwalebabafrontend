import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../REDUX_SLICES/authSlice";
import adminProductCreateReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminProductCreateSlice";
import adminGetProductsReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminGetProductsSlice";
import adminArchivedReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminArchivedSlice"
import adminEditProductReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminEditProductSlice";
import categoriesReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/categoriesSlice";
import adminBulkUploadReducer from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/bulkUploadSlice";
import { userAnalyticsApi } from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/userAnalyticsApi";
import { adminAuthApi } from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminAuthApi";
import { seoAnalyticsApi, seoUiReducer } from "../../ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminSeoAnalytics";

// USER REDUCER 
import userProductsReducer from "../REDUX_SLICES/userProductsSlice";
import userCategoriesReducer from "../REDUX_SLICES/userCategoriesSlice";
import userWishlistReducer from '../REDUX_SLICES/userWishlistSlice';
import userCartReducer from '../REDUX_SLICES/userCartSlice'; 
import userAddressReducer from '../REDUX_SLICES/Useraddressslice';
import { searchApi } from '../REDUX_SLICES/searchApi';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminProductCreate: adminProductCreateReducer,
    adminGetProducts: adminGetProductsReducer,
    adminEditProduct: adminEditProductReducer,
    adminArchived: adminArchivedReducer,
    categories: categoriesReducer,
    adminBulkUpload: adminBulkUploadReducer,
    [adminAuthApi.reducerPath]: adminAuthApi.reducer,
    [userAnalyticsApi.reducerPath]: userAnalyticsApi.reducer,
   [seoAnalyticsApi.reducerPath]: seoAnalyticsApi.reducer,
    seoUi: seoUiReducer,



    // USER REDUCER 
    userProducts: userProductsReducer,
    userCategories: userCategoriesReducer,
    userWishlist: userWishlistReducer,
    userCart: userCartReducer,
    userAddress: userAddressReducer,
    [searchApi.reducerPath]: searchApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
   getDefaultMiddleware().concat(searchApi.middleware,userAnalyticsApi.middleware,adminAuthApi.middleware,seoAnalyticsApi.middleware),
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