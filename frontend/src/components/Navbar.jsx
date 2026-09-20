import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { label: "Home", target: "/", section: "top" },
  { label: "Conferences", target: "/conferences" },
  { label: "About", target: "/about" },
  { label: "Testimonials", target: "/testimonials" },
  { label: "Help & FAQ", target: "/help-faq" },
  { label: "Contact", target: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleTheme } = useTheme();

  const goTo = ({ target, section }) => {
    setOpen(false);

    if (location.pathname === target) {
      document.getElementById(section || "top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    navigate(target);
    if (section) {
      window.setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex min-h-[82px] w-[min(1200px,calc(100%-40px))] items-center gap-7">
        <a href="/" onClick={(e) => { e.preventDefault(); goTo(navItems[0]); }} aria-label="CMT home">
          <Logo />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`relative border-0 bg-transparent px-0 py-7 text-[13px] font-semibold text-white/80 transition hover:text-white ${item.target === "/" && location.pathname === "/" ? "text-white after:absolute after:inset-x-0 after:bottom-4 after:h-0.5 after:rounded-full after:bg-[#7d6bff] after:content-['']" : ""}`}
              onClick={() => goTo(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>

  <div className="hidden gap-2.5 lg:flex">
  <button className="grid h-10 w-10 place-items-center rounded-[11px] border border-white/20 bg-transparent text-white" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
    {dark ? <Sun size={17} /> : <Moon size={17} />}
  </button>
  <button className="rounded-[11px] border border-white/20 bg-transparent px-[18px] py-[11px] text-[13px] font-bold text-white transition hover:-translate-y-px" onClick={() => navigate("/login")}>
    Login
  </button>
  <button className="rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px" onClick={() => navigate("/register")}>
    Register
  </button>
</div>

        <button
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-white/20 bg-transparent text-white lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#07132f] px-5 py-4 lg:hidden">
          {navItems.map((item) => (
            <button className="block w-full border-0 bg-transparent px-2 py-3 text-left text-sm font-semibold text-white/80" key={item.label} onClick={() => goTo(item)}>
              {item.label}
            </button>
          ))}
            <div className="mt-3 flex gap-2.5 border-t border-white/10 pt-4">
          <button className="grid h-11 w-11 place-items-center rounded-[11px] border border-white/20 bg-transparent text-white" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="flex-1 rounded-[11px] border border-white/20 bg-transparent px-[18px] py-[11px] text-[13px] font-bold text-white" onClick={() => { setOpen(false); navigate("/login"); }}>
    Login
  </button>
  <button className="flex-1 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white" onClick={() => { setOpen(false); navigate("/register"); }}>
    Register
  </button>
</div>
        </div>
      )}
    </header>
  );
}