import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Conferences from "./pages/Conferences";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import HelpFAQ from "./pages/HelpFAQ";
import About from "./pages/About";
import { Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/conferences" element={<Conferences />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help-faq" element={<HelpFAQ />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
