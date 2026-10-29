import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Search,
  Star,
  User,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDate } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { submissionsApi } from "../api/submissionsApi";
import { conferencesApi } from "../api/conferencesApi";
import { reviewsApi } from "../api/reviewsApi";
import { AdminTableToolbar, SortableTh, useAdminTableControls } from "../components/AdminTableControls";

const SUBMISSION_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "conference", label: "Conference" },
  { key: "status", label: "Status" },
  { key: "decision", label: "Decision" },
  { key: "submitted", label: "Submitted" },
  { key: "actions", label: "Actions" },
];

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
  withdrawn: "Withdrawn",
};

const STATUS_TONES = {
  Pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  "Under review": "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  Accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  Rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  "Revision requested": "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  Withdrawn: "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]",
};

const REC_STYLES = {
  accept: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  reject: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revise: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

function statusKey(raw) {
  if (!raw) return "pending";
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function statusLabel(raw) {
  return STATUS_LABELS[statusKey(raw)] ?? String(raw ?? "—");
}

const subTitle = (s) => s.title ?? s.name ?? `Submission #${s.id}`;
const subAuthor = (s) =>
  s.author?.name ?? s.author_name ?? s.user?.name ?? s.user_name ?? "—";
const subConference = (s) =>
  s.conference?.name ??
  s.conference_name ??
  s.conference?.title ??
  "—";
const subTrack = (s) => s.track ?? s.category ?? "—";
const subDecision = (s) => s.decision ?? s.recommendation ?? "Pending";

function StatStrip({ submissions }) {
  const counts = useMemo(() => {
    const c = { total: submissions.length };
    submissions.forEach((s) => {
      const k = statusKey(s.status);
      c[k] = (c[k] ?? 0) + 1;
    });
    return c;
  }, [submissions]);

  const items = [
    { label: "Total", value: counts.total ?? 0, icon: <FileText size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "Pending", value: counts.pending ?? 0, icon: <FileText size={14} />, tone: "text-[#9b7414] bg-[#fff9e9]" },
    { label: "Under review", value: counts.under_review ?? 0, icon: <FileText size={14} />, tone: "text-[#5548d7] bg-[#f0efff]" },
    { label: "Accepted", value: counts.accepted ?? 0, icon: <FileText size={14} />, tone: "text-[#18794e] bg-[#effaf4]" },
    { label: "Rejected", value: counts.rejected ?? 0, icon: <FileText size={14} />, tone: "text-[#b13a3a] bg-[#fff2f2]" },
    { label: "Revision", value: counts.revision_requested ?? 0, icon: <FileText size={14} />, tone: "text-[#a55b25] bg-[#fff6ee]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="rounded-[14px] border border-[#e4e8f0] bg-white p-3 shadow-[0_6px_18px_rgba(15,28,65,.03)]">
          <span className={`inline-grid h-7 w-7 place-items-center rounded-lg ${it.tone}`}>{it.icon}</span>
          <strong className="mt-3 block text-[18px] leading-none tracking-[-.03em] text-[#1c2a4a]">{it.value}</strong>
          <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingRows({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-[#f0f2f6] last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[#eef1f7]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-44 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2 w-14 animate-pulse rounded-full bg-[#eef1f7]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-2.5 w-32 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-40 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-24 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-6 w-16 animate-pulse rounded-lg bg-[#eef1f7]" /></td>
    </tr>
  ));
}

function SubmissionFeedbackModal({ submission, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!submission) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    reviewsApi
      .getAll({ submission_id: submission.id, per_page: 50 })
      .then((res) => {
        if (!cancelled) setReviews(toArray(res));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Unable to load feedback.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [submission]);

  if (!submission) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[85vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">Reviewer Feedback</span>
            <h2 className="mb-0 mt-1 text-[18px] font-bold tracking-[-.03em] text-[#1c2a4a]">
              {subTitle(submission)}
            </h2>
            <p className="mt-1 text-[11px] text-[#8a95a8]">
              By {subAuthor(submission)} · {subConference(submission)}
            </p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3]" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading && (
            <div className="grid place-items-center py-12 text-[13px] font-semibold text-[#7c879a]">
              <Loader2 size={24} className="mb-3 animate-spin text-[#6655f6]" />
              Loading feedback...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-[12px] font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={32} className="mb-4 text-[#aeb6c6]" />
              <h3 className="text-[14px] font-bold text-[#1c2a4a]">No reviews yet</h3>
              <p className="mt-1 max-w-[280px] text-[11px] leading-5 text-[#8a95a8]">
                This submission hasn't received any reviewer feedback so far.
              </p>
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((r, idx) => {
                const rec = (r.recommendation || "").toLowerCase();
                const recCls = REC_STYLES[rec] || "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]";
                return (
                  <div key={r.id || idx} className="rounded-xl border border-[#e5e8ef] bg-[#fafbfe] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf0f5] pb-3">
                      <div className="flex items-center gap-2">
                        {r.recommendation && (
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${recCls}`}>
                            {r.recommendation}
                          </span>
                        )}
                        {typeof r.score === "number" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#cfd0ff] bg-[#f0efff] px-2.5 py-1 text-[9px] font-extrabold text-[#5548d7]">
                            <Star size={11} /> {r.score} / 5
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-[#8a95a8]">
                        {r.locked ? <CheckCircle2 size={11} className="text-[#18794e]" /> : <Clock size={11} className="text-[#9b7414]" />}
                        {r.locked ? "Locked" : r.submitted_at ? "Submitted" : "In progress"}
                      </span>
                    </div>
                    <div className="pt-3">
                      <p className="m-0 whitespace-pre-wrap text-[12px] leading-6 text-[#35415f]">
                        {r.comments || <span className="italic text-[#8a95a8]">No comments provided.</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[#edf0f5] bg-[#fafbfe] p-4 sm:px-6">
          <button onClick={onClose} className="w-full rounded-xl bg-[#07132f] py-3 text-[12px] font-extrabold text-white transition hover:bg-[#0a1740]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const submissionsRes = useApiResource(() => submissionsApi.getAll(), []);
  const conferencesRes = useApiResource(() => conferencesApi.getAll(), []);

  const submissions = useMemo(() => toArray(submissionsRes.data), [submissionsRes.data]);
  const conferences = useMemo(() => toArray(conferencesRes.data), [conferencesRes.data]);

  const table = useAdminTableControls("submissions", SUBMISSION_COLUMNS);

  const statuses = useMemo(() => {
    const set = new Set();
    submissions.forEach((s) => set.add(statusKey(s.status)));
    return Array.from(set);
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      const k = statusKey(s.status);
      const cid = s.conference_id ?? s.conference?.id ?? s.conferenceId;
      
      if (statusFilter !== "all" && k !== statusFilter) return false;
      if (conferenceFilter !== "all" && String(cid) !== String(conferenceFilter)) return false;
      
      if (!q) return true;
      return [
        subTitle(s),
        subAuthor(s),
        subConference(s),
        subTrack(s),
        String(s.id ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [submissions, query, statusFilter, conferenceFilter]);

  const visibleSubmissions = table.sortRows(filtered, {
    title: (sub) => subTitle(sub),
    author: (sub) => subAuthor(sub),
    conference: (sub) => subConference(sub),
    status: (sub) => statusKey(sub.status),
    decision: (sub) => subDecision(sub),
    submitted: (sub) => sub.created_at ?? sub.submitted_at,
  });
  const visibleColumnCount = SUBMISSION_COLUMNS.filter((column) => table.columnVisible(column.key)).length;

  return (
    <AdminLayout subtitle="Oversight" title="Submissions">
      {!submissionsRes.loading && !submissionsRes.error && submissions.length > 0 && (
        <div className="mb-5">
          <StatStrip submissions={submissions} />
        </div>
      )}

      <Card className="w-full max-w-full overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <FileText size={14} />
              </span>
              {filtered.length === submissions.length
                ? `${submissions.length} submission${submissions.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${submissions.length} submissions`}
            </span>
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, author..."
                  className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]" aria-label="Clear search">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-[200px]">
                <select
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-3 pr-9 text-[11px] font-semibold text-[#59657d] outline-none focus:border-[#8175ef]"
                >
                  <option value="all">All Conferences</option>
                  {conferences.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={14} />
              </div>
            </div>
          }
        />

        {statuses.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                statusFilter === "all"
                  ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                  : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
              }`}
            >
              All
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"}`}>
                {submissions.length}
              </span>
            </button>
            {statuses.map((k) => {
              const isActive = statusFilter === k;
              const count = submissions.filter((s) => statusKey(s.status) === k).length;
              return (
                <button
                  key={k}
                  onClick={() => setStatusFilter(k)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                    isActive
                      ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                      : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                  }`}
                >
                  {STATUS_LABELS[k] ?? k}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <AdminTableToolbar columns={SUBMISSION_COLUMNS} controls={table} />
        
        {/* FORCED SCROLL CONTAINER */}
        <div className="w-full overflow-x-scroll overflow-y-hidden pb-4 custom-scrollbar">
          <table data-table-density={table.density} className="cmt-mobile-card-table admin-data-table w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] bg-gradient-to-b from-[#fafbff] to-[#f4f6fb] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                {table.columnVisible("title") && <SortableTh column={SUBMISSION_COLUMNS[0]} controls={table} className="sticky left-0 z-20 bg-[#fafbff] px-6 py-2.5 dark:bg-[#0f172a]" />}
                {table.columnVisible("author") && <SortableTh column={SUBMISSION_COLUMNS[1]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("conference") && <SortableTh column={SUBMISSION_COLUMNS[2]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("status") && <SortableTh column={SUBMISSION_COLUMNS[3]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("decision") && <SortableTh column={SUBMISSION_COLUMNS[4]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("submitted") && <SortableTh column={SUBMISSION_COLUMNS[5]} controls={table} className="whitespace-nowrap px-4 py-2.5" />}
                {table.columnVisible("actions") && <th className="px-6 py-2.5 text-right whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {submissionsRes.loading && <LoadingRows />}

              {!submissionsRes.loading && submissionsRes.error && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <StateBlock kind="error" message={submissionsRes.error.message} onRetry={submissionsRes.reload} />
                  </td>
                </tr>
              )}

              {!submissionsRes.loading && !submissionsRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount}>
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                        <FileText size={22} />
                      </span>
                      <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">
                        {submissions.length === 0 ? "No submissions yet" : "No matches"}
                      </h3>
                      <p className="m-0 max-w-[400px] text-[11px] leading-5 text-[#8993a6]">
                        {submissions.length === 0
                          ? "When authors submit papers to conferences, they'll appear here."
                          : "Try a different filter or clear the search."}
                      </p>
                      {filtered.length === 0 && (query || statusFilter !== "all" || conferenceFilter !== "all") && (
                        <button
                          onClick={() => { setQuery(""); setStatusFilter("all"); setConferenceFilter("all"); }}
                          className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!submissionsRes.loading &&
                !submissionsRes.error &&
                visibleSubmissions.map((sub) => {
                  const label = statusLabel(sub.status);
                  return (
                    <tr key={sub.id} className="cmt-admin-list-row group border-b border-[#f0f2f6] transition-colors last:border-0 hover:bg-[#fafbff]">
                      {table.columnVisible("title") && <td data-label="Submission" className="sticky left-0 z-10 bg-white px-6 py-4 dark:bg-[#0f172a]">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#efedff] to-[#e0dcff] text-[#4f46c7] shadow-[0_6px_14px_-4px_rgba(102,85,246,.28)]">
                            <FileText size={15} />
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">
                              {subTitle(sub)}
                            </strong>
                            <span className="text-[9px] text-[#929bad]">#{sub.id}</span>
                          </div>
                        </div>
                      </td>}
                      {table.columnVisible("author") && <td data-label="Author" className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-[#5c6880]">
                          <User size={12} className="text-[#aeb6c6]" />
                          {subAuthor(sub)}
                        </span>
                      </td>}
                      {table.columnVisible("conference") && <td data-label="Conference" className="px-4 py-4">
                        <span className="block max-w-[200px] truncate text-[10px] text-[#5c6880]">
                          {subConference(sub)}
                        </span>
                      </td>}
                      {table.columnVisible("status") && <td data-label="Status" className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${STATUS_TONES[label] ?? "border-[#e2e6ee] bg-[#f5f6fa] text-[#59657d]"}`}>
                          {label}
                        </span>
                      </td>}
                      {table.columnVisible("decision") && <td data-label="Decision" className="px-4 py-4 text-[10px] font-semibold text-[#5c6880]">
                        {subDecision(sub)}
                      </td>}
                      {table.columnVisible("submitted") && <td data-label="Submitted" className="px-4 py-4 text-[10px] text-[#7b869b]">
                        {formatDate(sub.created_at ?? sub.submitted_at)}
                      </td>}
                      {table.columnVisible("actions") && <td data-label="Actions" className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-2.5 py-1.5 text-[10px] font-bold text-[#5649dc] transition hover:bg-[#e5e2ff]"
                        >
                          <MessageSquare size={12} /> View Feedback
                        </button>
                      </td>}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      <SubmissionFeedbackModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />

      <style>{`
        /* Force scrollbar to always show and be bright so it's obvious */
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #6655f6 #e2e6ee;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 16px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e6ee;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6655f6;
          border-radius: 8px;
          border: 3px solid #e2e6ee;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5649dc;
        }
      `}</style>
    </AdminLayout>
  );
}