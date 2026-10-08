import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareQuote,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { label: "Overview", to: "/author-dashboard", icon: LayoutDashboard },
  { label: "My proposals", to: "/author-dashboard#my-proposals", icon: FileText },
     
  { label: "Deadlines", to: "/author-dashboard#deadlines", icon: CalendarDays },
  { label: "Browse conferences", to: "/author/conferences", icon: Search },
];

const FOOTER_NAV = [
  { label: "Testimonials", to: "/user-testimonials", icon: MessageSquareQuote },
];

const SETTINGS_NAV = [
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: SettingsIcon },
];

export default function AuthorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.name || user?.full_name || "Author";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() ?? "")
      .join("") || "A";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  const isActive = (to) => {
    const [path] = to.split("#");
    if (to === "/author-dashboard" && location.pathname === "/author-dashboard") {
      return !location.hash;
    }
    if (to.startsWith("/author-dashboard#")) {
      return (
        location.pathname === "/author-dashboard" &&
        location.hash === "#" + to.split("#")[1]
      );
    }
    return location.pathname === path;
  };

  const navItemClass = (to) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] ${
      isActive(to)
        ? "bg-[#efedff] font-extrabold text-[#5649dc]"
        : "font-semibold text-[#66728b] hover:bg-[#f5f6fa]"
    }`;

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-5">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle dashboard navigation"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button
            className="border-0 bg-transparent p-0"
            onClick={() => navigate("/")}
            aria-label="CMT home"
          >
            <Logo />
          </button>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">
              Author workspace
            </p>
            <p className="m-0 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell dark />
            <button
              className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <Sparkles size={16} />
            </button>
            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
                {initials}
              </div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">
                  {displayName}
                </strong>
                <span className="block text-[9px] text-white/45">Author</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-[#07132f]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`${
            sidebarOpen ? "fixed inset-x-4 top-[88px] z-40 block" : "hidden"
          } w-[235px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:overflow-y-auto lg:shadow-none`}
        >
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
              <BookOpen size={17} />
            </span>
            <strong className="block text-[13px]">Your research hub</strong>
            <p className="mt-1 text-[10px] leading-5 text-white/60">
              Manage submissions and stay on top of conference deadlines.
            </p>
          </div>

          <nav className="space-y-1" aria-label="Author dashboard navigation">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={navItemClass(item.to)}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-[#edf0f5]" />

          <nav className="space-y-1">
            {FOOTER_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={navItemClass(item.to)}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-[#edf0f5]" />

          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={navItemClass(item.to)}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-busy={signingOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] transition-colors hover:bg-[#fff4f5] disabled:cursor-wait disabled:opacity-70"
          >
            {signingOut ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">{children}</main>
      </div>
    </div>
  );
}