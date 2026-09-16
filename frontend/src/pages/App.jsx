import { Navigate, Route, Routes } from "react-router-dom";

import { ThemeProvider } from "../context/ThemeContext";
import ProtectedRoute from "../components/ProtectedRoute";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Conferences from "./Conferences";
import Contact from "./Contact";
import HelpFAQ from "./HelpFAQ";
import About from "./About";
import Testimonials from "./Testimonials";
import AuthorDashboard from "./AuthorDashboard";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/conferences"
          element={<Conferences />}
        />

        <Route path="/contact" element={<Contact />} />

        <Route path="/help-faq" element={<HelpFAQ />} />

        <Route path="/about" element={<About />} />

        <Route
          path="/testimonials"
          element={<Testimonials />}
        />

        <Route
          path="/author-dashboard"
          element={
            <ProtectedRoute allowedRoles={["author"]}>
              <AuthorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </ThemeProvider>
  );
}