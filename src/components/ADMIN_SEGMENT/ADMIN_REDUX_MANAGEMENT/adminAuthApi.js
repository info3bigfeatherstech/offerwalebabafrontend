// Path: components/ADMIN_SEGMENT/ADMIN_REDUX_MANAGEMENT/adminAuthApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ROLES } from '../roles';

const ADMIN_ROLES = Object.values(ROLES);

// Helper to get token
const getToken = () => localStorage.getItem('accessToken');

export const adminAuthApi = createApi({
  reducerPath: 'adminAuthApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8081/api',
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include', // Important for cookies
  }),
  tagTypes: ['AdminUser'],
  endpoints: (builder) => ({
    // ── Get current admin user (rehydrates session) ──
    getAdminMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['AdminUser'],
      // Only run if token exists
      skip: () => !getToken(),
      transformResponse: (response) => {
        const user = response?.user;
        // Validate admin role
        if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
          throw new Error('insufficient_role');
        }
        return user;
      },
    }),

    // ── Admin login ──
    adminLogin: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response) => {
        const { accessToken, user } = response;
        
        // Role validation
        if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        
        // Store token
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        return user;
      },
      invalidatesTags: ['AdminUser'],
    }),

    // ── Admin logout ──
    adminLogout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      transformResponse: (response) => {
        // Always clear token even if API fails
        localStorage.removeItem('accessToken');
        return response;
      },
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetAdminMeQuery,
  useAdminLoginMutation,
  useAdminLogoutMutation,
} = adminAuthApi;