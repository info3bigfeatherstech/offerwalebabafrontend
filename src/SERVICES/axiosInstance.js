import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL || "https://offerwalebaba.onrender.com/api",
  // baseURL: import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8081/api",
  timeout: 15000,
  withCredentials: true, // ✅ IMPORTANT: sends cookies (refreshToken) with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request Interceptor — attach accessToken automatically
axiosInstance.interceptors.request.use(
  (config) => {
    // Dynamically import store to avoid circular dependency
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — auto-refresh accessToken on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh") &&
      !originalRequest.url.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosInstance.post("/auth/refresh");
        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        // Optional: dispatch logout or redirect to login
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


// import axios from "axios";

// // Create axios instance
// const axiosInstance = axios.create({
//  baseURL: import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000/api",
//   timeout: 15000,
//   headers: {
//     "Content-Type": "application/json",
// },

// });
// console.log(import.meta.env.VITE_BACKEND_BASE_URL);
// export default axiosInstance;