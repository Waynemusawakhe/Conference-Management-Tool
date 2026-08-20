import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

const navItems = ["Home", "Conferences", "About", "Help & FAQ", "Testimonials", "Contact"];

// Items that live on their own page rather than as a section on Home.
const routes = {
  About: "/about",
  Contact: "/contact",
  Conferences: "/conferences",
  "Help & FAQ": "/help-faq",
  "Testimonials": "/testimonials",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (label) => {
    setOpen(false);

    if (routes[label]) {
      navigate(routes[label]);
      return;
    }

    const target = label === "Home" ? "top" : label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (location.pathname !== "/") {
      // Not on the home page — go there first, then scroll once it renders.
      navigate("/");
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <a href="/" onClick={(e) => { e.preventDefault(); goTo("Home"); }} aria-label="CMT home">
          <Logo />
        </a>

        <nav className={`desktop-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-link ${item === "Home" && location.pathname === "/" ? "active" : ""}`}
              onClick={() => goTo(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => alert("Login will be connected to the authentication backend.")}>
            Login
          </button>
          <button className="btn btn-primary" onClick={() => alert("Registration will be connected to the authentication backend.")}>
            Register
          </button>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="mobile-nav">
          {navItems.map((item) => (
            <button key={item} onClick={() => goTo(item)}>
              {item}
            </button>
          ))}
          <div className="mobile-nav-actions">
            <button className="btn btn-ghost">Login</button>
            <button className="btn btn-primary">Register</button>
          </div>
        </div>
      )}
    </header>
  );
}