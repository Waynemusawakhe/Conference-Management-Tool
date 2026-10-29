import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  Compass,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  TicketCheck,
  Users,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import AttendeeHeader from "../components/AttendeeHeader";
import AttendeeSidebar from "../components/AttendeeSidebar";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";

const REGISTRATION_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  registered: "Registered",
  approved: "Approved",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  rejected: "Rejected",
  completed: "Completed",
};

const REGISTRATION_STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  confirmed: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  registered: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  approved: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  cancelled: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
  canceled: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  completed: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
};

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return (
    (Array.isArray(first) ? first[0] : first) ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function unwrapOne(r) {
  return r?.data?.data ?? r?.data ?? r;
}

function normalizeStatus(value) {
  return String(value ?? "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatDate(value, fallback = "Date not set") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function conferenceName(conference) {
  return conference?.name ?? conference?.title ?? "Conference";
}

function conferenceStartDate(conference) {
  return conference?.start_date ?? conference?.starts_at ?? conference?.date ?? null;
}

function conferenceEndDate(conference) {
  return conference?.end_date ?? conference?.ends_at ?? null;
}

function formatLabel(v) {
  return { in_person: "In-person", virtual: "Virtual", hybrid: "Hybrid" }[v] || v;
}

function registrationConference(registration, conferences) {
  if (registration?.conference) return registration.conference;
  const conferenceId = registration?.conference_id ?? registration?.conferenceId ?? null;
  return conferences.find((c) => String(c.id) === String(conferenceId));
}

function isFutureConference(conference) {
  const value = conferenceStartDate(conference);
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= new Date().setHours(0, 0, 0, 0);
}

function isPastConference(conference) {
  const value = conferenceStartDate(conference);
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < new Date().setHours(0, 0, 0, 0);
}

function ConfirmModal({ open, title, message, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
        <div className="flex items-start gap-4 p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-extrabold leading-tight text-[#0d1b3d]">
              {title}
            </h2>
            {message && (
              <p className="mt-2 text-[12px] leading-6 text-[#66728b]">
                {message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#9aa3b2] transition hover:bg-[#f1f2f6] hover:text-[#5c6880] disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#edf0f5] bg-[#fafbfe] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#59657d] transition hover:bg-[#f5f6fa] disabled:opacity-50"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#e11d48] to-[#be123c] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(225,29,72,.28)] transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Cancelling...
              </>
            ) : (
              "Yes, cancel it"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConferenceDetailModal({
  open,
  conference,
  myRegistration,
  onClose,
  onRegistered,
}) {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [localRegistration, setLocalRegistration] = useState(myRegistration);

  useEffect(() => {
    setLocalRegistration(myRegistration);
  }, [myRegistration]);

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  if (!open || !conference) return null;

  const registered =
    localRegistration &&
    !["cancelled", "canceled", "rejected"].includes(
      String(localRegistration.status || "registered").toLowerCase(),
    );

  const handleRegister = async () => {
    if (!conference?.id) return;
    setRegistering(true);
    setError("");
    try {
      const res = await registrationsApi.create({
        conference_id: Number(conference.id),
      });
      const created = unwrapOne(res);
      setLocalRegistration(created);
      onRegistered?.(created);
    } catch (err) {
      setError(err?.message || "Unable to register. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white sm:p-7">
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#b9b3ff]">
                <TicketCheck size={13} />
                {conference.code || "CONFERENCE"}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <h2 className="mt-3 text-[clamp(20px,2.6vw,28px)] font-extrabold leading-tight tracking-[-.03em]">
              {conference.name}
            </h2>

            {conference.category && (
              <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white/80">
                {conference.category}
              </span>
            )}

            <p className="mt-4 max-w-[600px] text-[12px] leading-6 text-white/70">
              {conference.description || "No description provided."}
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                {formatDate(conference.start_date)} — {formatDate(conference.end_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />
                {[conference.city, conference.country].filter(Boolean).join(", ") || "Location TBA"}
              </span>
              {conference.format && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} /> {formatLabel(conference.format)}
                </span>
              )}
              {conference.website_link && (
                <a
                  href={conference.website_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#b9b3ff] hover:underline"
                >
                  <Globe2 size={13} /> Website <ExternalLink size={11} />
                </a>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-[11px] font-semibold text-white">
                {error}
              </p>
            )}

            <div className="mt-6">
              {registered ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-4 py-2.5 text-[11px] font-extrabold text-[#18794e]">
                  <CheckCircle2 size={15} /> You are registered
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={registering}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-60"
                >
                  {registering ? <Loader2 size={14} className="animate-spin" /> : <TicketCheck size={14} />}
                  {registering ? "Registering…" : "Register to Attend"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-[#6655f6]">
              Event details
            </h3>
            <dl className="mt-3 grid gap-2 text-[11px]">
              <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                <dt className="font-semibold text-[#66728b]">Start</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">{formatDate(conference.start_date)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                <dt className="font-semibold text-[#66728b]">End</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">{formatDate(conference.end_date)}</dd>
              </div>
              {conference.submission_deadline && (
                <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                  <dt className="font-semibold text-[#66728b]">Deadline</dt>
                  <dd className="text-right font-bold text-[#0d1b3d]">{formatDate(conference.submission_deadline)}</dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                <dt className="font-semibold text-[#66728b]">Format</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">{formatLabel(conference.format) || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                <dt className="font-semibold text-[#66728b]">Venue</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">{conference.venue_name || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-semibold text-[#66728b]">Location</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">
                  {[conference.city, conference.country].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-[#6655f6]">Topics</h3>
            {Array.isArray(conference.topics) && conference.topics.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {conference.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#e2e6ee] bg-white px-2.5 py-1 text-[10px] font-bold text-[#59657d]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-[#8993a6]">No topics listed.</p>
            )}

            {conference.organiser && (
              <>
                <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-[#6655f6]">
                  Organised by
                </h3>
                <p className="mt-2 text-[11px] font-bold text-[#0d1b3d]">
                  {conference.organiser.name || "—"}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-[#edf0f5] bg-[#fafbfe] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#59657d] transition hover:bg-[#f5f6fa]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [registrations, setRegistrations] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [viewConference, setViewConference] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [registrationResponse, conferenceResponse] = await Promise.all([
        registrationsApi.getAll({ per_page: 100 }),
        conferencesApi.getAll({ per_page: 100 }),
      ]);
      setRegistrations(unwrapList(registrationResponse));
      setConferences(unwrapList(conferenceResponse));
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.pathname === "/attendee-dashboard") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const displayName = user?.name || "Attendee";

  const conferencesById = useMemo(() => {
    const map = new Map();
    conferences.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [conferences]);

  const registrationRows = useMemo(() => {
    return registrations.map((registration) => {
      const conference = registrationConference(registration, conferences);
      return {
        ...registration,
        resolvedConference: conference,
        normalizedStatus: normalizeStatus(registration.status),
      };
    });
  }, [registrations, conferences]);

  const filteredRegistrations = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = registrationRows;
    if (filter === "upcoming") list = list.filter((r) => isFutureConference(r.resolvedConference));
    else if (filter === "past") list = list.filter((r) => isPastConference(r.resolvedConference));
    if (!q) return list;
    return list.filter((registration) => {
      const conference = registration.resolvedConference;
      return [registration.id, registration.reference, registration.registration_code, conferenceName(conference), registration.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [registrationRows, query, filter]);

  const upcomingRegistrations = useMemo(() => {
    return registrationRows
      .filter((registration) => {
        const status = registration.normalizedStatus;
        if (["cancelled", "canceled", "rejected"].includes(status)) return false;
        return isFutureConference(registration.resolvedConference);
      })
      .sort((a, b) => {
        const aDate = new Date(conferenceStartDate(a.resolvedConference) || 0).getTime();
        const bDate = new Date(conferenceStartDate(b.resolvedConference) || 0).getTime();
        return aDate - bDate;
      })
      .slice(0, 4);
  }, [registrationRows]);

  const confirmedCount = useMemo(
    () =>
      registrationRows.filter((registration) =>
        ["confirmed", "registered", "approved"].includes(registration.normalizedStatus),
      ).length,
    [registrationRows],
  );

  const stats = useMemo(
    () => [
      { icon: <TicketCheck size={19} />, value: registrationRows.length, label: "My registrations", note: "Conference registrations" },
      { icon: <CircleCheckBig size={19} />, value: confirmedCount, label: "Confirmed", note: "Ready to attend" },
      { icon: <CalendarCheck2 size={19} />, value: upcomingRegistrations.length, label: "Upcoming", note: "Future conferences" },
      { icon: <Compass size={19} />, value: conferences.length, label: "Available conferences", note: "Browse opportunities" },
    ],
    [registrationRows.length, confirmedCount, upcomingRegistrations.length, conferences.length],
  );

  const performCancel = async () => {
    if (!cancelTarget?.id) return;
    setBusyRegistrationId(cancelTarget.id);
    setFeedback("");
    setError("");
    try {
      await registrationsApi.remove(cancelTarget.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== cancelTarget.id));
      setFeedback("Registration cancelled successfully.");
      setCancelTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setCancelTarget(null);
    } finally {
      setBusyRegistrationId(null);
    }
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <AttendeeHeader
        name={displayName}
        menuOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((value) => !value)}
      />

      <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
        <AttendeeSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="attendee-overview" className="min-w-0 flex-1 scroll-mt-24">
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
                  <Sparkles size={14} /> Attendee dashboard
                </span>
                <h1 className="mb-2 mt-3 text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">
                  Welcome, {displayName.split(" ")[0]}.
                </h1>
                <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
                  Keep track of the conferences you are attending and discover your next event from one workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/conferences")}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px sm:w-auto"
              >
                <Compass size={16} /> Browse conferences
              </button>
            </div>
          </section>

          {feedback && (
            <div role="status" className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e]">
              <span>{feedback}</span>
              <button type="button" onClick={() => setFeedback("")} aria-label="Dismiss"><X size={15} /></button>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
              <button type="button" onClick={loadData} className="font-extrabold underline">Retry</button>
            </div>
          )}

          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-[17px] border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,28,65,.04)]">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#efedff] text-[#5c50ec]">{stat.icon}</span>
                <strong className="mt-4 block text-[25px] leading-none tracking-[-.04em]">{loading ? "—" : stat.value}</strong>
                <p className="mb-0 mt-1.5 text-[11px] font-bold text-[#35415f]">{stat.label}</p>
                <span className="text-[9px] text-[#8b95a8]">{stat.note}</span>
              </article>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.035)] sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Coming up</span>
                  <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">Upcoming conferences</h2>
                </div>
                <CalendarDays size={19} className="text-[#6a5af2]" />
              </div>

              {loading ? (
                <p className="m-0 text-xs text-[#8a95a8]">Loading upcoming conferences...</p>
              ) : upcomingRegistrations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dfe4ed] bg-[#fafbfe] p-6 text-center">
                  <CalendarDays size={22} className="mx-auto text-[#a9b1c0]" />
                  <p className="mb-0 mt-3 text-xs font-bold text-[#536079]">No upcoming registered conferences.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/conferences")}
                    className="mt-4 rounded-xl bg-[#efedff] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7]"
                  >
                    Browse conferences
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingRegistrations.map((registration) => {
                    const conference = registration.resolvedConference;
                    return (
                      <button
                        key={registration.id}
                        type="button"
                        onClick={() => conference && setViewConference(conference)}
                        className="flex w-full items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-[#fafbfe] p-3 text-left transition hover:border-[#dcd9ff] hover:bg-[#f8f7ff]"
                      >
                        <div className="grid h-11 w-14 shrink-0 place-items-center rounded-[10px] bg-[#efedff] px-1 text-center">
                          <strong className="text-[9px] font-extrabold text-[#5649dc]">{formatDate(conferenceStartDate(conference), "TBA")}</strong>
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-[11px] text-[#1c2a4a]">{conferenceName(conference)}</strong>
                          <span className="text-[9px] text-[#8a95a8]">{conference?.city || conference?.venue || "Conference details"}</span>
                        </div>
                        <ChevronRight size={15} className="text-[#a7afbd]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-[20px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-6 text-white shadow-[0_18px_45px_rgba(20,28,80,.15)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Compass size={18} /></span>
              <h2 className="mb-2 mt-5 text-[20px] font-bold tracking-[-.03em]">Find your next conference</h2>
              <p className="m-0 text-[10px] leading-6 text-white/60">
                Explore available conferences, review dates and choose the events you want to attend.
              </p>
              <button
                type="button"
                onClick={() => navigate("/conferences")}
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[10px] font-extrabold text-white hover:bg-white/[.14]"
              >
                Browse conferences <ChevronRight size={14} />
              </button>
            </article>
          </section>

          <section id="my-registrations" className="mt-6 scroll-mt-24 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
            <div className="flex flex-col gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Attendance</span>
                  <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">My registrations</h2>
                </div>
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search registrations..."
                    className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-4 py-2 text-[10px] font-extrabold transition ${
                      filter === f.key
                        ? "bg-[#6655f6] text-white shadow-[0_8px_20px_rgba(103,87,245,.25)]"
                        : "border border-[#e2e6ee] bg-white text-[#59657d] hover:bg-[#f5f6fa]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">Loading your registrations...</div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center">
                <TicketCheck size={22} className="mx-auto text-[#aeb6c6]" />
                <h3 className="mb-1 mt-3 text-[13px] font-bold">No registrations found</h3>
                <p className="m-0 text-[10px] text-[#8993a6]">Browse conferences and register for an event to see it here.</p>
                <button
                  type="button"
                  onClick={() => navigate("/conferences")}
                  className="mt-4 rounded-xl bg-[#efedff] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7]"
                >
                  Browse conferences
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                        <th className="px-6 py-3">Conference</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((registration) => {
                        const conference = registration.resolvedConference;
                        const status = registration.normalizedStatus;
                        const canCancel = !["cancelled", "canceled", "rejected", "completed"].includes(status);
                        return (
                          <tr key={registration.id} className="border-b border-[#f0f2f6] last:border-0 hover:bg-[#fbfbfe]">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                                  <CalendarDays size={16} />
                                </span>
                                <div>
                                  <strong className="block max-w-[300px] truncate text-[11px] text-[#1c2a4a]">
                                    {conferenceName(conference)}
                                  </strong>
                                  <span className="text-[9px] text-[#929bad]">Registration #{registration.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[10px] text-[#7b869b]">
                              {formatDate(conferenceStartDate(conference))}
                              {conferenceEndDate(conference) ? ` – ${formatDate(conferenceEndDate(conference))}` : ""}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                                REGISTRATION_STATUS_STYLES[status] || REGISTRATION_STATUS_STYLES.pending
                              }`}>
                                {REGISTRATION_STATUS_LABELS[status] || registration.status || "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => conference && setViewConference(conference)}
                                  disabled={!conference}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-bold text-[#5548d7] hover:bg-[#e4e1ff] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Eye size={12} /> View
                                </button>
                                {canCancel && (
                                  <button
                                    type="button"
                                    disabled={busyRegistrationId === registration.id}
                                    onClick={() => setCancelTarget(registration)}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
                                  >
                                    {busyRegistrationId === registration.id ? "Cancelling..." : "Cancel"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[#edf0f5] md:hidden">
                  {filteredRegistrations.map((registration) => {
                    const conference = registration.resolvedConference;
                    const status = registration.normalizedStatus;
                    const canCancel = !["cancelled", "canceled", "rejected", "completed"].includes(status);
                    return (
                      <article key={registration.id} className="p-4">
                        <div className="flex gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                            <CalendarDays size={17} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <strong className="block text-[11px] text-[#1c2a4a]">{conferenceName(conference)}</strong>
                            <p className="mb-2 mt-1 text-[9px] text-[#8c96a9]">{formatDate(conferenceStartDate(conference))}</p>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                              REGISTRATION_STATUS_STYLES[status] || REGISTRATION_STATUS_STYLES.pending
                            }`}>
                              {REGISTRATION_STATUS_LABELS[status] || registration.status || "Pending"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => conference && setViewConference(conference)}
                            disabled={!conference}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-bold text-[#5548d7] disabled:opacity-50"
                          >
                            <Eye size={12} /> View
                          </button>
                          {canCancel && (
                            <button
                              type="button"
                              disabled={busyRegistrationId === registration.id}
                              onClick={() => setCancelTarget(registration)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 disabled:opacity-50"
                            >
                              {busyRegistrationId === registration.id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 py-8 text-[9px] text-[#8c96a9]">
            <span>CMT Attendee Workspace</span>
            <span>Registration permissions are enforced by the backend.</span>
          </footer>
        </main>
      </div>

      <ConfirmModal
        open={!!cancelTarget}
        title="Are you sure?"
        message={
          cancelTarget
            ? `Do you want to cancel your registration for "${conferenceName(cancelTarget.resolvedConference)}"?`
            : ""
        }
        busy={!!busyRegistrationId}
        onConfirm={performCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConferenceDetailModal
        open={!!viewConference}
        conference={viewConference}
        myRegistration={
          viewConference
            ? registrationRows.find(
                (r) => String(r.resolvedConference?.id) === String(viewConference.id),
              )
            : null
        }
        onClose={() => setViewConference(null)}
      />
    </div>
  );
}