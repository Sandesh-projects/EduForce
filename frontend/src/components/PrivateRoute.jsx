// frontend/src/components/PrivateRoute.jsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify"; // Import toast for notifications

/**
 * @typedef {'student' | 'teacher' | Array<'student' | 'teacher'>} RequiredRole
 */

/**
 * PrivateRoute component for protecting routes based on authentication and role.
 *
 * @param {object} props - The component props.
 * @param {RequiredRole} [props.requiredRole] - The role(s) required to access the route. Can be 'student', 'teacher', or ['student', 'teacher'].
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth();

  // While authentication status is being determined, render nothing or a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-dotted rounded-full animate-spin"></div>
        <p className="ml-3">Loading user data...</p>
      </div>
    );
  }

  // 1. Check if user is logged in
  if (!isLoggedIn) {
    toast.error("Please log in to access this page.", { autoClose: 2000 });
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in, check role authorization
  if (requiredRole) {
    // Convert requiredRole to an array if it's a single string for consistent checking
    const rolesToCheck = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    // Check if the logged-in user's role is included in the allowed roles
    if (!user || !user.role || !rolesToCheck.includes(user.role)) {
      let message = "Access Denied! ";
      if (user && user.role) {
        message += `Your role (${user.role}) is not authorized for this page.`;
      } else {
        message += `You need '${rolesToCheck.join(
          " or "
        )}' role to access this page.`;
      }
      toast.error(message, { autoClose: 3000 }); // Show detailed message
      console.error(
        `Access Denied: User role ${
          user?.role
        } is not in required roles [${rolesToCheck.join(", ")}]`
      );

      // Redirect based on role or to a general unauthorized page
      if (user?.role === "student") {
        return <Navigate to="/student/home" replace />;
      } else if (user?.role === "teacher") {
        return <Navigate to="/teacher/home" replace />;
      } else {
        return <Navigate to="/" replace />; // Fallback for undefined/unexpected roles
      }
    }
  }

  // If authenticated and authorized, render the children
  return children ? children : <Outlet />;
};

export default PrivateRoute;
