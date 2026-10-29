import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Home", target: "/home", section: "top" },
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
  const { status } = useAuth();

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

  const renderNavItems = (mobile = false) => navItems.map((item) => {
    const active = location.pathname === item.target;
    return (
      <button
        key={item.label}
        type="button"
        className={`cmt-nav-link${active ? " is-active" : ""}${mobile ? " is-mobile" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => goTo(item)}
      >
        {item.label}
      </button>
    );
  });

  const renderAuthActions = (mobile = false) => (
    status === "unauthenticated" ? (
      <div className={`cmt-nav-auth${mobile ? " is-mobile" : ""}`}>
        <button type="button" className="cmt-nav-login" onClick={() => { setOpen(false); navigate("/login"); }}>
          Log in
        </button>
        <button type="button" className="cmt-nav-register" onClick={() => { setOpen(false); navigate("/register"); }}>
          Create account <ArrowUpRight size={13} aria-hidden="true" />
        </button>
      </div>
    ) : null
  );

  return (
    <header className="cmt-navbar">
      <div className="cmt-navbar-inner">
        <button
          type="button"
          className="cmt-navbar-brand"
          onClick={() => goTo(navItems[0])}
          aria-label="CMT home"
        >
          <Logo />
        </button>

        <nav className="cmt-navbar-links" aria-label="Main navigation">
          {renderNavItems()}
        </nav>

        <div className="cmt-navbar-actions">
          <button
            type="button"
            className="cmt-theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {renderAuthActions()}
        </div>

        <button
          type="button"
          className="cmt-mobile-menu"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {open && (
        <div className="cmt-mobile-panel">
          <nav aria-label="Mobile navigation">{renderNavItems(true)}</nav>
          <div className="cmt-mobile-actions">
            <button
              type="button"
              className="cmt-theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {renderAuthActions(true)}
          </div>
        </div>
      )}
    </header>
  );
}
