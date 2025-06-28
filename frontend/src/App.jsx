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
import QuizReportPage from "./pages/QuizReportPage"; // Individual student/attempt report (generalized for teacher/student)
import TeacherQuizAttemptsPage from "./pages/TeacherQuizAttemptsPage"; // Teacher's overview of attempts for a quiz
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// New imports for student quiz features
import StudentQuizInventoryPage from "./pages/StudentQuizInventoryPage";
import StudentTakeQuizPage from "./pages/StudentTakeQuizPage";
import StudentQuizAttemptReportPage from "./pages/StudentQuizAttemptReportPage"; // Specifically for detailed student report
import ProfilePage from "./pages/ProfilePage"; // NEW: Profile Page

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
    // Return null or a simple loading spinner/indicator while auth state is being determined
    return null;
  }

  const getInitialRedirectPath = () => {
    if (isLoggedIn && user) {
      if (user.role === "student") {
        return "/student/home";
      } else if (user.role === "teacher") {
        return "/teacher/home";
      }
      // Fallback for unexpected roles, though PrivateRoute should handle this for specific paths
      return "/dashboard"; // Or another appropriate default for authenticated but unknown role
    }
    return "/"; // Default to landing page if not logged in
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
          {/* Global Profile Page (accessible by both teachers and students) */}
          <Route
            path="/profile"
            element={
              <PrivateRoute requiredRole={["student", "teacher"]}>
                <ProfilePage />
              </PrivateRoute>
            }
          />

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
          {/* Teacher Quiz Attempts Overview Page (e.g., list of students who took a specific quiz) */}
          <Route
            path="/teacher/quizzes/:quizId/report" // This route is for the TeacherQuizAttemptsPage
            element={
              <PrivateRoute requiredRole="teacher">
                <TeacherQuizAttemptsPage />
              </PrivateRoute>
            }
          />
          {/* Teacher Individual Quiz Attempt Report Page (Teacher views a specific student's attempt report) */}
          <Route
            path="/teacher/attempts/:attemptId" // This route uses the generalized QuizReportPage
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
          {/* Student Quiz Inventory Page (list of all quizzes student has attempted) */}
          <Route
            path="/student/quizzes/inventory"
            element={
              <PrivateRoute requiredRole="student">
                <StudentQuizInventoryPage />
              </PrivateRoute>
            }
          />
          {/* Student Take Quiz Page */}
          <Route
            path="/student/take-quiz/:quizCode"
            element={
              <PrivateRoute requiredRole="student">
                <StudentTakeQuizPage />
              </PrivateRoute>
            }
          />
          {/* Student's Own Detailed Quiz Attempt Report Page */}
          <Route
            path="/student/quizzes/report/:attemptId" // This route uses the specific StudentQuizAttemptReportPage
            element={
              <PrivateRoute requiredRole="student">
                <StudentQuizAttemptReportPage />
              </PrivateRoute>
            }
          />

          {/* Fallback route for any undefined paths, redirects to root */}
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
