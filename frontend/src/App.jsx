import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Header from "./components/Header";
import Register from "./pages/Register";
function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
           */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;
