import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Plus,
  Search,
  Settings as SettingsIcon,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "./AdminLayout";
import ReviewerLayout from "./ReviewerLayout";
import OrganiserLayout from "./OrganiserLayout";

/* ------------------------------------------------------------------ *
 * Sidebar items per role (used by GenericShell fallback).
 * ------------------------------------------------------------------ */
const NAV_BY_ROLE = {
  author: [
    { label: "Overview", to: "/author-dashboard", icon: LayoutDashboard },
    { label: "My proposals", to: "/author-dashboard#my-proposals", icon: BookOpen },
    { label: "Deadlines", to: "/author-dashboard#deadlines", icon: CalendarDays },
    { label: "Browse conferences", to: "/conferences", icon: Search },
  ],
  attendee: [
    { label: "My conferences", to: "/my-conferences", icon: Ticket },
    { label: "Browse conferences", to: "/conferences", icon: Search },
  ],
};

const WORKSPACE_LABEL = {
  author: "Author workspace",
  organiser: "Organiser workspace",
  attendee: "Attendee workspace",
};

function GenericShell({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.attendee;
  const workspaceLabel = WORKSPACE_LABEL[role] ?? "Workspace";

  const displayName = user?.name ?? user?.full_name ?? "Account";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "•";

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isActive = (to) => {
    const [path] = to.split("#");
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] transition-colors dark:bg-[#0a0f1f] dark:text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">
              {workspaceLabel}
            </p>
            <p className="m-0 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
              {initials}
            </div>
            <div className="hidden leading-tight sm:block">
              <strong className="block text-[11px] text-white">
                {displayName}
              </strong>
              <span className="block text-[9px] capitalize text-white/45">
                {role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6">
        <aside className="hidden w-[235px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 dark:border-[#1e293b] dark:bg-[#0f172a] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)]">
          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
              <BookOpen size={17} />
            </span>
            <strong className="block text-[13px]">Your workspace</strong>
            <p className="mt-1 text-[10px] leading-5 text-white/60">
              Manage everything from one place.
            </p>
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
                    active
                      ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                      : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          <Link
            to="/testimonials"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              location.pathname === "/testimonials"
                ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
            }`}
          >
            <MessageSquareQuote size={16} />
            <span className="truncate">Testimonials</span>
          </Link>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          <Link
            to="/profile"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              location.pathname === "/profile"
                ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
            }`}
          >
            <UserRound size={16} />
            <span className="truncate">Profile</span>
          </Link>

          <Link
            to="/settings"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              location.pathname === "/settings"
                ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
            }`}
          >
            <SettingsIcon size={16} />
            <span className="truncate">Settings</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] transition hover:bg-[#fff4f5] dark:hover:bg-[#2a1218]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">{children}</main>
      </div>
    </div>
  );
}

export default function RoleChrome({ children }) {
  const { role } = useAuth();

  if (role === "admin") return <AdminLayout>{children}</AdminLayout>;
  if (role === "reviewer") return <ReviewerLayout>{children}</ReviewerLayout>;
  if (role === "organiser") return <OrganiserLayout>{children}</OrganiserLayout>;
  return <GenericShell>{children}</GenericShell>;
}