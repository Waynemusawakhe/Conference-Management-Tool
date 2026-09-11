import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { usersApi } from "../api/usersApi";
import { reportsApi } from "../api/reportsApi";

/* ------------------------------------------------------------------ *
 * Display helpers
 * Response schemas are NOT fully confirmed, so these read defensively.
 * Replace each `??` chain with the confirmed field once Swagger is fixed.
 * ------------------------------------------------------------------ */

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
};

function statusKey(raw) {
  if (!raw) return "pending";
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function statusLabel(raw) {
  return STATUS_LABELS[statusKey(raw)] ?? String(raw ?? "—");
}

const statusStyles = {
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

function pickNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

// Conference field fallbacks (create/update fields are unconfirmed)
const confName = (c) => c.name ?? c.title ?? `Conference #${c.id}`;
const confLocation = (c) => c.location ?? c.venue ?? c.city ?? "—";
const confDate = (c) => formatDate(c.date ?? c.start_date ?? c.starts_at);
const confSubmissions = (c) =>
  c.submissions_count ?? (Array.isArray(c.submissions) ? c.submissions.length : "—");

const subTitle = (s) => s.title ?? s.name ?? `Submission #${s.id}`;
const subAuthor = (s) => s.author?.name ?? s.author_name ?? s.user?.name ?? "—";
const subConference = (s) => s.conference?.name ?? s.conference_name ?? s.conference?.title ?? "—";
const subDecision = (s) => s.decision ?? s.recommendation ?? "Pending";
const userName = (u) => u.name ?? u.full_name ?? `User #${u.id}`;

function TableMessage({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-[11px] text-[#8993a6]">
        {children}
      </td>
    </tr>
  );
}

function RetryButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
    >
      Retry
    </button>
  );
}

/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [notice, setNotice] = useState(true);
  const [busy, setBusy] = useState(null); // e.g. "conference-3"
  const [feedback, setFeedback] = useState(null); // { type, message }

  const [expanded, setExpanded] = useState({
    conferences: true,
    submissions: true,
    users: false,
  });

  const toggleSection = (section) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  /* ---------------- API data ---------------- */

  const conferencesRes = useApiResource(() => conferencesApi.getAll(), []);
  const submissionsRes = useApiResource(() => submissionsApi.getAll(), []);
  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const reportsRes = useApiResource(() => reportsApi.dashboard(), []);

  const conferences = useMemo(() => toArray(conferencesRes.data), [conferencesRes.data]);
  const submissions = useMemo(() => toArray(submissionsRes.data), [submissionsRes.data]);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);

  const dashboard = reportsRes.data?.data ?? reportsRes.data ?? null;

  /* ---------------- Derived stats ---------------- */

  const stats = useMemo(() => {
    const acceptedFromList = submissions.filter((s) => statusKey(s.status) === "accepted").length;

    return [
      {
        icon: <CalendarDays size={19} />,
        value:
          pickNumber(dashboard?.total_conferences, dashboard?.conferences_count) ??
          conferences.length,
        label: "Total conferences",
        note: "All events",
      },
      {
        icon: <FileText size={19} />,
        value:
          pickNumber(dashboard?.total_submissions, dashboard?.submissions_count) ??
          submissions.length,
        label: "Total submissions",
        note: "Across conferences",
      },
      {
        icon: <Users size={19} />,
        value: pickNumber(dashboard?.total_users, dashboard?.users_count) ?? users.length,
        label: "Total users",
        note: "All roles",
      },
      {
        icon: <FileCheck2 size={19} />,
        value:
          pickNumber(dashboard?.accepted_submissions, dashboard?.accepted_count) ??
          acceptedFromList,
        label: "Accepted submissions",
        note: "Ready for publication",
      },
    ];
  }, [dashboard, conferences.length, submissions, users.length]);

  /* ---------------- Filtering ----------------
   * Search/filter params for /submissions are NOT confirmed, so filtering
   * happens client-side over the loaded page. Move to server-side params
   * once the backend confirms them (and pagination will otherwise hide rows).
   * -------------------------------------------- */

  const filteredSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return submissions.filter((sub) => {
      const label = statusLabel(sub.status);
      const matchesStatus = statusFilter === "All statuses" || label === statusFilter;

      const haystack = [
        subTitle(sub),
        subAuthor(sub),
        subConference(sub),
        String(sub.id ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalized || haystack.includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [submissions, query, statusFilter]);

  const scrollTo = (id) => {
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------------- Mutations ---------------- */

  const runMutation = async (key, action, successMessage) => {
    setBusy(key);
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: "success", message: successMessage });
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error?.message || "Something went wrong. Please try again.",
      });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteConference = async (id) => {
    if (!window.confirm("Are you sure you want to delete this conference?")) return;

    await runMutation(
      `conference-${id}`,
      async () => {
        await conferencesApi.remove(id);
        await Promise.all([conferencesRes.reload(), reportsRes.reload()]);
      },
      "Conference deleted."
    );
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;

    await runMutation(
      `submission-${id}`,
      async () => {
        await submissionsApi.remove(id);
        await Promise.all([submissionsRes.reload(), reportsRes.reload()]);
      },
      "Submission deleted."
    );
  };

  const handleCreateConference = () => navigate("/create-conference");

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      {/* ----- Header ----- */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-6">
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
              Admin workspace
            </p>
            <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">
              Conference Management Tool
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
              onClick={() => setNotice((v) => !v)}
              aria-label="Toggle notifications"
              title="Notifications"
            >
              <Bell size={17} />
              {notice && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />
              )}
            </button>
            <button
              className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 sm:grid"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Sparkles size={16} />
            </button>
            <div className="ml-1 hidden items-center gap-2.5 border-l border-white/10 pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6ff] text-[10px] font-extrabold text-[#4f46c7]">
                AD
              </div>
              <div className="leading-tight">
                <strong className="block text-[11px] text-white">Admin User</strong>
                <span className="block text-[9px] text-white/45">Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ----- Main Layout: Sidebar + Content ----- */}
      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        {/* ----- Sidebar ----- */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-x-4 top-[88px] z-40 block" : "hidden"
          } w-[260px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.10)] lg:sticky lg:top-[100px] lg:block lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:shadow-none`}
          style={{ scrollbarWidth: "thin", scrollbarColor: "#c4c8d4 transparent" }}
        >
          <style>
            {`
              .lg\\:overflow-y-auto::-webkit-scrollbar { width: 4px; }
              .lg\\:overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
              .lg\\:overflow-y-auto::-webkit-scrollbar-thumb {
                background: #c4c8d4; border-radius: 999px;
              }
            `}
          </style>

          <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
              <LayoutDashboard size={17} />
            </span>
            <strong className="block text-[13px]">Admin control</strong>
            <p className="mt-1 text-[10px] leading-5 text-white/60">
              Oversee conferences, submissions, and users.
            </p>
          </div>

          <nav className="space-y-1" aria-label="Admin dashboard navigation">
            <button
              className="flex w-full items-center gap-3 rounded-xl bg-[#efedff] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#5649dc]"
              onClick={() => scrollTo("dashboard-overview")}
            >
              <LayoutDashboard size={16} /> Overview
            </button>

            <div>
              <button
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                onClick={() => toggleSection("conferences")}
              >
                <span className="flex items-center gap-3">
                  <CalendarDays size={16} /> Conferences
                </span>
                {expanded.conferences ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expanded.conferences && (
                <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                    onClick={() => scrollTo("conferences-table")}
                  >
                    All Conferences
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                    onClick={handleCreateConference}
                  >
                    Create New
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
                    Reports
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                onClick={() => toggleSection("submissions")}
              >
                <span className="flex items-center gap-3">
                  <FileText size={16} /> Submissions
                </span>
                {expanded.submissions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expanded.submissions && (
                <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                    onClick={() => scrollTo("submissions-table")}
                  >
                    All Submissions
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                    onClick={() => {
                      setStatusFilter("Under review");
                      scrollTo("submissions-table");
                    }}
                  >
                    Pending Review
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
                    Final Decisions
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                onClick={() => toggleSection("users")}
              >
                <span className="flex items-center gap-3">
                  <Users size={16} /> Users
                </span>
                {expanded.users ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expanded.users && (
                <div className="ml-6 space-y-1 border-l border-[#edf0f5] pl-3">
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
                    onClick={() => scrollTo("users-section")}
                  >
                    All Users
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
                    Reviewers
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
                    Organisers
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="my-4 border-t border-[#edf0f5]" />
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
            <UserRound size={16} /> Profile
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]">
            <Settings size={16} /> Settings
          </button>
          <button
            className="mt-auto flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] hover:bg-[#fff4f5]"
            onClick={() => navigate("/login")}
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        {/* ----- Main Content ----- */}
        <main id="dashboard-overview" className="min-w-0 flex-1 scroll-mt-24">
          {/* Feedback banner */}
          {feedback && (
            <div
              role="alert"
              className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
                feedback.type === "success"
                  ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
                  : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
              }`}
            >
              <span>{feedback.message}</span>
              <button
                onClick={() => setFeedback(null)}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss message"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Hero Card */}
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
            <div className="relative flex items-end justify-between gap-6 max-[700px]:block">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
                  <Sparkles size={14} /> Admin dashboard
                </span>
                <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">
                  Welcome, Admin.
                </h1>
                <p className="m-0 max-w-[600px] text-[12px] leading-6 text-white/65">
                  Monitor all conferences, submissions, and users from a single central hub.
                </p>
              </div>
              <button
                className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
                onClick={handleCreateConference}
              >
                <Plus size={16} /> New Conference
              </button>
            </div>
          </section>

          {/* Stats Cards */}
          <section className="mt-5 grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">
                    {stat.icon}
                  </span>
                  <span className="text-[9px] font-bold text-[#aeb6c6]">
                    {new Date().getFullYear()}
                  </span>
                </div>
                <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">
                  {stat.value}
                </strong>
                <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">{stat.label}</p>
                <span className="text-[9px] text-[#8b95a8]">{stat.note}</span>
              </article>
            ))}
          </section>

          {/* Conferences Table */}
          <section
            id="conferences-table"
            className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6 max-[700px]:block">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  Administration
                </span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                  All Conferences
                </h2>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0">
                <div className="relative flex-1 sm:w-[220px] sm:flex-none">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                    size={15}
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search conferences..."
                    className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
                  />
                </div>
                <button className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[11px] font-semibold text-[#59657d] hover:bg-[#f0f2f6]">
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Submissions</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conferencesRes.loading && (
                    <TableMessage colSpan={5}>Loading conferences…</TableMessage>
                  )}

                  {!conferencesRes.loading && conferencesRes.error && (
                    <TableMessage colSpan={5}>
                      <div className="flex flex-col items-center">
                        <span>{conferencesRes.error.message}</span>
                        <RetryButton onClick={conferencesRes.reload} />
                      </div>
                    </TableMessage>
                  )}

                  {!conferencesRes.loading &&
                    !conferencesRes.error &&
                    conferences.length === 0 && (
                      <TableMessage colSpan={5}>
                        No conferences yet. Create one to get started.
                      </TableMessage>
                    )}

                  {!conferencesRes.loading &&
                    !conferencesRes.error &&
                    conferences.map((conf) => (
                      <tr
                        key={conf.id}
                        className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                              <CalendarDays size={16} />
                            </span>
                            <div>
                              <strong className="block max-w-[270px] truncate text-[11px] text-[#1c2a4a]">
                                {confName(conf)}
                              </strong>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">
                          {confLocation(conf)}
                        </td>
                        <td className="px-4 py-4 text-[10px] text-[#7b869b]">{confDate(conf)}</td>
                        <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                          {confSubmissions(conf)}
                        </td>
                        <td className="px-6 py-4 text-right text-[10px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600 hover:bg-blue-100"
                              onClick={() => navigate(`/edit-conference/${conf.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              disabled={busy === `conference-${conf.id}`}
                              className="rounded-lg bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => handleDeleteConference(conf.id)}
                            >
                              {busy === `conference-${conf.id}` ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Submissions Table */}
          <section
            id="submissions-table"
            className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6 max-[700px]:block">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  Review oversight
                </span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                  All Submissions
                </h2>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0">
                <div className="relative flex-1 sm:w-[220px] sm:flex-none">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                    size={15}
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search submissions..."
                    className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
                  />
                </div>
                <div className="relative">
                  <Filter
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                    size={14}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] font-semibold text-[#59657d] outline-none"
                  >
                    <option>All statuses</option>
                    <option>Pending</option>
                    <option>Under review</option>
                    <option>Accepted</option>
                    <option>Rejected</option>
                    <option>Revision requested</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                    <th className="px-6 py-3">Title</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Conference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsRes.loading && (
                    <TableMessage colSpan={6}>Loading submissions…</TableMessage>
                  )}

                  {!submissionsRes.loading && submissionsRes.error && (
                    <TableMessage colSpan={6}>
                      <div className="flex flex-col items-center">
                        <span>{submissionsRes.error.message}</span>
                        <RetryButton onClick={submissionsRes.reload} />
                      </div>
                    </TableMessage>
                  )}

                  {!submissionsRes.loading &&
                    !submissionsRes.error &&
                    filteredSubmissions.map((sub) => {
                      const label = statusLabel(sub.status);
                      return (
                        <tr
                          key={sub.id}
                          className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                                <FileText size={16} />
                              </span>
                              <div>
                                <strong className="block max-w-[220px] truncate text-[11px] text-[#1c2a4a]">
                                  {subTitle(sub)}
                                </strong>
                                <span className="text-[9px] text-[#929bad]">#{sub.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">
                            {subAuthor(sub)}
                          </td>
                          <td className="px-4 py-4 text-[10px] text-[#5c6880]">
                            {subConference(sub)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                                statusStyles[label] ||
                                "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              {label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[10px] font-semibold">
                            {subDecision(sub)}
                          </td>
                          <td className="px-6 py-4 text-right text-[10px]">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600 hover:bg-blue-100"
                                onClick={() => navigate(`/edit-submission/${sub.id}`)}
                              >
                                Edit
                              </button>
                              <button
                                disabled={busy === `submission-${sub.id}`}
                                className="rounded-lg bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => handleDeleteSubmission(sub.id)}
                              >
                                {busy === `submission-${sub.id}` ? "Deleting…" : "Delete"}
                              </button>
                              <button
                                className="rounded-lg bg-indigo-50 px-2 py-1 text-indigo-600 hover:bg-indigo-100"
                                onClick={() => navigate(`/assign-reviewers/${sub.id}`)}
                              >
                                Assign
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {!submissionsRes.loading &&
                !submissionsRes.error &&
                filteredSubmissions.length === 0 && (
                  <div className="p-10 text-center">
                    <Search size={20} className="mx-auto text-[#aeb6c6]" />
                    <h3 className="mb-1 mt-3 text-[13px] font-bold">No submissions found</h3>
                    <p className="m-0 text-[10px] text-[#8993a6]">
                      Try adjusting your search or filter.
                    </p>
                  </div>
                )}
            </div>
          </section>

          {/* Users Quick View */}
          <section
            id="users-section"
            className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
                  People
                </span>
                <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
                  Registered Users
                </h2>
              </div>
              <button
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#6655f6] hover:underline"
                onClick={() => navigate("/users")}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            {usersRes.loading && (
              <p className="mt-4 text-[11px] text-[#8993a6]">Loading users…</p>
            )}

            {!usersRes.loading && usersRes.error && (
              <div className="mt-4 flex flex-col items-start text-[11px] text-[#b13a3a]">
                <span>{usersRes.error.message}</span>
                <RetryButton onClick={usersRes.reload} />
              </div>
            )}

            {!usersRes.loading && !usersRes.error && users.length === 0 && (
              <p className="mt-4 text-[11px] text-[#8993a6]">No users found.</p>
            )}

            {!usersRes.loading && !usersRes.error && users.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {users.slice(0, 8).map((user) => {
                  const name = userName(user);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl border border-[#edf0f5] p-3"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="block text-[11px]">{name}</strong>
                        <span className="text-[9px] text-[#8a95a8] capitalize">
                          {user.role ?? "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ----- FOOTER ----- */}
      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <LogoFallback />
            <p className="mt-1 text-[9px] text-white/45">Conference Management Tool</p>
          </div>
          <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Footer logo ---------- */
function LogoFallback() {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
      <div className="flex flex-col leading-[1.05]">
        <strong className="text-xl tracking-[-.04em]">CMT</strong>
        <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">
          Conference Management Tool
        </span>
      </div>
    </div>
  );
}