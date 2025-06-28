// frontend/src/App.jsx
import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom"; // Add useNavigate here
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Suspense, lazy } from "react";

// Import components that are always needed
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import Loader icon from lucide-react for the custom spinner
import { Loader } from "lucide-react";

// Lazy load pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Student pages
const StudentHomePage = lazy(() => import("./pages/StudentHomePage"));
const StudentQuizInventoryPage = lazy(() =>
  import("./pages/StudentQuizInventoryPage")
);
const StudentTakeQuizPage = lazy(() => import("./pages/StudentTakeQuizPage"));
const StudentQuizAttemptReportPage = lazy(() =>
  import("./pages/StudentQuizAttemptReportPage")
);

// Teacher pages
const TeacherHomePage = lazy(() => import("./pages/TeacherHomePage"));
const TeacherQuizzesPage = lazy(() => import("./pages/TeacherQuizzesPage"));
const QuizReportPage = lazy(() => import("./pages/QuizReportPage"));
const TeacherQuizAttemptsPage = lazy(() =>
  import("./pages/TeacherQuizAttemptsPage")
);

// Route constants for better maintainability
const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",

  // Student routes
  STUDENT: {
    HOME: "/student/home",
    QUIZ_INVENTORY: "/student/quizzes/inventory",
    TAKE_QUIZ: "/student/take-quiz/:quizCode",
    QUIZ_REPORT: "/student/quizzes/report/:attemptId",
  },

  // Teacher routes
  TEACHER: {
    HOME: "/teacher/home",
    QUIZZES: "/teacher/quizzes",
    QUIZ_ATTEMPTS: "/teacher/quizzes/:quizId/report", // Used for the list of attempts for a specific quiz
    ATTEMPT_REPORT: "/teacher/attempts/:attemptId", // Used for individual attempt report (QuizReportPage)
  },
};

// User role constants
const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
};

// Helper function to determine redirect path based on user role
const getRedirectPath = (user) => {
  if (!user) return ROUTES.HOME;

  switch (user.role) {
    case USER_ROLES.STUDENT:
      return ROUTES.STUDENT.HOME;
    case USER_ROLES.TEACHER:
      return ROUTES.TEACHER.HOME;
    default:
      console.warn(`Unknown user role: ${user.role}`);
      return ROUTES.HOME;
  }
};

// Custom Loading Spinner Component using Lucide React
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 text-white">
    <Loader className="w-16 h-16 animate-spin text-purple-400 mb-6" />
    <p className="text-2xl font-semibold text-gray-200">Loading...</p>
    <p className="text-md text-gray-400 mt-2">Please wait a moment.</p>
  </div>
);

// Component to handle root route redirection (or any route where authenticated users shouldn't be)
const RedirectIfAuthenticated = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const navigate = useNavigate(); // useNavigate is now imported
  const location = useLocation();

  // If loading, just show spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // If already logged in, redirect to appropriate home page
  if (isLoggedIn && user) {
    const redirectPath = getRedirectPath(user);
    // Use replace to prevent going back to login/register via browser back button
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  // If not logged in, render the children (e.g., Login or Register component)
  return children;
};

// Loading component wrapper
const PageLoader = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// Enhanced PrivateRoute wrapper for better error handling
const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = ROUTES.LOGIN,
}) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  return <PrivateRoute requiredRole={requiredRole}>{children}</PrivateRoute>;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content with routing logic
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <PageLoader>
          <Routes>
            {/* Public Routes - Now use RedirectIfAuthenticated */}
            <Route
              path={ROUTES.LOGIN}
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path={ROUTES.REGISTER}
              element={
                <RedirectIfAuthenticated>
                  <Register />
                </RedirectIfAuthenticated>
              }
            />

            {/* Root Route with Smart Redirection (still relevant for initial app load) */}
            <Route path={ROUTES.HOME} element={<RootRedirect />} />

            {/* Shared Protected Routes */}
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute
                  requiredRole={[USER_ROLES.STUDENT, USER_ROLES.TEACHER]}
                >
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Routes */}
            <Route path="/student/*" element={<StudentRoutes />} />

            {/* Teacher Protected Routes */}
            <Route path="/teacher/*" element={<TeacherRoutes />} />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </PageLoader>
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
        theme="colored"
      />
    </div>
  );
};

// Component to handle root route redirection (renamed from RootRedirect for clarity)
const RootRedirect = () => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />; // Show loading while auth state is determined
  }

  // Preserve the intended destination in state for post-login redirect
  const from = location.state?.from?.pathname || getRedirectPath(user);

  if (isLoggedIn && user) {
    return <Navigate to={from} replace />;
  }

  return <LandingPage />;
};

// Student routes component
const StudentRoutes = () => (
  <Routes>
    <Route
      path="home"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
          <StudentHomePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="quizzes/inventory"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
          <StudentQuizInventoryPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="take-quiz/:quizCode"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
          <StudentTakeQuizPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="quizzes/report/:attemptId"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
          <StudentQuizAttemptReportPage />
        </ProtectedRoute>
      }
    />
    {/* Student 404 - redirect to student home */}
    <Route path="*" element={<Navigate to={ROUTES.STUDENT.HOME} replace />} />
  </Routes>
);

// Teacher routes component
const TeacherRoutes = () => (
  <Routes>
    <Route
      path="home"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <TeacherHomePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="quizzes"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <TeacherQuizzesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="quizzes/:quizId/report" // This route is for TeacherQuizAttemptsPage (list of attempts for a quiz)
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <TeacherQuizAttemptsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="attempts/:attemptId" // This route is for individual QuizReportPage (for teacher to view student's report)
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <QuizReportPage />
        </ProtectedRoute>
      }
    />
    {/* Teacher 404 - redirect to teacher home */}
    <Route path="*" element={<Navigate to={ROUTES.TEACHER.HOME} replace />} />
  </Routes>
);

export default App;
