import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Clock,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { reviewsApi } from "../api/reviewsApi";

export const REVIEWER_NAV = [
  {
    key: "all",
    label: "Overview",
    icon: LayoutDashboard,
    to: "/reviewer-dashboard",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    to: "/reviewer-dashboard?filter=pending",
  },
  {
    key: "submitted",
    label: "Submitted",
    icon: FileText,
    to: "/reviewer-dashboard?filter=submitted",
  },
  {
    key: "locked",
    label: "Locked",
    icon: Lock,
    to: "/reviewer-dashboard?filter=locked",
  },
];

const DISMISSED_KEY = "cmt_reviewer_dismissed_notifications";

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

const itemReviewId = (r) => r.id;
const itemSubmissionId = (r) => r.submission_id ?? r.submission?.id ?? null;
const itemTitle = (r) =>
  r.submission?.title ??
  r.title ??
  (itemSubmissionId(r) ? `Submission #${itemSubmissionId(r)}` : "New review");
const itemConference = (r) =>
  r.submission?.conference?.name ??
  r.conference?.name ??
  r.conference_name ??
  r.submission?.conference_name ??
  "";
const itemTrack = (r) =>
  r.submission?.track ?? r.track ?? r.submission?.category ?? "";

function reviewIsLocked(r) {
  return Boolean(r.locked ?? r.is_locked);
}
function reviewIsSubmitted(r) {
  return Boolean(
    r.submitted_at ??
      r.submittedAt ??
      r.comments ??
      r.comment ??
      r.recommendation
  );
}

export default function ReviewerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissed, setDismissed] = useState(() => loadDismissed());
  const [reviews, setReviews] = useState([]);
  const notificationsRef = useRef(null);

  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.name ?? user?.full_name ?? "Reviewer";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "RV";

  const params = new URLSearchParams(location.search);
  const activeFilter = params.get("filter") ?? "all";

  /* ---- Polling fetch for reviews (notification source) ---- */
  useEffect(() => {
    let alive = true;

    async function fetchReviews() {
      try {
        if (typeof reviewsApi?.getAll !== "function") return;
        const response = await reviewsApi.getAll();
        const payload = response?.data ?? response ?? [];
        const list = Array.isArray(payload) ? payload : payload?.data ?? [];
        if (alive) setReviews(list);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[ReviewerLayout] notification fetch failed:", err);
        }
      }
    }

    fetchReviews();
    const id = window.setInterval(fetchReviews, 45000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  /* ---- Build notification list: pending (un-scored) reviews ---- */
  const notifications = useMemo(() => {
    return reviews
      .filter((r) => !reviewIsLocked(r) && !reviewIsSubmitted(r))
      .map((r) => ({
        id: `review-${itemReviewId(r)}`,
        title: itemTitle(r),
        description:
          [itemConference(r), itemTrack(r)].filter(Boolean).join(" · ") ||
          "Assigned review",
        time: r.created_at ?? r.assigned_at ?? r.updated_at ?? null,
        to: `/reviewer/evaluate/${itemReviewId(r)}`,
      }))
      .sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return tb - ta;
      });
  }, [reviews]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissed.has(n.id)),
    [notifications, dismissed]
  );

  const notificationCount = visibleNotifications.length;

  const dismissOne = (id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  };
  const dismissAll = () => {
    setDismissed((prev) => {
      const next = new Set(prev);
      visibleNotifications.forEach((n) => next.add(n.id));
      saveDismissed(next);
      return next;
    });
  };

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

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] transition-colors dark:bg-[#0a0f1f] dark:text-white">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-4 sm:gap-6">
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
              Reviewer workspace
            </p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* ---- Notification bell ---- */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/85 transition hover:bg-white/10"
                aria-label={`Notifications${notificationCount ? ` (${notificationCount} unread)` : ""}`}
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
                        Assigned reviews
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
                          Newly assigned reviews will appear here.
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
                                navigate(n.to);
                              }}
                              className="flex flex-1 items-start gap-3 text-left"
                            >
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#efedff] text-[#4f46c7] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
                                <ClipboardCheck size={15} />
                              </span>
                              <div className="min-w-0 flex-1 pr-6">
                                <strong className="block truncate text-[11px] font-bold text-[#1c2a4a] dark:text-white">
                                  {n.title}
                                </strong>
                                {n.description && (
                                  <span className="mt-0.5 block truncate text-[10px] text-[#8a95a8] dark:text-[#94a3b8]">
                                    {n.description}
                                  </span>
                                )}
                                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.05em] text-[#aeb6c6] dark:text-[#64748b]">
                                  {relativeTime(n.time) || "Assigned"}
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

                  {visibleNotifications.length > 0 && (
                    <div className="border-t border-[#edf0f5] bg-[#fafbff] px-4 py-2.5 dark:border-[#1e293b] dark:bg-[#0b1224]">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/reviewer-dashboard");
                        }}
                        className="text-[10px] font-extrabold text-[#6655f6] hover:underline dark:text-[#a9a2ff]"
                      >
                        View all reviews →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/85 transition hover:bg-white/10"
              aria-label={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#e8e6ff] to-[#d8d4ff] text-[10px] font-extrabold text-[#4f46c7]">
                {initials}
              </div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">
                  {displayName}
                </strong>
                <span className="block text-[9px] text-white/45">Reviewer</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-[#07132f]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[260px] transform bg-white p-4 shadow-2xl transition-transform duration-300 dark:bg-[#0f172a] lg:sticky lg:top-[100px] lg:block lg:max-h-[calc(100vh-120px)] lg:w-[260px] lg:translate-x-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-[#e4e8f0] lg:bg-white lg:p-3 lg:shadow-none lg:dark:border-[#1e293b] lg:dark:bg-[#0f172a] ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2 lg:block">
            <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
              <span className="relative mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                <ClipboardCheck size={17} />
              </span>
              <strong className="relative block text-[13px]">
                Reviewer menu
              </strong>
              <p className="relative mt-1 text-[10px] leading-5 text-white/60">
                Score assigned submissions and manage your queue.
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-2 text-[#66728b] dark:text-[#94a3b8]"
            >
              <X size={20} />
            </button>
          </div>

          {/* ---- Reviewer filters ---- */}
          <nav className="space-y-1" aria-label="Reviewer navigation">
            {REVIEWER_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeFilter === item.key;
              const showBadge =
                item.key === "pending" && notificationCount > 0;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors ${
                    isActive
                      ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                      : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a] dark:text-[#94a3b8] dark:hover:bg-[#111c33] dark:hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] px-1 text-[9px] font-extrabold text-white">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          {/* ---- Public site links ---- */}
          <nav className="space-y-1" aria-label="Public site">
            <Link
              to="/testimonials"
              onClick={() => setSidebarOpen(false)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition-colors ${
                location.pathname === "/testimonials"
                  ? "bg-[#efedff] font-extrabold text-[#5649dc] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                  : "text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a] dark:text-[#94a3b8] dark:hover:bg-[#111c33] dark:hover:text-white"
              }`}
            >
              <MessageSquareQuote size={16} />
              <span className="truncate flex-1">Testimonials</span>
            </Link>
          </nav>

          <div className="my-4 border-t border-[#edf0f5] dark:border-[#1e293b]" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] transition hover:bg-[#fff4f5] dark:text-[#f08a9a] dark:hover:bg-[#2a1218]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">{children}</main>
      </div>
    </div>
  );
}