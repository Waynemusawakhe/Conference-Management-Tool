import { Routes, Route } from "react-router-dom";
import Testimonials from "./pages/Testimonials";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Conferences from "./pages/Conferences";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import HelpFAQ from "./pages/HelpFAQ";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/conferences" element={<Conferences />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help-faq" element={<HelpFAQ />} />
      <Route path="/about" element={<About />} />
      <Route path="/testimonials" element={<Testimonials />} />
    </Routes>
  );
}
