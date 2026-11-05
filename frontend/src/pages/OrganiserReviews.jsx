import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Lock,
  PenLine,
  Search,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";
import { usersApi } from "../api/usersApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);

const REC_STYLES = {
  accept: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  reject: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revise: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
};

function AssignSuccessModal({ open, reviewerName, submissionLabel, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-[#030814]/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_120px_rgba(3,8,20,.5)] dark:bg-[#0f172a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="relative mb-5 grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#effaf4] to-[#e0f5ea]" />
            <div className="absolute inset-0 rounded-full border-2 border-[#bfe5d1] cmt-rav-ring" />
            <svg
              viewBox="0 0 52 52"
              className="relative h-14 w-14"
              aria-hidden="true"
            >
              <circle
                cx="26"
                cy="26"
                r="23"
                fill="none"
                stroke="#18794e"
                strokeWidth="2"
                strokeOpacity=".15"
              />
              <path
                d="M15 27 L23 35 L38 19"
                fill="none"
                stroke="#18794e"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cmt-rav-check"
              />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold text-[#1c2a4a] dark:text-white">
            Reviewer Assigned
          </h2>
          {reviewerName && (
            <p className="mt-2 line-clamp-2 text-[12px] font-bold text-[#35415f] dark:text-white/80">
              {reviewerName}
            </p>
          )}
          {submissionLabel && (
            <p className="mt-1 line-clamp-2 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
              assigned to {submissionLabel}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-5 text-[#66728b] dark:text-white/60">
            The reviewer can now begin evaluating this submission.
          </p>
        </div>
        <div className="border-t border-[#edf0f5] bg-[#fafbfe] p-4 dark:border-[#1e293b] dark:bg-[#0b1224]">
          <button
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-[11px] font-extrabold text-white shadow-[0_8px_20px_rgba(103,87,245,.28)] transition hover:from-[#4a3ec9] hover:to-[#5b4be0]"
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        .cmt-rav-check {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: cmtRavDraw .55s ease-out forwards;
        }
        @keyframes cmtRavDraw {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        .cmt-rav-ring {
          animation: cmtRavRing 1s ease-out .15s both;
        }
        @keyframes cmtRavRing {
          0% { transform: scale(.85); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cmt-rav-check, .cmt-rav-ring { animation: none; }
          .cmt-rav-check { stroke-dashoffset: 0; }
          .cmt-rav-ring { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function AssignReviewerModal({
  open,
  submissions,
  reviewerCandidates,
  busy,
  error,
  onClose,
  onSubmit,
}) {
  const [submissionId, setSubmissionId] = useState("");
  const [reviewerId, setReviewerId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubmissionId("");
    setReviewerId("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submissionId || !reviewerId) return;
    onSubmit({
      submission_id: Number(submissionId),
      reviewer_id: Number(reviewerId),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[#030814]/75 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="w-full max-w-[540px] overflow-hidden rounded-[22px] bg-white shadow-[0_40px_120px_rgba(3,8,20,.5)] dark:bg-[#0f172a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6] dark:text-[#a9a2ff]">
              Peer review
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
              Assign a reviewer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50 dark:bg-[#1e293b] dark:text-white dark:hover:bg-[#334155]"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:p-6">
          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#cbd5e1]">
            Submission
            <select
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              disabled={busy}
              required
              className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"
            >
              <option value="">Select a submission</option>
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} · {s.title || "Untitled"}{" "}
                  {s.conference?.name ? `· ${s.conference.name}` : ""}
                </option>
              ))}
            </select>
            {submissions.length === 0 && (
              <span className="text-[10px] font-normal text-[#8993a6] dark:text-[#94a3b8]">
                No submissions available to assign yet.
              </span>
            )}
          </label>

          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a] dark:text-[#cbd5e1]">
            Reviewer
            <select
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              disabled={busy}
              required
              className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#07132f] focus:ring-4 focus:ring-[#07132f]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"
            >
              <option value="">Select a reviewer</option>
              {reviewerCandidates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || r.email || `User #${r.id}`} · #{r.id}
                </option>
              ))}
            </select>
            {reviewerCandidates.length === 0 && (
              <span className="text-[10px] font-normal text-[#8993a6] dark:text-[#94a3b8]">
                No reviewers available.
              </span>
            )}
          </label>

          {error && (
            <p
              role="alert"
              className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-[#2a1218] dark:text-[#f08a9a]"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-xs font-bold text-[#66728b] transition hover:bg-[#07132f] hover:text-white disabled:opacity-50 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !submissionId || !reviewerId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white transition hover:from-[#4a3ec9] hover:to-[#5b4be0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Assigning…
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Assign reviewer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrganiserReviews() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reviewerCandidates, setReviewerCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const confRes = await conferencesApi.getAll({ per_page: 100 });
      const mine = unwrapList(confRes).filter(
        (c) =>
          Number(c.organiser_id) === Number(user?.id) ||
          Number(c.organiser?.id) === Number(user?.id),
      );
      setConferences(mine);

      const submissionToConference = new Map();
      const allSubs = [];
      for (const c of mine) {
        try {
          const subRes = await submissionsApi.getAll({
            conference_id: c.id,
            per_page: 100,
          });
          unwrapList(subRes).forEach((s) => {
            submissionToConference.set(Number(s.id), c);
            allSubs.push({ ...s, conference: c });
          });
        } catch {}
      }
      setSubmissions(allSubs);

      const reviewRes = await reviewsApi.getAll({ per_page: 100 });
      const filtered = unwrapList(reviewRes)
        .filter((r) => submissionToConference.has(Number(r.submission_id)))
        .map((r) => ({
          ...r,
          conference: submissionToConference.get(Number(r.submission_id)),
        }));
      setRows(filtered);
    } catch (e) {
      setError(e?.message || "Unable to load reviews.");
      setRows([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    usersApi
      .getReviewers()
      .then((res) => setReviewerCandidates(unwrapList(res)))
      .catch(() => setReviewerCandidates([]));
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(""), 4000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesConference =
        conferenceFilter === "all" ||
        String(r.conference?.id) === String(conferenceFilter);
      const matchesQuery =
        !q ||
        [
          r.id,
          r.submission_id,
          r.reviewer?.name,
          r.reviewer_id,
          r.recommendation,
          r.conference?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesConference && matchesQuery;
    });
  }, [rows, query, conferenceFilter]);

  const handleAssign = async ({ submission_id, reviewer_id }) => {
    setAssignError("");
    const duplicate = rows.some(
      (r) =>
        Number(r.submission_id) === Number(submission_id) &&
        Number(r.reviewer_id) === Number(reviewer_id),
    );
    if (duplicate) {
      setAssignError("This reviewer is already assigned to this submission.");
      return;
    }
    setAssigning(true);
    try {
      await reviewsApi.assign({ submission_id, reviewer_id });

      const matchedSubmission = submissions.find(
        (s) => Number(s.id) === Number(submission_id),
      );
      const matchedReviewer = reviewerCandidates.find(
        (r) => Number(r.id) === Number(reviewer_id),
      );

      setAssignOpen(false);
      setAssignSuccess({
        reviewerName: matchedReviewer?.name || `User #${reviewer_id}`,
        submissionLabel: matchedSubmission
          ? `#${matchedSubmission.id} · ${matchedSubmission.title || "Submission"}`
          : `Submission #${submission_id}`,
      });
      await loadData();
    } catch (err) {
      setAssignError(
        err?.message || "Unable to assign the reviewer. Please try again.",
      );
    } finally {
      setAssigning(false);
    }
  };

  const selectClass =
    "h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] px-3 text-[10px] font-semibold text-[#59657d] outline-none transition focus:border-[#07132f] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8]";

  return (
    <OrganiserLayout>
      {feedback && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e] dark:border-[#0a3b26] dark:bg-[#052e1f] dark:text-[#34d399]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {feedback}
          </span>
          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="font-extrabold underline hover:text-[#07132f] dark:hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
              Peer review
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
              Reviews on your conferences
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reviews…"
                className="h-10 w-[180px] rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#07132f] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"
              />
            </div>
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className={`${selectClass} max-w-[220px]`}
            >
              <option value="all">All conferences</option>
              {conferences.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setAssignError("");
                setAssignOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:from-[#4a3ec9] hover:to-[#5b4be0]"
            >
              <UserPlus size={14} /> Assign reviewer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading
            reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCheck
              size={22}
              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"
            />
            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
              No reviews found
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
              Assign a reviewer to one of your submissions to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#edf0f5] dark:divide-[#1e293b]">
            {filtered.map((r) => {
              const state = r.locked
                ? {
                    label: "Locked",
                    cls: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
                    Icon: Lock,
                  }
                : r.submitted_at
                ? {
                    label: "Submitted",
                    cls: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
                    Icon: CheckCheck,
                  }
                : {
                    label: "Pending",
                    cls: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
                    Icon: PenLine,
                  };
              const StateIcon = state.Icon;
              const rec = (r.recommendation || "").toLowerCase();
              const recCls =
                REC_STYLES[rec] ||
                "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]";

              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-[#fbfbfe] dark:hover:bg-[#111c33] sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                        Review #{r.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${state.cls}`}
                      >
                        <StateIcon size={10} /> {state.label}
                      </span>
                      {r.recommendation && (
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${recCls}`}
                        >
                          {r.recommendation}
                        </span>
                      )}
                    </div>
                    <p className="mb-0 mt-2 text-[11px] font-bold text-[#0d1b3d] dark:text-white">
                      Submission #{r.submission_id}
                      {r.conference?.name ? (
                        <span className="ml-2 text-[10px] font-semibold text-[#8993a6] dark:text-[#94a3b8]">
                          · {r.conference.name}
                        </span>
                      ) : null}
                    </p>
                    <p className="mb-0 mt-0.5 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
                      Reviewer: {r.reviewer?.name || `User #${r.reviewer_id}`}
                    </p>
                  </div>

                  {typeof r.score === "number" && (
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#6757f5] dark:text-[#a9a2ff]">
                      <Star size={13} /> {r.score}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AssignReviewerModal
        open={assignOpen}
        submissions={submissions}
        reviewerCandidates={reviewerCandidates}
        busy={assigning}
        error={assignError}
        onClose={() => setAssignOpen(false)}
        onSubmit={handleAssign}
      />

      <AssignSuccessModal
        open={Boolean(assignSuccess)}
        reviewerName={assignSuccess?.reviewerName}
        submissionLabel={assignSuccess?.submissionLabel}
        onClose={() => setAssignSuccess(null)}
      />
    </OrganiserLayout>
  );
}