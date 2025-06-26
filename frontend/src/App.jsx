// frontend/src/App.jsx
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import your pages and components
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Header from "./components/Header";
import Register from "./pages/Register";
import StudentHomePage from "./pages/StudentHomePage";
import TeacherHomePage from "./pages/TeacherHomePage";
import TeacherQuizzesPage from "./pages/TeacherQuizzesPage";
import QuizReportPage from "./pages/QuizReportPage";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// New imports for student quiz features
import StudentQuizInventoryPage from "./pages/StudentQuizInventoryPage";
import StudentTakeQuizPage from "./pages/StudentTakeQuizPage";

// App component now acts as the root for AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// New component to encapsulate routes and consume AuthContext
const AppContent = () => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const getInitialRedirectPath = () => {
    if (isLoggedIn && user) {
      if (user.role === "student") {
        return "/student/home";
      } else if (user.role === "teacher") {
        return "/teacher/home";
      }
      return "/dashboard";
    }
    return "/";
  };

  return (
    <>
      <Header />
      <main>
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
          {/* Teacher Routes */}
          <Route
            path="/teacher/home"
            element={
              <PrivateRoute requiredRole="teacher">
                <TeacherHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/quizzes"
            element={
              <PrivateRoute requiredRole="teacher">
                <TeacherQuizzesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/quizzes/:quizId/report"
            element={
              <PrivateRoute requiredRole="teacher">
                <QuizReportPage />
              </PrivateRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/home"
            element={
              <PrivateRoute requiredRole="student">
                <StudentHomePage />
              </PrivateRoute>
            }
          />
          {/* New Student Quiz Inventory Page */}
          <Route
            path="/student/quizzes/inventory"
            element={
              <PrivateRoute requiredRole="student">
                <StudentQuizInventoryPage />
              </PrivateRoute>
            }
          />
          {/* New Student Take Quiz Page */}
          <Route
            path="/student/take-quiz/:quizCode" // Dynamic segment for quiz code
            element={
              <PrivateRoute requiredRole="student">
                <StudentTakeQuizPage />
              </PrivateRoute>
            }
          />
          {/* Student Quiz Report Page (Using existing QuizReportPage but for student attempts) */}
          <Route
            path="/student/quizzes/report/:attemptId" // Dynamic segment for quiz attempt ID
            element={
              <PrivateRoute requiredRole="student">
                <QuizReportPage />
              </PrivateRoute>
            }
          />

          {/* Fallback route for any undefined paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default App;
