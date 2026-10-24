import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  FileCheck2,
  FileText,
  Inbox,
  LayoutDashboard,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { usersApi } from "../api/usersApi";
import { reportsApi } from "../api/reportsApi";
import { contactMessagesApi } from "../api/contactMessagesApi";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
};

const STATUS_STYLES = {
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

const MESSAGE_STATUS = {
  new: { label: "New", className: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]" },
  in_progress: { label: "In progress", className: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]" },
  resolved: { label: "Resolved", className: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]" },
};

function statusKey(raw) {
  if (!raw) return "pending";
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function statusLabel(raw) {
  return STATUS_LABELS[statusKey(raw)] ?? String(raw ?? "—");
}
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

const confName = (c) => c.name ?? c.title ?? `Conference #${c.id}`;
const subTitle = (s) => s.title ?? s.name ?? `Submission #${s.id}`;
const subAuthor = (s) => s.author?.name ?? s.author_name ?? s.user?.name ?? "—";
const userName = (u) => u.name ?? u.full_name ?? `User #${u.id}`;

function CountUp({ value, animate, delay = 0 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return undefined;
    }

    let frameId;
    const delayId = window.setTimeout(() => {
      let startTime;
      const tick = (now) => {
        if (startTime === undefined) startTime = now;
        const progress = Math.min((now - startTime) / 1200, 1);
        setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frameId = window.requestAnimationFrame(tick);
      };
      frameId = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(delayId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [target, animate, delay]);

  return <>{shown.toLocaleString()}</>;
}

function HoverTile({ as: Element = "article", children, className = "", contentClassName = "", style, onClick, ariaLabel }) {
  const isButton = Element === "button";

  return (
    <Element
      type={isButton ? "button" : undefined}
      onClick={onClick}
      tabIndex={isButton ? undefined : 0}
      aria-label={ariaLabel}
      className={`cmt-hover-tile group relative isolate ${className}`}
      style={style}
    >
      <span aria-hidden="true" className="cmt-hover-tile__fill" />
      <span className={`cmt-hover-tile__surface ${contentClassName}`}>{children}</span>
      <span aria-hidden="true" className="cmt-hover-tile__arrow">→</span>
    </Element>
  );
}

function StatCard({ icon, value, label, note, tint, loading, intro, index }) {
  return (
    <HoverTile
      className={`cmt-dashboard-summary-tile rounded-[18px] border border-[#e4e8f0] bg-white shadow-[0_10px_28px_rgba(15,28,65,.04)] ${intro ? "admin-intro-card" : ""}`}
      contentClassName="cmt-stat-tile p-5"
      style={intro ? { "--intro-delay": `${1180 + index * 90}ms` } : undefined}
      ariaLabel={`${label}: ${loading ? "loading" : value}`}
    >
      <div className="cmt-hover-tile__icon-row flex items-start justify-between">
        <span className={`cmt-hover-tile__icon grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
          {icon}
        </span>
        <TrendingUp size={13} className="cmt-hover-tile__trend text-[#dfe4ed] opacity-0 transition group-hover:opacity-100" />
      </div>
      <strong className="cmt-hover-tile__number mt-4 block text-[28px] leading-none font-bold tracking-[-.04em] text-[#1c2a4a]">
        {loading ? "…" : value == null ? "—" : <CountUp value={value} animate={intro} delay={1300 + index * 90} />}
      </strong>
      <p className="cmt-hover-tile__title m-0 mt-2 text-[11px] font-bold text-[#35415f]">{label}</p>
      {note && <span className="cmt-hover-tile__description mt-0.5 block text-[9px] text-[#8b95a8]">{note}</span>}
    </HoverTile>
  );
}

function QuickTile({ icon, label, tint, count, loading, onClick, intro, index }) {
  return (
    <button
      onClick={onClick}
      className={`group cmt-dashboard-manage-tile cmt-manage-hover relative isolate w-full rounded-[16px] border border-[#e4e8f0] bg-white text-left shadow-[0_6px_18px_rgba(15,28,65,.03)] ${intro ? "admin-intro-card" : ""}`}
      style={intro ? { "--intro-delay": `${1760 + index * 90}ms` } : undefined}
    >
      <span className="cmt-manage-hover__surface flex items-center gap-3 p-4">
        <span className={`cmt-manage-hover__icon grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="cmt-manage-hover__title block truncate text-[12px] font-bold text-[#1c2a4a]">{label}</strong>
          <span className="mt-0.5 block text-[10px] text-[#8a95a8]">
            {loading ? "…" : count === "unavailable" ? "Unavailable" : count != null ? `${count} total` : "Open"}
          </span>
        </span>
        <ChevronRight size={16} className="cmt-manage-hover__chevron shrink-0 text-[#c4c8d4]" />
      </span>
    </button>
  );
}

function RecentRow({ primary, secondary, meta, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cmt-admin-list-card group flex w-full items-center gap-3 border-b border-[#f2f4f9] px-5 py-3.5 text-left transition last:border-0 hover:bg-[#fafbff]"
    >
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-[12px] font-semibold text-[#1c2a4a]">{primary}</strong>
        {secondary && (
          <span className="mt-0.5 block truncate text-[10px] text-[#8a95a8]">{secondary}</span>
        )}
      </div>
      {badge}
      {meta && <span className="shrink-0 text-[9px] font-semibold text-[#aeb6c6]">{meta}</span>}
      <ChevronRight size={14} className="shrink-0 text-[#c4c8d4] transition group-hover:translate-x-0.5 group-hover:text-[#5c50ec]" />
    </button>
  );
}

function RecentEmpty({ message, onRetry }) {
  return (
    <div className="cmt-admin-state flex flex-col items-center gap-2.5 px-5 py-9 text-center text-[11px] text-[#8993a6]" role={onRetry ? "alert" : "status"}>
      <span className="cmt-admin-state__icon grid h-10 w-10 place-items-center rounded-2xl bg-[#efedff] text-[#5b4fe3]">
        <Inbox size={18} strokeWidth={1.8} />
      </span>
      <span className="max-w-[320px] leading-5">{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-lg bg-[#efedff] px-4 text-[11px] font-extrabold text-[#5548d7] hover:bg-[#e5e2ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6]">Retry</button>}
    </div>
  );
}

function RecentLoading({ rows = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[#f2f4f9] px-5 py-3.5 last:border-0">
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-24 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#eef1f7]" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.name || user?.full_name || "Admin";
  const [intro, setIntro] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntro(false);
      return undefined;
    }
    const timeout = window.setTimeout(() => setIntro(false), 2900);
    return () => window.clearTimeout(timeout);
  }, []);

  const conferencesRes = useApiResource(() => conferencesApi.getAll(), []);
  const submissionsRes = useApiResource(() => submissionsApi.getAll(), []);
  const usersRes = useApiResource(() => usersApi.getAll(), []);
  const reportsRes = useApiResource(() => reportsApi.dashboard(), []);
  const messagesRes = useApiResource(() => contactMessagesApi.getAll(), []);

  const conferences = useMemo(() => toArray(conferencesRes.data), [conferencesRes.data]);
  const submissions = useMemo(() => toArray(submissionsRes.data), [submissionsRes.data]);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);
  const messages = useMemo(() => toArray(messagesRes.data), [messagesRes.data]);
  const dashboard = reportsRes.data?.data ?? reportsRes.data ?? null;

  const stats = useMemo(
    () => [
      {
        icon: <CalendarDays size={17} />,
        tint: "bg-[#efedff] text-[#4f46c7]",
        value: pickNumber(dashboard?.total_conferences),
        label: "Conferences",
        note: "On the platform",
      },
      {
        icon: <FileText size={17} />,
        tint: "bg-[#eef5fd] text-[#1d5fa8]",
        value: pickNumber(dashboard?.total_submissions),
        label: "Submissions",
        note: "All conferences",
      },
      {
        icon: <Users size={17} />,
        tint: "bg-[#effaf4] text-[#18794e]",
        value: pickNumber(dashboard?.total_users),
        label: "Users",
        note: "Across every role",
      },
      {
        icon: <FileCheck2 size={17} />,
        tint: "bg-[#fff6ee] text-[#a55b25]",
        value: pickNumber(dashboard?.accepted_submissions),
        label: "Accepted",
        note: "Ready for publication",
      },
    ],
    [dashboard]
  );

  const recentSubmissions = useMemo(() => submissions.slice(0, 5), [submissions]);
  const recentMessages = useMemo(() => messages.slice(0, 5), [messages]);

  const quickLinks = [
    {
      label: "Conferences",
      to: "/admin/conferences",
      icon: <CalendarDays size={17} />,
      tint: "bg-[#efedff] text-[#4f46c7]",
      count: conferences.length,
      loading: conferencesRes.loading,
      error: conferencesRes.error,
    },
    {
      label: "Users",
      to: "/users",
      icon: <Users size={17} />,
      tint: "bg-[#effaf4] text-[#18794e]",
      count: users.length,
      loading: usersRes.loading,
      error: usersRes.error,
    },
    {
      label: "Contact Messages",
      to: "/admin/contact-messages",
      icon: <Mail size={17} />,
      tint: "bg-[#eef5fd] text-[#1d5fa8]",
      count: messages.length,
      loading: messagesRes.loading,
      error: messagesRes.error,
    },
    {
      label: "Reports",
      to: "/admin/reports",
      icon: <BarChart3 size={17} />,
      tint: "bg-[#fff6ee] text-[#a55b25]",
      count: null,
      loading: false,
    },
  ];

  return (
    <AdminLayout entranceAnimation={intro}>
      <section className={`relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8 ${intro ? "admin-intro-card" : ""}`} style={intro ? { "--intro-delay": "1040ms" } : undefined}>
        <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
              <LayoutDashboard size={14} /> Admin overview
            </span>
            <h1 className="mb-2 mt-3 text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-[-.045em]">
              Welcome back, {displayName}.
            </h1>
            <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
              A snapshot of everything happening across the CMT platform right now.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/reports")}
            className="mt-5 w-full shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-[12px] font-extrabold text-white transition hover:-translate-y-px hover:border-[#10b981] hover:bg-[#10b981] sm:w-auto"
          >
            <BarChart3 size={16} /> Open Reports
          </button>
        </div>
      </section>

      {reportsRes.loading ? (
        <section aria-label="Loading dashboard totals" aria-busy="true" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => <div key={stat.label} className="h-[132px] animate-pulse rounded-[18px] border border-[#e4e8f0] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]"><div className="h-10 w-10 rounded-xl bg-[#eef1f7] dark:bg-[#1e293b]" /><div className="mt-4 h-7 w-20 rounded bg-[#eef1f7] dark:bg-[#1e293b]" /><div className="mt-2 h-3 w-24 rounded bg-[#eef1f7] dark:bg-[#1e293b]" /></div>)}
        </section>
      ) : reportsRes.error ? (
        <section role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f1c8c8] bg-[#fff2f2] px-5 py-4 text-[12px] font-semibold text-[#9f3030] dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]">
          <span>Dashboard totals could not be loaded: {reportsRes.error.message}</span>
          <button type="button" onClick={reportsRes.reload} className="min-h-11 rounded-lg bg-white px-4 text-[11px] font-extrabold text-[#9f3030] shadow-sm hover:bg-[#fff8f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:bg-[#3a1515] dark:text-[#f08a9a]">Retry</button>
        </section>
      ) : (
        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => <StatCard key={stat.label} icon={stat.icon} tint={stat.tint} value={stat.value} label={stat.label} note={stat.note} intro={intro} index={index} />)}
        </section>
      )}

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={`overflow-hidden rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] lg:col-span-2 ${intro ? "admin-intro-card" : ""}`} style={intro ? { "--intro-delay": "1580ms" } : undefined}>
          <header className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <FileText size={14} />
              </span>
              <h2 className="m-0 text-[15px] font-bold tracking-[-.02em]">Recent submissions</h2>
            </div>
            {submissions.length > recentSubmissions.length && (
              <span className="text-[10px] font-semibold text-[#8a95a8]">
                Latest {recentSubmissions.length} of {submissions.length}
              </span>
            )}
          </header>

          {submissionsRes.loading ? (
            <RecentLoading />
          ) : submissionsRes.error ? (
            <RecentEmpty message={submissionsRes.error.message} onRetry={submissionsRes.reload} />
          ) : recentSubmissions.length === 0 ? (
            <RecentEmpty message="No submissions yet." />
          ) : (
            recentSubmissions.map((sub) => {
              const label = statusLabel(sub.status);
              return (
                <RecentRow
                  key={sub.id}
                  primary={subTitle(sub)}
                  secondary={`${subAuthor(sub)} · #${sub.id}`}
                  badge={
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
                        STATUS_STYLES[label] ?? "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                  }
                  meta={formatDate(sub.created_at ?? sub.submitted_at)}
                  onClick={() => navigate("/admin/submissions")}
                />
              );
            })
          )}
        </div>

        <div className={`overflow-hidden rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] ${intro ? "admin-intro-card" : ""}`} style={intro ? { "--intro-delay": "1670ms" } : undefined}>
          <header className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] text-white shadow-[0_8px_18px_-6px_rgba(14,165,233,.55)]">
                <Mail size={14} />
              </span>
              <h2 className="m-0 text-[15px] font-bold tracking-[-.02em]">Inbox</h2>
            </div>
            <button
              onClick={() => navigate("/admin/contact-messages")}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#6655f6] hover:underline"
            >
              Open <ChevronRight size={12} />
            </button>
          </header>

          {messagesRes.loading ? (
            <RecentLoading rows={5} />
          ) : messagesRes.error ? (
            <RecentEmpty message={messagesRes.error.message} onRetry={messagesRes.reload} />
          ) : recentMessages.length === 0 ? (
            <RecentEmpty message="Inbox is empty." />
          ) : (
            recentMessages.map((m) => {
              const key = statusKey(m.status ?? "new");
              const meta = MESSAGE_STATUS[key] ?? MESSAGE_STATUS.new;
              return (
                <RecentRow
                  key={m.id}
                  primary={m.name ?? "—"}
                  secondary={m.email ?? "—"}
                  badge={
                    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${meta.className}`}>
                      {meta.label}
                    </span>
                  }
                  meta={formatDate(m.created_at)}
                  onClick={() => navigate(`/admin/contact-messages/${m.id}`)}
                />
              );
            })
          )}
        </div>
      </section>

      <section className="mt-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-[15px] font-bold tracking-[-.02em]">Manage</h2>
          <span className="text-[10px] font-semibold text-[#8a95a8]">Jump to a section</span>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q, index) => (
            <QuickTile
              key={q.label}
              icon={q.icon}
              tint={q.tint}
              label={q.label}
              count={q.error ? "unavailable" : q.count}
              loading={q.loading}
              onClick={() => navigate(q.to)}
              intro={intro}
              index={index}
            />
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
