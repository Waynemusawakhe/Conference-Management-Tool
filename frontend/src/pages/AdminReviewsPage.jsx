import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Lock,
  LockOpen,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDateTime } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { reviewsApi } from "../api/reviewsApi";
import { submissionsApi } from "../api/submissionsApi";
import { usersApi } from "../api/usersApi";

/* Guide §8.8 — confirmed recommendation values */
const RECOMMENDATIONS = [
  { value: "accept", label: "Accept", tone: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]" },
  { value: "reject", label: "Reject", tone: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]" },
  { value: "revise", label: "Revise", tone: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]" },
];

const REC_MAP = Object.fromEntries(RECOMMENDATIONS.map((r) => [r.value, r]));

const FILTERS = [
  { key: "all", label: "All" },
  { key: "accept", label: "Accept" },
  { key: "reject", label: "Reject" },
  { key: "revise", label: "Revise" },
  { key: "locked", label: "Locked" },
  { key: "unlocked", label: "Unlocked" },
];

/* ---- Defensive resolvers ---- */
const reviewId = (r) => r.id;
const reviewScore = (r) => r.score ?? "—";
const reviewComments = (r) => r.comments ?? r.comment ?? "";
const reviewRecommendation = (r) =>
  String(r.recommendation ?? "").toLowerCase();
const reviewIsLocked = (r) => Boolean(r.locked ?? r.is_locked);
const reviewSubmittedAt = (r) => r.submitted_at ?? r.submittedAt;

const submissionLabel = (s) =>
  s.title ?? s.name ?? `Submission #${s.id}`;
const reviewerName = (r) =>
  r.reviewer?.name ??
  r.reviewer_name ??
  r.reviewer?.full_name ??
  `Reviewer #${r.reviewer_id ?? "?"}`;
const submissionName = (r) =>
  r.submission?.title ??
  r.submission_title ??
  r.submission?.name ??
  `Submission #${r.submission_id ?? "?"}`;

const userName = (u) => u.name ?? u.full_name ?? `User #${u.id}`;

function UserPickerLabel(u) {
  return `${userName(u)} · ${u.email ?? "—"}`;
}

/* ---- Stat strip ---- */
function StatStrip({ reviews }) {
  const counts = useMemo(() => {
    const c = { total: reviews.length, accept: 0, reject: 0, revise: 0, locked: 0, unlocked: 0 };
    reviews.forEach((r) => {
      const rec = reviewRecommendation(r);
      if (rec && c[rec] !== undefined) c[rec] += 1;
      if (reviewIsLocked(r)) c.locked += 1;
      else c.unlocked += 1;
    });
    return c;
  }, [reviews]);

  const items = [
    { label: "Total reviews", value: counts.total, icon: <FileCheck2 size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "Accept", value: counts.accept, icon: <CheckCircle2 size={14} />, tone: "text-[#18794e] bg-[#effaf4]" },
    { label: "Reject", value: counts.reject, icon: <X size={14} />, tone: "text-[#b13a3a] bg-[#fff2f2]" },
    { label: "Revise", value: counts.revise, icon: <RotateCcw size={14} />, tone: "text-[#a55b25] bg-[#fff6ee]" },
    { label: "Locked", value: counts.locked, icon: <Lock size={14} />, tone: "text-[#1d5fa8] bg-[#eef5fd]" },
    { label: "Unlocked", value: counts.unlocked, icon: <LockOpen size={14} />, tone: "text-[#9b7414] bg-[#fff9e9]" },
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
      <td className="px-6 py-4"><div className="h-2.5 w-40 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-2.5 w-32 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[#eef1f7]" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-6 w-24 animate-pulse rounded-lg bg-[#eef1f7]" /></td>
    </tr>
  ));
}

/* ---- Assign dialog ---- */
function AssignDialog({ open, onClose, submissions, reviewers, onAssigned, busy, setBusy }) {
  const [submissionId, setSubmissionId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!submissionId || !reviewerId) {
      setErr("Both submission and reviewer are required.");
      return;
    }
    setBusy(true);
    try {
      await reviewsApi.create({
        submission_id: Number(submissionId),
        reviewer_id: Number(reviewerId),
      });
      await onAssigned();
      setSubmissionId("");
      setReviewerId("");
      onClose();
    } catch (e2) {
      if (e2?.status === 422 && e2.errors) {
        const first = Object.values(e2.errors).flat()[0];
        setErr(first || e2.message);
      } else {
        setErr(e2?.message ?? "Failed to assign reviewer.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#07132f]/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(7,19,47,.28)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#efedff] text-[#4f46c7]"><Plus size={15} /></span>
            <strong className="text-[13px] font-extrabold text-[#1c2a4a]">Assign a reviewer</strong>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#aeb6c6] hover:bg-[#f1f2f6] hover:text-[#5c6880]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-4 p-5">
          <label className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">Submission</span>
            <select value={submissionId} onChange={(e) => setSubmissionId(e.target.value)} className="h-11 rounded-xl border border-[#e4e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10">
              <option value="">— Choose a submission —</option>
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>{submissionLabel(s)} (#{s.id})</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">Reviewer</span>
            <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="h-11 rounded-xl border border-[#e4e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10">
              <option value="">— Choose a reviewer —</option>
              {reviewers.map((u) => (
                <option key={u.id} value={u.id}>{UserPickerLabel(u)}</option>
              ))}
            </select>
          </label>
          {err && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{err}</p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#eef1f7] pt-4">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[11px] font-bold text-[#5c6880] hover:bg-[#fafbff]">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:opacity-60">
              {busy ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Page ---- */
export default function AdminReviewsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const reviewsRes = useApiResource(() => reviewsApi.getAll(), []);
  const submissionsRes = useApiResource(() => submissionsApi.getAll(), []);
  const usersRes = useApiResource(() => usersApi.getAll(), []);

  const reviews = useMemo(() => toArray(reviewsRes.data), [reviewsRes.data]);
  const submissions = useMemo(() => toArray(submissionsRes.data), [submissionsRes.data]);
  const users = useMemo(() => toArray(usersRes.data), [usersRes.data]);

  /* Filter reviewers from users */
  const reviewers = useMemo(
    () => users.filter((u) => String(u.role ?? "").toLowerCase() === "reviewer"),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      const rec = reviewRecommendation(r);
      const locked = reviewIsLocked(r);
      if (filter === "locked" && !locked) return false;
      if (filter === "unlocked" && locked) return false;
      if (["accept", "reject", "revise"].includes(filter) && rec !== filter) return false;
      if (!q) return true;
      return [
        submissionName(r),
        reviewerName(r),
        reviewComments(r),
        String(r.id ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reviews, query, filter]);

  /* ---- Mutations ---- */
  const runMutation = async (action, successMessage) => {
    setFeedback(null);
    try {
      await action();
      await reviewsRes.reload();
      setFeedback({ type: "success", message: successMessage });
    } catch (err) {
      setFeedback({ type: "error", message: err?.message ?? "Action failed." });
    }
  };

  const handleLock = (r) =>
    runMutation(
      () => reviewsApi.lock(r.id),
      `Review #${r.id} locked.`
    );

  const handleDelete = (r) => {
    if (reviewIsLocked(r)) {
      setFeedback({ type: "error", message: "Locked reviews cannot be removed." });
      return;
    }
    if (!window.confirm(`Remove assignment for review #${r.id}?`)) return;
    runMutation(
      () => reviewsApi.remove(r.id),
      `Review #${r.id} removed.`
    );
  };

  return (
    <AdminLayout
      subtitle="Oversight"
      title="Reviews"
      action={
        <button
          onClick={() => setAssignOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
        >
          <Plus size={14} /> Assign reviewer
        </button>
      }
    >
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
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {!reviewsRes.loading && !reviewsRes.error && reviews.length > 0 && (
        <div className="mb-5"><StatStrip reviews={reviews} /></div>
      )}

      <Card className="overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <FileCheck2 size={14} />
              </span>
              {filtered.length === reviews.length
                ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${reviews.length} reviews`}
            </span>
          }
          action={
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search submission, reviewer…"
                className="h-10 w-full rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-9 text-[11px] outline-none transition focus:border-[#8175ef] focus:bg-white focus:ring-2 focus:ring-[#8175ef]/10"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#98a1b3] hover:bg-[#eef1f7] hover:text-[#5c6880]" aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
          }
        />

        <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] px-5 py-3 sm:px-6">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const count =
              f.key === "all" ? reviews.length
              : f.key === "locked" ? reviews.filter(reviewIsLocked).length
              : f.key === "unlocked" ? reviews.filter((r) => !reviewIsLocked(r)).length
              : reviews.filter((r) => reviewRecommendation(r) === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${
                  isActive
                    ? "border-transparent bg-[#07132f] text-white shadow-[0_6px_18px_rgba(7,19,47,.18)]"
                    : "border-[#e2e6ee] bg-white text-[#66728b] hover:border-[#d6dbe8] hover:bg-[#fafbff] hover:text-[#43506a]"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-[#f1efff] text-[#5649dc]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f5] bg-gradient-to-b from-[#fafbff] to-[#f4f6fb] text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9ba4b5]">
                <th className="px-6 py-3">Submission</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewsRes.loading && <LoadingRows />}

              {!reviewsRes.loading && reviewsRes.error && (
                <tr><td colSpan={6}><StateBlock kind="error" message={reviewsRes.error.message} onRetry={reviewsRes.reload} /></td></tr>
              )}

              {!reviewsRes.loading && !reviewsRes.error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]"><FileCheck2 size={22} /></span>
                      <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">
                        {reviews.length === 0 ? "No reviews yet" : "No matches"}
                      </h3>
                      <p className="m-0 max-w-[420px] text-[11px] leading-5 text-[#8993a6]">
                        {reviews.length === 0
                          ? "Assign a reviewer to start collecting reviews."
                          : "Try a different filter or clear the search."}
                      </p>
                      {reviews.length === 0 ? (
                        <button onClick={() => setAssignOpen(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]">
                          <Plus size={12} /> Assign first reviewer
                        </button>
                      ) : (
                        (query || filter !== "all") && (
                          <button onClick={() => { setQuery(""); setFilter("all"); }} className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]">
                            Clear filters
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!reviewsRes.loading && !reviewsRes.error && filtered.map((r) => {
                const rec = REC_MAP[reviewRecommendation(r)];
                const locked = reviewIsLocked(r);
                return (
                  <tr key={reviewId(r)} className="group border-b border-[#f0f2f6] transition-colors last:border-0 hover:bg-[#fafbff]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#efedff] to-[#e0dcff] text-[11px] font-extrabold text-[#4f46c7]">
                          <FileCheck2 size={15} />
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">{submissionName(r)}</strong>
                          <span className="text-[9px] text-[#929bad]">Review #{r.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#5c6880]">
                        <User size={12} className="text-[#aeb6c6]" />
                        {reviewerName(r)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1c2a4a]">
                        <Star size={12} className="text-[#f59e0b]" />
                        {reviewScore(r)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {rec ? (
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${rec.tone}`}>
                          {rec.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#aeb6c6]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#c9dff5] bg-[#eef5fd] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#1d5fa8]">
                          <Lock size={10} /> Locked
                        </span>
                      ) : reviewSubmittedAt(r) ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#e9d9a7] bg-[#fff9e9] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#9b7414]">
                          <Clock size={10} /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e6ee] bg-[#f5f6fa] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#59657d]">
                          Awaiting
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {!locked && reviewSubmittedAt(r) && (
                          <button onClick={() => handleLock(r)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100">
                            <Lock size={12} /> Lock
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={locked}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        submissions={submissions}
        reviewers={reviewers}
        busy={busy}
        setBusy={setBusy}
        onAssigned={() => reviewsRes.reload()}
      />
    </AdminLayout>
  );
}