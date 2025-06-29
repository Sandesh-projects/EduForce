import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Suspense, lazy } from "react";

// Core components and context
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader } from "lucide-react"; // Loading spinner icon

// Lazy loaded pages for efficiency
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Student-specific pages
const StudentHomePage = lazy(() => import("./pages/StudentHomePage"));
const StudentQuizInventoryPage = lazy(() =>
  import("./pages/StudentQuizInventoryPage")
);
const StudentTakeQuizPage = lazy(() => import("./pages/StudentTakeQuizPage"));
const StudentQuizAttemptReportPage = lazy(() =>
  import("./pages/StudentQuizAttemptReportPage")
);

// Teacher-specific pages
const TeacherHomePage = lazy(() => import("./pages/TeacherHomePage"));
const TeacherQuizzesPage = lazy(() => import("./pages/TeacherQuizzesPage"));
const QuizReportPage = lazy(() => import("./pages/QuizReportPage"));
const TeacherQuizAttemptsPage = lazy(() =>
  import("./pages/TeacherQuizAttemptsPage")
);

// Define application routes
const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",

  STUDENT: {
    HOME: "/student/home",
    QUIZ_INVENTORY: "/student/quizzes/inventory",
    TAKE_QUIZ: "/student/take-quiz",
    QUIZ_REPORT: "/student/quizzes/report/:attemptId",
  },

  TEACHER: {
    HOME: "/teacher/home",
    QUIZZES: "/teacher/quizzes",
    QUIZ_ATTEMPTS: "/teacher/quizzes/:quizId/report",
    ATTEMPT_REPORT: "/teacher/attempts/:attemptId",
  },
};

// Define user roles
const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
};

// Determines redirect path based on user role
const getRedirectPath = (user) => {
  if (!user) return ROUTES.HOME;
  switch (user.role) {
    case USER_ROLES.STUDENT:
      return ROUTES.STUDENT.HOME;
    case USER_ROLES.TEACHER:
      return ROUTES.TEACHER.HOME;
    default:
      return ROUTES.HOME;
  }
};

// Custom loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 text-white">
    <Loader className="w-16 h-16 animate-spin text-purple-400 mb-6" />
    <p className="text-2xl font-semibold text-gray-200">Loading...</p>
    <p className="text-md text-gray-400 mt-2">Please wait a moment.</p>
  </div>
);

// Component to redirect authenticated users from public routes
const RedirectIfAuthenticated = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (isLoggedIn && user) {
    const redirectPath = getRedirectPath(user);
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }
  return children;
};

// Wrapper for lazy loaded pages with a loading fallback
const PageLoader = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// Enhanced PrivateRoute for role-based access control
const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = ROUTES.LOGIN,
}) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
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
  const location = useLocation();

  // Hide header on quiz-taking page
  const hideHeader = location.pathname.startsWith(ROUTES.STUDENT.TAKE_QUIZ);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <PageLoader>
          <Routes>
            {/* Public Routes */}
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

            {/* Root Route with Smart Redirection */}
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

// Component for root route redirection
const RootRedirect = () => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  const from = location.state?.from?.pathname || getRedirectPath(user);

  if (isLoggedIn && user) {
    return <Navigate to={from} replace />;
  }

  return <LandingPage />;
};

// Student routes definitions
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
    <Route path="*" element={<Navigate to={ROUTES.STUDENT.HOME} replace />} />
  </Routes>
);

// Teacher routes definitions
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
      path="quizzes/:quizId/report"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <TeacherQuizAttemptsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="attempts/:attemptId"
      element={
        <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
          <QuizReportPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to={ROUTES.TEACHER.HOME} replace />} />
  </Routes>
);

export default App;
