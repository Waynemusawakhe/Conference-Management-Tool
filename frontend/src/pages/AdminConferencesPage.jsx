import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  MapPin,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { AdminTableToolbar, SortableTh, useAdminTableControls } from "../components/AdminTableControls";

const CONFERENCE_COLUMNS = [
  { key: "conference", label: "Conference" },
  { key: "date", label: "Date" },
  { key: "location", label: "Location" },
  { key: "submissions", label: "Submissions" },
  { key: "actions", label: "Actions" },
];

const confName = (c) => c.name ?? c.title ?? `Conference #${c.id}`;
const confDate = (c) =>
  formatDate(c.date ?? c.start_date ?? c.starts_at ?? c.startDate ?? c.started_at);

function resolveLocation(conf) {
  const candidates = [
    conf.location,
    conf.venue,
    conf.venue_name,
    conf.place,
    conf.address,
    conf.city,
    conf.country,
    conf.venue_address,
  ];
  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return hit ? hit.trim() : null;
}

function resolveSubmissionCount(conf, submissionCounts) {
  const direct =
    conf.submissions_count ??
    conf.submissionsCount ??
    conf.total_submissions ??
    conf.submissions_total;
  if (direct != null && Number.isFinite(Number(direct))) return Number(direct);
  if (Array.isArray(conf.submissions)) return conf.submissions.length;
  return submissionCounts.get(conf.id) ?? 0;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function SubmissionBadge({ count, loading }) {
  if (loading) return <span className="inline-block h-6 w-10 animate-pulse rounded-lg bg-[#eef1f7]" />;
  if (count === 0)
    return (
      <span className="cmt-conference-row__pill inline-flex min-w-[32px] justify-center rounded-lg border border-[#edf0f5] bg-[#fafbfe] px-2 py-1 text-[10px] font-bold text-[#aeb6c6]">
        0
      </span>
    );
  const tone =
    count >= 20
      ? "border-[#c9dff5] bg-[#eef5fd] text-[#1d5fa8]"
      : count >= 5
      ? "border-[#e2d9f5] bg-[#f1efff] text-[#5b4fe3]"
      : "border-[#d9e3ee] bg-[#f5f8fc] text-[#4a637a]";
  return (
    <span className={`cmt-conference-row__pill inline-flex min-w-[32px] justify-center rounded-lg border px-2 py-1 text-[10px] font-extrabold ${tone}`}>
      {count}
    </span>
  );
}

function StatCard({ icon, tint, tone, value, label, note, loading }) {
  return (
    <article data-tone={tone} tabIndex={0} aria-label={`${label}: ${loading ? "loading" : value}`} className="cmt-conference-stat-tile cmt-hover-tile group relative isolate rounded-[16px] border shadow-[0_10px_28px_rgba(15,28,65,.04)]">
      <span aria-hidden="true" className="cmt-hover-tile__fill" />
      <span className="cmt-hover-tile__surface cmt-stat-tile p-4">
      <div className="flex items-start justify-between">
        <span className={`cmt-hover-tile__icon grid h-9 w-9 place-items-center rounded-[10px] ${tint}`}>{icon}</span>
        <Sparkles size={12} className="cmt-hover-tile__trend text-[#dfe4ed] opacity-0 transition group-hover:opacity-100" />
      </div>
      <strong className="cmt-hover-tile__number mt-4 block text-[24px] leading-none tracking-[-.04em] text-[#1c2a4a]">
        {loading ? "…" : value}
      </strong>
      <p className="cmt-hover-tile__title m-0 mt-1.5 text-[11px] font-bold text-[#35415f]">{label}</p>
      {note && <span className="cmt-hover-tile__description mt-0.5 block text-[9px] text-[#8b95a8]">{note}</span>}
      </span>
      <span aria-hidden="true" className="cmt-hover-tile__arrow">→</span>
    </article>
  );
}

function LoadingRows({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-[#f0f2f6] last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-[#eef1f7]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-44 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-14 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-2.5 w-24 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-32 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-6 w-10 animate-pulse rounded-lg bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-6 w-32 animate-pulse rounded-lg bg-[#eef1f7]" /></td>
    </tr>
  ));
}

export default function AdminConferencesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(null);

  const conferencesRes = useApiResource(() => conferencesApi.getAll(), []);
  const submissionsRes = useApiResource(() => submissionsApi.getAll(), []);

  const conferences = useMemo(() => toArray(conferencesRes.data), [conferencesRes.data]);
  const submissions = useMemo(() => toArray(submissionsRes.data), [submissionsRes.data]);
  const table = useAdminTableControls("conferences", CONFERENCE_COLUMNS);

  const submissionCounts = useMemo(() => {
    const map = new Map();
    submissions.forEach((s) => {
      const cid =
        s.conference_id ??
        s.conferenceId ??
        s.conference?.id ??
        s.conference?.conference_id ??
        null;
      if (cid == null) return;
      map.set(cid, (map.get(cid) ?? 0) + 1);
    });
    return map;
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conferences;
    return conferences.filter((c) => {
      const loc = resolveLocation(c) ?? "";
      return [confName(c), loc, String(c.id ?? "")].join(" ").toLowerCase().includes(q);
    });
  }, [conferences, query]);
  const visibleConferences = table.sortRows(filtered, {
    conference: (conf) => confName(conf),
    date: (conf) => conf.date ?? conf.start_date ?? conf.starts_at ?? conf.startDate ?? conf.started_at,
    location: (conf) => resolveLocation(conf),
    submissions: (conf) => resolveSubmissionCount(conf, submissionCounts),
  });
  const visibleColumnCount = CONFERENCE_COLUMNS.filter((column) => table.columnVisible(column.key)).length;

  const stats = useMemo(() => {
    const total = conferences.length;
    let withSubmissions = 0;
    let totalSubmissions = 0;
    conferences.forEach((c) => {
      const n = resolveSubmissionCount(c, submissionCounts);
      if (n > 0) withSubmissions += 1;
      totalSubmissions += n;
    });
    return { total, withSubmissions, totalSubmissions };
  }, [conferences, submissionCounts]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (conferences.length > 0) {
      console.log("[AdminConferencesPage] sample conference:", conferences[0]);
    }
    if (submissions.length > 0) {
      console.log("[AdminConferencesPage] sample submission:", submissions[0]);
    }
  }, [conferences, submissions]);

  const handleDelete = async (e, conf) => {
    e.stopPropagation();
    const name = confName(conf);
    if (
      !window.confirm(
        `Delete "${name}"? This also affects its submissions. This cannot be undone.`
      )
    )
      return;

    setFeedback(null);
    try {
      await conferencesApi.remove(conf.id);
      await Promise.all([conferencesRes.reload(), submissionsRes.reload()]);
      setFeedback({ type: "success", message: `"${name}" was deleted.` });
    } catch (err) {
      setFeedback({ type: "error", message: err?.message ?? "Failed to delete conference." });
    }
  };

  const submissionsLoading = submissionsRes.loading;

  return (
    <AdminLayout subtitle="Platform" title="Conferences">
      {feedback && (
        <div
          role="alert"
          className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold shadow-[0_6px_18px_rgba(15,28,65,.04)] ${
            feedback.type === "success"
              ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
              : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {!submissionsRes.loading && submissionsRes.error && conferences.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#e9d9a7] bg-[#fff9e9] px-4 py-2.5 text-[11px] font-semibold text-[#9b7414]">
          <span>Couldn't load submissions — counts below may be incomplete.</span>
          <button onClick={submissionsRes.reload} className="shrink-0 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {!conferencesRes.loading && !conferencesRes.error && conferences.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard tone="violet" icon={<CalendarDays size={17} />} tint="bg-[#efedff] text-[#4f46c7]" value={stats.total} label="Conferences" note="Across the platform" />
          <StatCard tone="blue" icon={<FileText size={17} />} tint="bg-[#eef5fd] text-[#1d5fa8]" value={stats.totalSubmissions} label="Submissions" note="Total received" loading={submissionsLoading} />
          <StatCard tone="green" icon={<Sparkles size={17} />} tint="bg-[#effaf4] text-[#18794e]" value={stats.withSubmissions} label="Active" note="With submissions" loading={submissionsLoading} />
          <StatCard tone="amber" icon={<Search size={17} />} tint="bg-[#fff6ee] text-[#a55b25]" value={filtered.length} label={query ? "Matching" : "Ready to manage"} note={query ? "Search results" : "All editable"} />
        </div>
      )}

      <Card className="overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <CalendarDays size={14} />
              </span>
              {filtered.length === conferences.length
                ? `${conferences.length} conference${conferences.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${conferences.length} conferences`}
            </span>
          }
          action={
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, location, ID…"
                className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          }
        />

        <AdminTableToolbar columns={CONFERENCE_COLUMNS} controls={table} className="cmt-conference-table-toolbar" />
        <div className="overflow-x-auto">
          <table data-table-density={table.density} className="cmt-mobile-card-table admin-data-table w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] bg-gradient-to-b from-[#fafbff] to-[#f4f6fb] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                {table.columnVisible("conference") && <SortableTh column={CONFERENCE_COLUMNS[0]} controls={table} className="sticky left-0 z-20 bg-[#fafbff] px-6 py-2.5 dark:bg-[#0f172a]" />}
                {table.columnVisible("date") && <SortableTh column={CONFERENCE_COLUMNS[1]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("location") && <SortableTh column={CONFERENCE_COLUMNS[2]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("submissions") && <SortableTh column={CONFERENCE_COLUMNS[3]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("actions") && <th className="px-6 py-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {conferencesRes.loading && <LoadingRows />}

              {!conferencesRes.loading && conferencesRes.error && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <StateBlock kind="error" message={conferencesRes.error.message} onRetry={conferencesRes.reload} />
                  </td>
                </tr>
              )}

              {!conferencesRes.loading && !conferencesRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                        <CalendarDays size={22} />
                      </span>
                      <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">
                        {conferences.length === 0 ? "No conferences yet" : "No matches"}
                      </h3>
                      <p className="m-0 max-w-[380px] text-[11px] leading-5 text-[#8993a6]">
                        {conferences.length === 0
                          ? "Once organisers create conferences, they'll appear here for you to manage."
                          : "Try a different search term, or clear the search to see every conference."}
                      </p>
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!conferencesRes.loading &&
                !conferencesRes.error &&
                visibleConferences.map((conf) => {
                  const name = confName(conf);
                  const location = resolveLocation(conf);
                  const count = resolveSubmissionCount(conf, submissionCounts);
                  return (
                    <tr
                      key={conf.id}
                      onClick={() => navigate(`/admin/conferences/${conf.id}/edit`)}
                      className="group cmt-conference-row cursor-pointer border-b border-[#f0f2f6] last:border-0"
                    >
                      {table.columnVisible("conference") && <td data-label="Conference" className="px-6 py-4">
                        <div className="cmt-conference-row__lead relative flex items-center gap-3">
                          <span className="cmt-conference-row__avatar relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#efedff] to-[#e0dcff] text-[11px] font-extrabold text-[#4f46c7] shadow-[0_6px_14px_-4px_rgba(102,85,246,.28)]">
                            {getInitials(name) === "?" ? <CalendarDays size={16} /> : getInitials(name)}
                            <span className="cmt-conference-row__badge absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white">
                              <CalendarDays size={8} strokeWidth={3} />
                            </span>
                          </span>
                          <div className="min-w-0">
                            <strong className="cmt-conference-name block truncate text-[11px] font-bold text-[#1c2a4a]">
                              {name}
                            </strong>
                            <span className="cmt-conference-row__meta text-[9px] font-semibold text-[#929bad]">#{conf.id}</span>
                          </div>
                        </div>
                      </td>}

                      {table.columnVisible("date") && <td data-label="Date" className="px-4 py-4">
                          <span className="cmt-conference-row__pill inline-flex items-center gap-1.5 rounded-lg border border-[#edf0f5] bg-[#fafbfe] px-2 py-1 text-[10px] font-semibold text-[#5c6880]">
                          <CalendarDays size={11} className="text-[#aeb6c6]" />
                          {confDate(conf)}
                        </span>
                      </td>}

                      {table.columnVisible("location") && <td data-label="Location" className="px-4 py-4">
                        {location ? (
                          <span className="cmt-conference-row__location inline-flex max-w-[220px] items-center gap-1.5 text-[10px] text-[#5c6880]">
                            <MapPin size={12} className="cmt-conference-row__location-icon shrink-0 text-[#aeb6c6]" />
                            <span className="truncate">{location}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-[#e2e6ee] bg-[#f5f6fa] px-2 py-0.5 text-[9px] font-bold text-[#8a95a8]">
                            Not specified
                          </span>
                        )}
                      </td>}

                      {table.columnVisible("submissions") && <td data-label="Submissions" className="px-4 py-4">
                        <SubmissionBadge count={count} loading={submissionsLoading} />
                      </td>}

                      {table.columnVisible("actions") && <td data-label="Actions" className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/conferences/${conf.id}/edit`);
                            }}
                            className="cmt-conference-row__edit inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 transition-colors"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, conf)}
                            className="cmt-conference-row__delete inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition-colors"
                            aria-label={`Delete ${name}`}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                          <span className="cmt-conference-row__chevron ml-1 inline-grid h-7 w-7 place-items-center rounded-full text-[#aeb6c6]">
                            <ChevronRight size={16} />
                          </span>
                        </div>
                      </td>}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
