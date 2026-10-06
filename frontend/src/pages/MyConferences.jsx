import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Search, TicketCheck } from "lucide-react";
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
  return String(value ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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

export default function MyConferences() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          user?.role === "author"
            ? collectPages(submissionsApi.getAll)
            : Promise.resolve([]),
          user?.role === "reviewer"
            ? collectPages(reviewsApi.getAll)
            : Promise.resolve([]),
        ]);
      const relatedIds = [
        ...new Set(
          reviewList
            .map((review) => review.submission?.conference_id)
            .filter((id) => id != null),
        ),
      ];
      const missingConferences = await Promise.all(
        relatedIds.map(async (id) => {
          const response = await conferencesApi.getById(id);
          return response?.data?.data ?? response?.data ?? response;
        }),
      );
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

  const registrationRows = useMemo(() => {
    return registrations
      .map((registration) => {
        const conferenceId =
          registration.conference_id ?? registration.conference?.id;
        const conference =
          registration.conference ??
          conferences.find((item) => String(item.id) === String(conferenceId));

        return {
          ...registration,
          resolvedConference: conference,
          normalizedStatus: normalizeStatus(registration.status),
        };
      })
      .filter((registration) => {
        const registrationUserId =
          registration.user_id ??
          registration.user?.id ??
          registration.attendee_id;

        return (
          registrationUserId == null ||
          Number(registrationUserId) === Number(user?.id)
        );
      });
  }, [registrations, conferences, user?.id]);

  const relationshipRows = useMemo(() => {
    const groups = new Map();
    const add = (conference, id, relationship, status) => {
      if (id == null) return;
      const key = String(id);
      const row = groups.get(key) || {
        id: key,
        resolvedConference: conference,
        relationships: [],
        normalizedStatus: "confirmed",
      };
      if (!row.resolvedConference && conference)
        row.resolvedConference = conference;
      const label = `${relationship}${status ? ` (${REGISTRATION_STATUS_LABELS[status] || status})` : ""}`;
      if (!row.relationships.includes(label)) row.relationships.push(label);
      groups.set(key, row);
    };
    registrationRows.forEach((row) =>
      add(
        row.resolvedConference,
        row.conference_id ?? row.resolvedConference?.id,
        "Attending",
        row.normalizedStatus,
      ),
    );
    submissions
      .filter(
        (row) => String(row.author_id ?? row.author?.id) === String(user?.id),
      )
      .forEach((row) =>
        add(
          row.conference,
          row.conference_id ?? row.conference?.id,
          "Submitted",
          row.status,
        ),
      );
    conferences
      .filter((row) => String(row.organiser_id) === String(user?.id))
      .forEach((row) => add(row, row.id, "Organising"));
    reviews
      .filter(
        (row) =>
          String(row.reviewer_id ?? row.reviewer?.id) === String(user?.id),
      )
      .forEach((row) =>
        add(
          row.submission?.conference ??
            conferences.find(
              (conference) =>
                String(conference.id) === String(row.submission?.conference_id),
            ),
          row.submission?.conference_id ?? row.submission?.conference?.id,
          "Reviewing",
        ),
      );
    return [...groups.values()];
  }, [registrationRows, submissions, conferences, reviews, user?.id]);

  const filteredRegistrations = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return relationshipRows;

    return relationshipRows.filter((registration) =>
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
  }, [relationshipRows, query]);

  return (
    <RoleChrome>
      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
          <TicketCheck size={14} /> Your conferences
        </span>
        <h1 className="mb-2 mt-3 text-3xl font-bold leading-tight">
          My Conferences
        </h1>
        <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
          View conferences you attend, submit to, organise, or review.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="font-extrabold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
              Relationships
            </span>
            <h2 className="mb-0 mt-1 text-[20px] font-bold">
              {loading
                ? "Your conferences"
                : `${relationshipRows.length} conference${relationshipRows.length === 1 ? "" : "s"}`}
            </h2>
          </div>
          <label className="relative w-full sm:w-[260px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
              size={15}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conferences..."
              aria-label="Search conferences"
              className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#8175ef] focus:ring-2 focus:ring-[#8175ef]/10"
            />
          </label>
        </div>

        {loading ? (
          <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
            Loading your conferences...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <TicketCheck size={22} className="mx-auto text-[#aeb6c6]" />
            <h3 className="mb-1 mt-3 text-[13px] font-bold">
              {relationshipRows.length
                ? "No conferences found"
                : "No conferences yet"}
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
                        {dateLabel(
                          conference?.start_date ??
                            conference?.starts_at ??
                            conference?.date,
                        )}
                        {registration.id != null &&
                          ` · Conference #${registration.id}`}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                      REGISTRATION_STATUS_STYLES[status] ||
                      REGISTRATION_STATUS_STYLES.pending
                    }`}
                  >
                    {registration.relationships.join(" · ")}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </RoleChrome>
  );
}
