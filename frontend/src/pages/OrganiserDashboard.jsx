import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCheck,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import OrganiserLayout from "../components/OrganiserLayout";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";
import { usersApi } from "../api/usersApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);
const unwrapOne = (r) => r?.data?.data ?? r?.data ?? r;

const dateLabel = (v) =>
  v
    ? new Date(v).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  revision_requested: "Revision requested",
  withdrawn: "Withdrawn",
};

const STATUS_STYLES = {
  pending: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
  under_review: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
  accepted: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
  rejected: "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]",
  revision_requested: "border-[#f0d0b9] bg-[#fff6ee] text-[#a55b25]",
  withdrawn: "border-[#d7dce5] bg-[#f4f6f9] text-[#68748b]",
};

function getErrorMessage(error) {
  const first = Object.values(error?.errors || {})[0];
  return Array.isArray(first)
    ? first[0]
    : first || error?.message || "Something went wrong.";
}

/* ------------------------------------------------------------------ *
 * Assign Reviewer Modal
 * ------------------------------------------------------------------ */
function AssignReviewerModal({
  open,
  submission,
  reviewers,
  loadingReviewers,
  existingReview,
  onClose,
  onAssigned,
}) {
  const [reviewerId, setReviewerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReviewerId(
      existingReview?.reviewer_id ? String(existingReview.reviewer_id) : "",
    );
    setError("");
  }, [open, existingReview]);

  if (!open || !submission) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!reviewerId) {
      setError("Please select a reviewer.");
      return;
    }

    setSaving(true);
    try {
      if (
        existingReview &&
        Number(existingReview.reviewer_id) !== Number(reviewerId)
      ) {
        if (existingReview.locked || existingReview.submitted_at) {
          setError(
            "This review is already submitted or locked and cannot be reassigned.",
          );
          setSaving(false);
          return;
        }
        await reviewsApi.remove(existingReview.id);
      }

      await reviewsApi.assign({
        submission_id: Number(submission.id),
        reviewer_id: Number(reviewerId),
      });

      if (submission.status === "pending") {
        try {
          await submissionsApi.updateStatus(submission.id, "under_review");
        } catch {
          /* non-blocking */
        }
      }

      onAssigned?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !saving && onClose()
      }
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
              Assign reviewer
            </span>
            <h2 className="mb-0 mt-1 truncate text-[15px] font-bold text-[#0d1b3d]">
              {submission.title || `Submission #${submission.id}`}
            </h2>
            <p className="mt-1 text-[10px] text-[#8993a6]">
              #{submission.id} ·{" "}
              {submission.author?.name ||
                submission.author_name ||
                "Unknown author"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-5 sm:p-6">
          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
            Choose a reviewer
            {loadingReviewers ? (
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dfe4ed] bg-[#fafbfe] px-3 text-[11px] font-normal text-[#8993a6]">
                <Loader2 className="animate-spin" size={13} /> Loading
                reviewers…
              </span>
            ) : (
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                disabled={saving}
                className="h-11 rounded-xl border border-[#dfe4ed] bg-white px-3 text-[13px] font-normal outline-none focus:border-[#7568f7] disabled:opacity-60"
              >
                <option value="">Select a reviewer</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.email || `User #${r.id}`}
                  </option>
                ))}
              </select>
            )}
          </label>

          {reviewers.length === 0 && !loadingReviewers && (
            <p className="rounded-xl bg-[#fff8e8] px-3 py-2 text-[11px] font-semibold text-[#8b6514]">
              No reviewers available. Ask an admin to promote a user to the
              reviewer role.
            </p>
          )}

          {existingReview && (
            <p className="rounded-xl bg-[#f0efff] px-3 py-2 text-[10px] font-semibold text-[#5548d7]">
              Currently assigned to{" "}
              {existingReview.reviewer?.name ||
                `User #${existingReview.reviewer_id}`}
              {existingReview.locked
                ? " (locked)"
                : existingReview.submitted_at
                ? " (submitted)"
                : ""}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="m-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#edf0f5] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-[11px] font-bold text-[#59657d] hover:bg-[#f5f6fa] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !reviewerId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Assigning…
                </>
              ) : (
                <>
                  <UserPlus size={13} />{" "}
                  {existingReview ? "Reassign reviewer" : "Assign reviewer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Submissions Modal
 * ------------------------------------------------------------------ */
function SubmissionsModal({ open, conference, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [error, setError] = useState("");
  const [assignTarget, setAssignTarget] = useState(null);

  const loadAll = useCallback(async () => {
    if (!conference?.id) return;
    setLoading(true);
    setError("");
    try {
      const [subsRes, revsRes] = await Promise.all([
        submissionsApi.getAll({
          conference_id: conference.id,
          per_page: 100,
        }),
        reviewsApi.getAll({ per_page: 100 }).catch(() => []),
      ]);

      const subs = unwrapList(subsRes);
      setSubmissions(subs);

      const subIds = new Set(subs.map((s) => Number(s.id)));
      setReviews(
        unwrapList(revsRes).filter((r) =>
          subIds.has(Number(r.submission_id)),
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conference?.id]);

  useEffect(() => {
    if (!open || !conference) return;
    loadAll();
  }, [open, conference, loadAll]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoadingReviewers(true);
    usersApi
      .getReviewers()
      .then((res) => {
        if (alive) setReviewers(unwrapList(res));
      })
      .catch(() => {
        if (alive) setReviewers([]);
      })
      .finally(() => {
        if (alive) setLoadingReviewers(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open || !conference) return null;

  const reviewBySubmission = (id) =>
    reviews.find((r) => Number(r.submission_id) === Number(id));

  const handleAssigned = async () => {
    await loadAll();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/55 p-4 backdrop-blur-sm"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="max-h-[92vh] w-full max-w-[900px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]">
          <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] p-5 sm:p-6">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
                Manage submissions
              </span>
              <h2 className="mb-0 mt-1 truncate text-[16px] font-bold tracking-[-.02em] text-[#0d1b3d]">
                {conference.name}
              </h2>
              <p className="mt-1 text-[10px] text-[#8993a6]">
                {conference.code || ""} ·{" "}
                {submissions.length} submission
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3]"
            >
              <X size={17} />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
                <Loader2 className="mr-2 animate-spin" size={18} /> Loading
                submissions…
              </div>
            ) : error ? (
              <div className="p-6">
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
                >
                  {error}
                </p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={22} className="mx-auto text-[#aeb6c6]" />
                <h3 className="mb-1 mt-3 text-[13px] font-bold text-[#0d1b3d]">
                  No submissions yet
                </h3>
                <p className="m-0 text-[10px] text-[#8993a6]">
                  Once authors submit proposals, they will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#edf0f5]">
                {submissions.map((s) => {
                  const status = s.status || "pending";
                  const review = reviewBySubmission(s.id);
                  const assignedName =
                    review?.reviewer?.name ||
                    (review?.reviewer_id
                      ? `User #${review.reviewer_id}`
                      : null);
                  const reviewState = review
                    ? review.locked
                      ? "Locked"
                      : review.submitted_at
                      ? "Submitted"
                      : "Pending"
                    : null;

                  return (
                    <li key={s.id} className="p-5 sm:px-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f1efff] text-[#5b4fe3]">
                            <FileText size={16} />
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[12px] text-[#1c2a4a]">
                              {s.title || `Submission #${s.id}`}
                            </strong>
                            <p className="mb-0 mt-0.5 text-[10px] text-[#8993a6]">
                              #{s.id} ·{" "}
                              {s.author?.name ||
                                s.author_name ||
                                "Unknown author"}{" "}
                              · {s.track || "General track"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                              STATUS_STYLES[status] || STATUS_STYLES.pending
                            }`}
                          >
                            {STATUS_LABELS[status] || status}
                          </span>

                          <button
                            type="button"
                            onClick={() => setAssignTarget(s)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5548d7] transition hover:bg-[#e4e1ff]"
                          >
                            <UserPlus size={12} />{" "}
                            {review ? "Reassign" : "Assign reviewer"}
                          </button>
                        </div>
                      </div>

                      {review && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#fafbfe] px-3 py-2 text-[10px] text-[#536079]">
                          <Users size={12} className="text-[#aeb6c6]" />
                          <span className="font-bold">
                            Reviewer: {assignedName}
                          </span>
                          {reviewState && (
                            <span className="rounded-full bg-white px-2 py-0.5 font-extrabold uppercase tracking-wide text-[9px] text-[#5548d7] shadow-sm">
                              {reviewState}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0f5] bg-[#fafbfe] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dfe4ed] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#59657d] hover:bg-[#f5f6fa]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <AssignReviewerModal
        open={!!assignTarget}
        submission={assignTarget}
        reviewers={reviewers}
        loadingReviewers={loadingReviewers}
        existingReview={
          assignTarget ? reviewBySubmission(assignTarget.id) : null
        }
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function OrganiserConferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [managing, setManaging] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await conferencesApi.getAll({ per_page: 100 });
      const mine = unwrapList(res).filter(
        (c) =>
          Number(c.organiser_id) === Number(user?.id) ||
          Number(c.organiser?.id) === Number(user?.id),
      );
      setItems(mine);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = location.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!q || (c.name || "").toLowerCase().includes(q)) &&
        (!l ||
          (c.city || "").toLowerCase().includes(l) ||
          (c.country || "").toLowerCase().includes(l)),
    );
  }, [items, query, location]);

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await conferencesApi.remove(c.id);
      await load();
    } catch (e) {
      alert(e?.message || "Unable to delete conference.");
    }
  };

  const inputBase =
    "h-10 rounded-[10px] border border-[#e2e6ee] bg-[#fafbfe] text-[11px] outline-none dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white";

  return (
    <OrganiserLayout>
      <section className="rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6] dark:text-[#a9a2ff]">
              Conference management
            </span>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white">
              All my conferences
            </h2>
          </div>
          <button
            onClick={() => navigate("/create-conference")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
          >
            <Plus size={16} /> New conference
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-[#edf0f5] p-5 dark:border-[#1e293b] sm:p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className={`${inputBase} w-full pl-9 pr-3`}
            />
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter: location…"
            className={`${inputBase} w-[220px] px-3`}
          />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20 text-[12px] font-semibold text-[#7c879a] dark:text-[#94a3b8]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading
            conferences…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays
              size={22}
              className="mx-auto text-[#aab2c0] dark:text-[#64748b]"
            />
            <h3 className="mb-1 mt-3 text-sm font-bold text-[#0d1b3d] dark:text-white">
              No conferences found
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6] dark:text-[#94a3b8]">
              Create your first conference or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {filtered.map((c) => (
              <article
                key={c.id}
                className="flex flex-col rounded-[17px] border border-[#e9ecf2] bg-[#fafbfe] p-5 dark:border-[#1e293b] dark:bg-[#0b1224]"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#6757f5] dark:text-[#a9a2ff]">
                  {c.code}
                </span>
                <h3 className="mb-0 mt-1 line-clamp-2 text-sm font-bold text-[#0d1b3d] dark:text-white">
                  {c.name}
                </h3>
                <p className="mb-0 mt-2 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <CalendarDays size={12} /> {dateLabel(c.start_date)} —{" "}
                  {dateLabel(c.end_date)}
                </p>
                <p className="mb-0 mt-1 flex items-center gap-1.5 text-[10px] text-[#7e899c] dark:text-[#94a3b8]">
                  <MapPin size={12} /> {c.city}, {c.country}
                </p>

                <button
                  onClick={() => setManaging(c)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-3 py-2 text-[10px] font-extrabold text-white shadow-[0_8px_20px_rgba(103,87,245,.22)] transition hover:-translate-y-px"
                >
                  <Eye size={12} /> View submissions & assign reviewers
                </button>

                <div className="mt-2 flex gap-2 border-t border-[#edf0f5] pt-4 dark:border-[#1e293b]">
                  <button
                    onClick={() => navigate(`/edit-conference/${c.id}`)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dfe4ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#58647b] transition hover:-translate-y-px dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#94a3b8]"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-red-700 transition hover:-translate-y-px dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
                    aria-label="Delete conference"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <SubmissionsModal
        open={!!managing}
        conference={managing}
        onClose={() => setManaging(null)}
      />
    </OrganiserLayout>
  );
}