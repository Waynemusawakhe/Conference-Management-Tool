import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import HelpFAQ from "./pages/HelpFAQ";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help-faq" element={<HelpFAQ />} />
    </Routes>
  );
}