import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../SERVICES/axiosInstance";

// ─────────────────────────────────────────────────────────────
// THUNKS
// ─────────────────────────────────────────────────────────────

// ✅ REGISTER — sends OTP to email
export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password, phone }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      return res.data; // { success, message: "Verification OTP sent to email" }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Registration failed" }
      );
    }
  }
);

// ✅ VERIFY OTP — after register, logs user in
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/otp-verify-login", {
        email,
        otp,
      });
      // Save access token to localStorage for persistence
      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      return res.data; // { success, accessToken, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "OTP verification failed" }
      );
    }
  }
);

// ✅ LOGIN
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      return res.data; // { success, accessToken, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Login failed" }
      );
    }
  }
);

// ✅ GOOGLE LOGIN
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ idToken }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/google", { idToken });
      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      return res.data; // { success, accessToken, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Google login failed" }
      );
    }
  }
);

// ✅ LOGOUT
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("accessToken");
      return true;
    } catch (err) {
      // Even if API fails, clear local state
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        err.response?.data || { message: "Logout failed" }
      );
    }
  }
);

// ✅ FORGOT PASSWORD — sends OTP
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      return res.data; // { success, message }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to send OTP" }
      );
    }
  }
);

// ✅ RESET PASSWORD — with OTP
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      return res.data; // { success, message }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Password reset failed" }
      );
    }
  }
);

// ✅ FETCH ME — get current user profile (protected)
export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/auth/me");
      return res.data; // { success, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch profile" }
      );
    }
  }
);

// ✅ REFRESH TOKEN — get new access token using httpOnly cookie
export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/refresh");
      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      return res.data; // { success, accessToken }
    } catch (err) {
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        err.response?.data || { message: "Session expired. Please login again." }
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  accessToken: localStorage.getItem("accessToken") || null,
  isLoggedIn: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,
  successMessage: null,
  pendingEmail: null, // holds email during register → OTP step
};

// ─────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    clearPendingEmail: (state) => {
      state.pendingEmail = null;
    },
    // Force logout (called by axiosInstance on refresh failure)
    forceLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isLoggedIn = false;
      state.error = null;
      state.successMessage = null;
      state.pendingEmail = null;
      localStorage.removeItem("accessToken");
    },
  },
  extraReducers: (builder) => {
    // ── Reusable helpers ──────────────────────────────────────
    const setPending = (state) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    };
    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Something went wrong";
    };

    builder
      // ── REGISTER ──────────────────────────────────────────
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.pendingEmail = action.meta.arg.email; // save for OTP step
      })
      .addCase(registerUser.rejected, setRejected)

      // ── VERIFY OTP ────────────────────────────────────────
      .addCase(verifyOTP.pending, setPending)
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.pendingEmail = null;
        state.successMessage = "Email verified! Welcome!";
      })
      .addCase(verifyOTP.rejected, setRejected)

      // ── LOGIN ─────────────────────────────────────────────
      .addCase(loginUser.pending, setPending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.successMessage = "Login successful!";
      })
      .addCase(loginUser.rejected, setRejected)

      // ── GOOGLE LOGIN ──────────────────────────────────────
      .addCase(googleLogin.pending, setPending)
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.successMessage = "Google login successful!";
      })
      .addCase(googleLogin.rejected, setRejected)

      // ── LOGOUT ────────────────────────────────────────────
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isLoggedIn = false;
        state.loading = false;
        state.error = null;
        state.successMessage = null;
        state.pendingEmail = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Still clear state even if API call fails
        state.user = null;
        state.accessToken = null;
        state.isLoggedIn = false;
        state.loading = false;
      })

      // ── FORGOT PASSWORD ───────────────────────────────────
      .addCase(forgotPassword.pending, setPending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.pendingEmail = action.meta.arg.email;
      })
      .addCase(forgotPassword.rejected, setRejected)

      // ── RESET PASSWORD ────────────────────────────────────
      .addCase(resetPassword.pending, setPending)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.pendingEmail = null;
      })
      .addCase(resetPassword.rejected, setRejected)

      // ── FETCH ME ──────────────────────────────────────────
      .addCase(fetchMe.pending, setPending)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isLoggedIn = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Don't show error for silent me fetch
        state.loading = false;
      })

      // ── REFRESH TOKEN ─────────────────────────────────────
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isLoggedIn = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isLoggedIn = false;
      });
  },
});

export const { clearError, clearSuccess, clearPendingEmail, forceLogout } =
  authSlice.actions;

export default authSlice.reducer;