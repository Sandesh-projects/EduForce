import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify"; // For notifications

/**
 * PrivateRoute component to protect routes based on user authentication and role.
 * It ensures only authorized users can access specific parts of the application.
 *
 * @param {object} props - Component properties.
 * @param {'student' | 'teacher' | Array<'student' | 'teacher'>} [props.requiredRole] - The role(s) needed to access.
 * @param {React.ReactNode} props.children - The content to render if authorized.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth();

  // Show a loading spinner while authentication status is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-dotted rounded-full animate-spin"></div>
        <p className="ml-3">Loading user data...</p>
      </div>
    );
  }

  // 1. If the user is not logged in, redirect to the login page
  if (!isLoggedIn) {
    toast.error("Please log in to access this page.", { autoClose: 2000 });
    return <Navigate to="/login" replace />;
  }

  // 2. If a specific role is required, check user's role
  if (requiredRole) {
    // Ensure requiredRole is always an array for consistent checking
    const rolesToCheck = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    // If user data or role is missing, or user's role isn't allowed
    if (!user || !user.role || !rolesToCheck.includes(user.role)) {
      let message = "Access Denied! ";
      if (user?.role) {
        message += `Your role (${user.role}) is not authorized for this page.`;
      } else {
        message += `You need '${rolesToCheck.join(
          " or "
        )}' role to access this page.`;
      }
      toast.error(message, { autoClose: 3000 });

      // Redirect based on user's current (unauthorized) role or a general path
      if (user?.role === "student") {
        return <Navigate to="/student/home" replace />;
      } else if (user?.role === "teacher") {
        return <Navigate to="/teacher/home" replace />;
      } else {
        return <Navigate to="/" replace />; // Fallback for unknown roles
      }
    }
  }

  // If all checks pass (logged in and authorized role), render the protected content
  return children ? children : <Outlet />;
};

export default PrivateRoute;
