import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

const navItems = ["Home", "Conferences", "About", "Help & FAQ", "Testimonials", "Contact"];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollTo = (label) => {
    setOpen(false);
    const target = label === "Home" ? "top" : label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <a href="#top" onClick={() => scrollTo("Home")} aria-label="CMT home">
          <Logo />
        </a>

        <nav className={`desktop-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-link ${item === "Home" ? "active" : ""}`}
              onClick={() => scrollTo(item)}
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
            <button key={item} onClick={() => scrollTo(item)}>
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