// src/components/OrganiserLayout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { submissionsApi } from "../api/submissionsApi";

const PRIMARY_NAV = [
  {
    label: "Overview",
    to: "/organiser-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My conferences",
    to: "/organiser/conferences",
    icon: CalendarDays,
  },
  {
    label: "Reviews",
    to: "/organiser/reviews",
    icon: CheckCheck,
  },
  {
    label: "Attendees",
    to: "/organiser/registrations",
    icon: Users,
  },
  {
    label: "Create conference",
    to: "/create-conference",
    icon: Plus,
  },
  {
    label: "Browse conferences",
    to: "/conferences",
    icon: Search,
  },
];

const DISMISSED_KEY = "cmt_organiser_dismissed_notifications";

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
function saveDismissed(set) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch {}
}

function relativeTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

const submissionTitle = (s) => s.title ?? s.name ?? `Submission #${s.id}`;
const submissionAuthor = (s) =>
  s.author?.name ?? s.author_name ?? s.user?.name ?? `Author #${s.author_id ?? "?"}`;
const statusKey = (raw) =>
  raw ? String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_") : "";

export default function OrganiserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissed, setDismissed] = useState(() => loadDismissed());
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

  const notificationsRef = useRef(null);
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName =
    user?.name ?? user?.full_name ?? user?.fullName ?? "Organiser";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "OG";

  /* ---- Poll submissions for the notification bell ---- */
  useEffect(() => {
    let alive = true;
    async function fetchData() {
      try {
        if (typeof submissionsApi?.getAll !== "function") return;
        const response = await submissionsApi.getAll({ per_page: 100 });
        const payload = response?.data ?? response ?? [];
        const list = Array.isArray(payload) ? payload : payload?.data ?? [];
        if (!alive) return;
        setPendingSubmissions(
          list.filter((s) => {
            const k = statusKey(s.status);
            return k === "pending" || k === "";
          })
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[OrganiserLayout] fetch failed:", err);
        }
      }
    }
    fetchData();
    const id = window.setInterval(fetchData, 45000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const notifications = useMemo(
    () =>
      pendingSubmissions
        .map((s) => ({
          id: `submission-${s.id}`,
          title: `New submission: ${submissionTitle(s)}`,
          description: submissionAuthor(s),
          time: s.created_at ?? s.submitted_at ?? null,
        }))
        .sort((a, b) => {
          const ta = a.time ? new Date(a.time).getTime() : 0;
          const tb = b.time ? new Date(b.time).getTime() : 0;
          return tb - ta;
        }),
    [pendingSubmissions]
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissed.has(n.id)),
    [notifications, dismissed]
  );
  const notificationCount = visibleNotifications.length;

  const dismissOne = (id) =>
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });

  const dismissAll = () =>
    setDismissed((prev) => {
      const next = new Set(prev);
      visibleNotifications.forEach((n) => next.add(n.id));
      saveDismissed(next);
      return next;
    });

  useEffect(() => {
    if (!showNotifications) return;
    const onClick = (e) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setShowNotifications(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showNotifications]);

  useEffect(() => {
    setShowNotifications(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setSidebarOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const isActiveRoute = (to) => location.pathname === to;

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] transition-colors dark:bg-[#0a0f1f] dark:text-white">
      {/* ============ Header ============ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-4">
          <button
            className="lg:hidden text-white/80 hover:text-white"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <Link to="/" aria-label="CMT home">
            <Logo />
          </Link>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <div className="hidden sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">
              Organiser workspace
            </p>
            <p className="m-0 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/85 transition hover:bg-white/10"
                aria-label={`Notifications${notificationCount ? ` (${notificationCount} new)` : ""}`}
                aria-expanded={showNotifications}
              >
                <Bell size={17} />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[#07132f] bg-gradient-to-br from-[#f43f5e] to-[#e11d48] px-1 text-[9px] font-extrabold text-white shadow-[0_4px_10px_rgba(244,63,94,.4)]">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#e4e8f0] bg-white text-[#0d1b3d] shadow-[0_25px_60px_rgba(7,19,47,.28)] dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white">
                  <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-4 py-3 dark:border-[#1e293b]">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#efedff] text-[#4f46c7] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
                        <Bell size={13} />
                      </span>
                      <strong className="text-[12px] font-extrabold">
                        Submissions
                      </strong>
                      {notificationCount > 0 && (
                        <span className="rounded-full bg-[#efedff] px-2 py-0.5 text-[9px] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    {notificationCount > 0 && (
                      <button
                        onClick={dismissAll}
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#6655f6] hover:underline dark:text-[#a9a2ff]"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#effaf4] text-[#18794e] dark:bg-[#052e1f] dark:text-[#34d399]">
                          <CheckCheck size={20} />
                        </span>
                        <strong className="text-[12px] font-bold text-[#1c2a4a] dark:text-white">
                          You're all caught up
                        </strong>
                        <span className="max-w-[240px] text-[10px] leading-5 text-[#8993a6] dark:text-[#94a3b8]">
                          Newly submitted proposals will appear here.
                        </span>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#f2f4f9] dark:divide-[#1e293b]">
                        {visibleNotifications.map((n) => (
                          <li
                            key={n.id}
                            className="group relative flex items-start gap-3 px-4 py-3 transition hover:bg-[#fafbff] dark:hover:bg-[#111c33]"
                          >
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                navigate("/organiser-dashboard");
                              }}
                              className="flex flex-1 items-start gap-3 text-left"
                            >
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef5fd] text-[#1d5fa8] dark:bg-[#0c2340] dark:text-[#60a5fa]">
                                <FileText size={15} />
                              </span>
                              <div className="min-w-0 flex-1 pr-6">
                                <strong className="block truncate text-[11px] font-bold text-[#1c2a4a] dark:text-white">
                                  {n.title}
                                </strong>
                                <span className="mt-0.5 block truncate text-[10px] text-[#8a95a8] dark:text-[#94a3b8]">
                                  {n.description}
                                </span>
                                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.05em] text-[#aeb6c6] dark:text-[#64748b]">
                                  {relativeTime(n.time) || "New"}
                                </span>
                              </div>
                            </button>
                            <button
                              onClick={() => dismissOne(n.id)}
                              className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-[#c4c8d4] opacity-0 transition hover:bg-[#f1f2f6] hover:text-[#5c6880] group-hover:opacity-100 dark:hover:bg-[#1e293b]"
                              aria-label="Dismiss"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/85 transition hover:bg-white/10"
              aria-label={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* User chip */}
            <div className="hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
                {initials}
              </div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">
                  {displayName}
                </strong>
                <span className="block text-[9px] text-white/45">
                  Organiser
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ Body ============ */}
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-[#07132f]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — byte-identical to RoleChrome's desktop sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[235px] shrink-0 transform bg-white p-3 shadow-2xl transition-transform duration-300 dark:bg-[#0f172a] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:translate-x-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-[#e4e8f0] lg:shadow-none lg:dark:border-[#1e293b] lg:dark:bg-[#0f172a] ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="w-full rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                <BookOpen size={17} />
              </span>
              <strong className="block text-[13px]">Your workspace</strong>
              <p className="mt-1 text-[10px] leading-5 text-white/60">
                Manage everything from one place.
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-2 text-[#66728b] dark:text-[#94a3b8]"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Primary nav */}
          <nav className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
                    active
                      ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                      : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          {/* Testimonials */}
          <Link
            to="/testimonials"
            onClick={() => setSidebarOpen(false)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              isActiveRoute("/testimonials")
                ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
            }`}
          >
            <MessageSquareQuote size={16} />
            <span className="truncate">Testimonials</span>
          </Link>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          {/* Profile + Settings */}
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              isActiveRoute("/profile")
                ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
            }`}
          >
            <UserRound size={16} />
            <span className="truncate">Profile</span>
          </Link>

          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${
              isActiveRoute("/settings")
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