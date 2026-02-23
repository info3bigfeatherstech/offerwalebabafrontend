import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../REDUX_SLICES/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
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