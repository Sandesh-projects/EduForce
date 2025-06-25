// src/App.jsx

import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Header from "./components/Header";
import Register from "./pages/Register";
// Assuming you have these pages, as per previous discussion
import StudentHomePage from "./pages/StudentHomePage";
import TeacherHomePage from "./pages/TeacherHomePage";
import PrivateRoute from "./components/PrivateRoute"; // Ensure this is using useAuth context
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import AuthProvider and useAuth

// App component now acts as the root for AuthProvider
function App() {
  return (
    // Wrap the entire application with AuthProvider
    <AuthProvider>
      <AppContent /> {/* Render a child component that consumes context */}
    </AuthProvider>
  );
}

// New component to encapsulate routes and consume AuthContext
const AppContent = () => {
  const { isLoggedIn, user, loading } = useAuth(); // Consume auth context

  // If still loading initial auth status, don't render routes yet
  // This ensures the correct initial route is determined after auth check
  if (loading) {
    return null; // AuthProvider itself shows a loading spinner
  }

  // Determine initial redirect path based on authenticated user's role
  const getInitialRedirectPath = () => {
    if (isLoggedIn && user) {
      if (user.role === "student") {
        return "/student-home";
      } else if (user.role === "teacher") {
        return "/teacher-home";
      }
      // Fallback if role is authenticated but not student/teacher
      return "/dashboard"; // Or wherever a general logged-in user goes
    }
    return "/"; // Default to landing page if not authenticated
  };

  return (
    <>
      <Header /> {/* Header will now consume AuthContext */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dynamic Root Route: Redirects based on login status and role */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to={getInitialRedirectPath()} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Protected Routes using PrivateRoute component */}
        <Route
          path="/student-home"
          element={
            <PrivateRoute requiredRole="student">
              <StudentHomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher-home"
          element={
            <PrivateRoute requiredRole="teacher">
              <TeacherHomePage />
            </PrivateRoute>
          }
        />

        {/* Fallback route for any undefined paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
