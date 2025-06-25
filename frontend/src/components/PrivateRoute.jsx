// src/components/PrivateRoute.jsx

import React from "react"; // Removed useEffect/useState as AuthContext handles global auth status
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth hook

const PrivateRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth(); // Get auth state and user from context

  if (loading) {
    // Show a loading spinner while AuthProvider is checking initial authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-dotted rounded-full animate-spin"></div>
        <p className="ml-3">Loading user data...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but role doesn't match the required role for this route
  // Ensure user object is not null before checking role
  if (requiredRole && (!user || user.role !== requiredRole)) {
    alert(
      `Access Denied! You need '${requiredRole}' role to access this page.`
    );
    // Redirect to a dashboard or a more general page if role mismatch
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and role matches (or no specific role is required), render children
  return children ? children : <Outlet />;
};

export default PrivateRoute;
