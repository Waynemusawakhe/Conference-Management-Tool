import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const isActive = (target) => {
    if (target === "/home") {
      return location.pathname === "/" || location.pathname === "/home";
    }
    if (target === "/conferences") {
      return location.pathname === target || location.pathname.startsWith(`${target}/`);
    }
    return location.pathname === target;
  };

  const goTo = ({ target, section }) => {
    setOpen(false);

    if (location.pathname === target || (target === "/home" && location.pathname === "/")) {
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
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault();
            goTo(navItems[0]);
          }}
          aria-label="CMT home"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
        >
          <Logo />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = isActive(item.target);
            return (
              <button
                key={item.label}
                type="button"
                aria-current={active ? "page" : undefined}
                className={`relative min-h-11 border-0 bg-transparent px-1 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff] ${
                  active
                    ? "text-white after:absolute after:inset-x-1 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[#7d6bff] after:content-['']"
                    : "text-white/75 hover:text-white"
                }`}
                onClick={() => goTo(item)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-[11px] border border-white/20 bg-transparent text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {status === "unauthenticated" ? (
            <>
              <button
                type="button"
                className="min-h-11 rounded-[11px] border border-white/20 bg-transparent px-[18px] text-[13px] font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                type="button"
                className="min-h-11 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] text-[13px] font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="ml-auto grid h-11 w-11 place-items-center rounded-lg border border-white/20 bg-transparent text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-[#07132f]/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[#07132f] px-5 py-4 shadow-[0_18px_36px_rgba(7,19,47,.22)] lg:hidden">
            <nav
              id="mobile-navigation"
              className="mx-auto grid w-full max-w-[1200px] gap-1"
              aria-label="Mobile navigation"
            >
              {navItems.map((item) => {
                const active = isActive(item.target);
                return (
                  <button
                    type="button"
                    className={`min-h-11 w-full rounded-lg border-0 px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff] ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-transparent text-white/75 hover:bg-white/[.06] hover:text-white"
                    }`}
                    key={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => goTo(item)}
                  >
                    {item.label}
                  </button>
                );
              })}
              <div className="mt-2 flex gap-2.5 border-t border-white/10 pt-4">
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] border border-white/20 bg-transparent text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
                  onClick={toggleTheme}
                  aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                {status === "unauthenticated" ? (
                  <>
                    <button
                      type="button"
                      className="min-h-11 flex-1 rounded-[11px] border border-white/20 bg-transparent px-[18px] text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
                      onClick={() => {
                        setOpen(false);
                        navigate("/login");
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className="min-h-11 flex-1 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
                      onClick={() => {
                        setOpen(false);
                        navigate("/register");
                      }}
                    >
                      Register
                    </button>
                  </>
                ) : null}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
