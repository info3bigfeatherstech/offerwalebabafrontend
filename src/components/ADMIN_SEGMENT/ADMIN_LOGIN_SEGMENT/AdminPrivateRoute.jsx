import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useGetAdminMeQuery } from "../ADMIN_REDUX_MANAGEMENT/adminAuthApi";
import { ROLES } from "../roles";

const ADMIN_ROLES = Object.values(ROLES);

const AdminPrivateRoute = ({ children }) => {
  const hasToken = !!localStorage.getItem("accessToken");
  
  // RTK Query hook - automatically caches and manages state
  const { 
    data: user, 
    isLoading, 
    isError, 
    error 
  } = useGetAdminMeQuery(undefined, {
    skip: !hasToken, // Don't fetch if no token
  });

  // Still loading - show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No token at all
  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Token exists but API call failed (expired/invalid)
  if (isError) {
    // Clear invalid token
    localStorage.removeItem("accessToken");
    return <Navigate to="/admin/login" replace />;
  }

  // User fetched but role is wrong
  if (user && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  // No user data after fetch (shouldn't happen, but safe check)
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // All good - render protected content
  return children;
};

export default AdminPrivateRoute;