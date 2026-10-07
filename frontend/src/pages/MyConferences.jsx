import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  MapPin,
  Search,
  TicketCheck,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoleChrome from "../components/RoleChrome";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";
import { collectPages } from "../utils/pagination";
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

function normalizeStatus(value) {
  return String(value ?? "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function dateLabel(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function conferenceName(conference) {
  return conference?.name ?? conference?.title ?? "Conference details pending";
}

function conferenceStartDate(conference) {
  return conference?.start_date ?? conference?.starts_at ?? conference?.date ?? null;
}

function isPastConference(conference) {
  const value = conferenceStartDate(conference);
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < new Date().setHours(0, 0, 0, 0);
}

function formatLabel(v) {
  return { in_person: "In-person", virtual: "Virtual", hybrid: "Hybrid" }[v] || v;
}

function unwrapOne(r) {
  return r?.data?.data ?? r?.data ?? r;
}

function unwrapList(r) {
  return Array.isArray(r) ? r : r?.data?.data ?? r?.data ?? [];
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
                {dateLabel(conference.start_date)} — {dateLabel(conference.end_date)}
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
                <dd className="text-right font-bold text-[#0d1b3d]">{dateLabel(conference.start_date)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                <dt className="font-semibold text-[#66728b]">End</dt>
                <dd className="text-right font-bold text-[#0d1b3d]">{dateLabel(conference.end_date)}</dd>
              </div>
              {conference.submission_deadline && (
                <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] pb-2">
                  <dt className="font-semibold text-[#66728b]">Deadline</dt>
                  <dd className="text-right font-bold text-[#0d1b3d]">{dateLabel(conference.submission_deadline)}</dd>
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

export default function MyConferences() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState(null);
  const [viewConference, setViewConference] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [registrationList, conferenceList, submissionList, reviewList] =
        await Promise.all([
          collectPages(registrationsApi.getAll, { user_id: user?.id }),
          ["organiser", "admin"].includes(user?.role)
            ? collectPages(conferencesApi.getAll)
            : Promise.resolve([]),
          user?.role === "author" ? collectPages(submissionsApi.getAll) : Promise.resolve([]),
          user?.role === "reviewer" ? collectPages(reviewsApi.getAll) : Promise.resolve([]),
        ]);

      const knownIds = new Set(conferenceList.map((c) => String(c.id)));
      const relatedIds = [
        ...new Set(
          reviewList
            .map((review) => review.submission?.conference_id)
            .filter((id) => id != null && !knownIds.has(String(id))),
        ),
      ];
      const missingConferences = relatedIds.length
        ? await Promise.all(
            relatedIds.map(async (id) => {
              try {
                const response = await conferencesApi.getById(id);
                return unwrapOne(response);
              } catch {
                return null;
              }
            }),
          ).then((list) => list.filter(Boolean))
        : [];

      setRegistrations(registrationList);
      setConferences([...conferenceList, ...missingConferences]);
      setSubmissions(submissionList);
      setReviews(reviewList);
    } catch (requestError) {
      if (requestError?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(requestError?.message || "Unable to load your conferences.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, user?.role, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const conferencesById = useMemo(() => {
    const map = new Map();
    conferences.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [conferences]);

  const registrationRows = useMemo(() => {
    return registrations
      .map((registration) => {
        const conferenceId = registration.conference_id ?? registration.conference?.id;
        const conference =
          registration.conference ?? conferencesById.get(String(conferenceId));
        return {
          ...registration,
          resolvedConference: conference,
          normalizedStatus: normalizeStatus(registration.status),
        };
      })
      .filter((registration) => {
        const registrationUserId = registration.user_id ?? registration.user?.id ?? registration.attendee_id;
        return registrationUserId == null || Number(registrationUserId) === Number(user?.id);
      });
  }, [registrations, conferencesById, user?.id]);

  const relationshipRows = useMemo(() => {
    const groups = new Map();
    const add = (conference, id, relationship, status, extra = {}) => {
      if (id == null) return;
      const key = String(id);
      const row = groups.get(key) || {
        id: key,
        resolvedConference: conference,
        relationships: [],
        normalizedStatus: "confirmed",
        attendingRegistration: null,
      };
      if (!row.resolvedConference && conference) row.resolvedConference = conference;
      const label = `${relationship}${status ? ` (${REGISTRATION_STATUS_LABELS[status] || status})` : ""}`;
      if (!row.relationships.includes(label)) row.relationships.push(label);
      if (relationship === "Attending" && extra.registration) row.attendingRegistration = extra.registration;
      groups.set(key, row);
    };
    registrationRows.forEach((row) =>
      add(
        row.resolvedConference,
        row.conference_id ?? row.resolvedConference?.id,
        "Attending",
        row.normalizedStatus,
        { registration: row },
      ),
    );
    submissions
      .filter((row) => String(row.author_id ?? row.author?.id) === String(user?.id))
      .forEach((row) =>
        add(row.conference, row.conference_id ?? row.conference?.id, "Submitted", row.status),
      );
    conferences
      .filter((row) => String(row.organiser_id) === String(user?.id))
      .forEach((row) => add(row, row.id, "Organising"));
    reviews
      .filter((row) => String(row.reviewer_id ?? row.reviewer?.id) === String(user?.id))
      .forEach((row) =>
        add(
          row.submission?.conference ?? conferencesById.get(String(row.submission?.conference_id)),
          row.submission?.conference_id ?? row.submission?.conference?.id,
          "Reviewing",
        ),
      );
    return [...groups.values()];
  }, [registrationRows, submissions, conferences, conferencesById, reviews, user?.id]);

  const filteredRegistrations = useMemo(() => {
    const search = query.trim().toLowerCase();
    let list = relationshipRows;
    if (filter === "upcoming") list = list.filter((row) => !isPastConference(row.resolvedConference));
    else if (filter === "past") list = list.filter((row) => isPastConference(row.resolvedConference));
    if (!search) return list;
    return list.filter((registration) =>
      [
        registration.id,
        registration.reference,
        registration.registration_code,
        conferenceName(registration.resolvedConference),
        ...registration.relationships,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [relationshipRows, query, filter]);

  const performCancel = async () => {
    if (!cancelTarget?.registration?.id) return;
    const registration = cancelTarget.registration;
    setBusyRegistrationId(registration.id);
    setFeedback("");
    setError("");
    try {
      await registrationsApi.remove(registration.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== registration.id));
      setFeedback("Registration cancelled successfully.");
      setCancelTarget(null);
    } catch (err) {
      setError(err?.message || "Unable to cancel registration.");
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
    <RoleChrome>
      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
          <TicketCheck size={14} /> Your conferences
        </span>
        <h1 className="mb-2 mt-3 text-3xl font-bold leading-tight">My Conferences</h1>
        <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
          View conferences you attend, submit to, organise, or review.
        </p>
      </section>

      {feedback && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e]"
        >
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback("")} aria-label="Dismiss">✕</button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={loadData} className="font-extrabold underline">Retry</button>
        </div>
      )}

      <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
        <div className="flex flex-col gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">Relationships</span>
              <h2 className="mb-0 mt-1 text-[20px] font-bold">
                {loading
                  ? "Your conferences"
                  : `${filteredRegistrations.length} conference${filteredRegistrations.length === 1 ? "" : "s"}`}
              </h2>
            </div>
            <label className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conferences..."
                className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
              />
            </label>
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
          <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
            Loading your conferences...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <TicketCheck size={22} className="mx-auto text-[#aeb6c6]" />
            <h3 className="mb-1 mt-3 text-[13px] font-bold">
              {relationshipRows.length ? "No conferences match your filter" : "No conferences yet"}
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6]">
              Browse conferences and register for an event to see it here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/conferences")}
              className="mt-4 rounded-xl bg-[#efedff] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7]"
            >
              Browse conferences
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#edf0f5]">
            {filteredRegistrations.map((registration) => {
              const conference = registration.resolvedConference;
              const status = registration.normalizedStatus;
              const attending = registration.attendingRegistration;
              const canCancel =
                attending &&
                !["cancelled", "canceled", "rejected", "completed"].includes(attending.normalizedStatus);
              const isCancelling = busyRegistrationId === attending?.id;

              return (
                <article
                  key={registration.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                      <CalendarDays size={17} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-[12px] text-[#1c2a4a]">
                        {conferenceName(conference)}
                      </strong>
                      <span className="text-[10px] text-[#8c96a9]">
                        {dateLabel(conferenceStartDate(conference))}
                        {registration.id != null && ` · Conference #${registration.id}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                        REGISTRATION_STATUS_STYLES[status] || REGISTRATION_STATUS_STYLES.pending
                      }`}
                    >
                      {registration.relationships.join(" · ")}
                    </span>

                    <button
                      type="button"
                      onClick={() => conference && setViewConference(conference)}
                      disabled={!conference}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5548d7] transition hover:bg-[#e4e1ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eye size={12} /> View
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget({ registration: attending, conference })}
                        disabled={isCancelling}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmModal
        open={!!cancelTarget}
        title="Are you sure?"
        message={
          cancelTarget
            ? `Do you want to cancel your registration for "${conferenceName(cancelTarget.conference)}"?`
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
            ? relationshipRows.find(
                (row) => String(row.resolvedConference?.id) === String(viewConference.id),
              )?.attendingRegistration
            : null
        }
        onClose={() => setViewConference(null)}
      />
    </RoleChrome>
  );
}