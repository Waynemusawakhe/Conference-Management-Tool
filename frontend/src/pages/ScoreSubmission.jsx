import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  Lock,
  Send,
  Star,
  X,
  Zap,
} from "lucide-react";
import ReviewerLayout from "../components/ReviewerLayout";
import { useAuth } from "../context/AuthContext";
import { reviewsApi } from "../api/reviewsApi";
import { tokenStore } from "../api/client";

/* Score range — provisional until the backend confirms the range. */
const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const SCORE_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

const RECOMMENDATIONS = [
  {
    value: "accept",
    label: "Accept",
    desc: "Ready for publication",
    icon: CheckCircle2,
    accent: "from-[#10b981] to-[#34d399]",
  },
  {
    value: "revise",
    label: "Revise",
    desc: "Needs corrections",
    icon: Lightbulb,
    accent: "from-[#f59e0b] to-[#fbbf24]",
  },
  {
    value: "reject",
    label: "Reject",
    desc: "Not suitable",
    icon: X,
    accent: "from-[#ef4444] to-[#f87171]",
  },
];

/* ------------------------------------------------------------------ *
 * Inline field error
 * ------------------------------------------------------------------ */
function FieldError({ errors, name }) {
  const messages = errors?.[name];
  if (!messages?.length) return null;
  return (
    <small role="alert" className="mt-1 block text-[11px] font-semibold text-[#b13a3a]">
      {messages.join(" ")}
    </small>
  );
}

/* ------------------------------------------------------------------ *
 * Status badge
 * ------------------------------------------------------------------ */
function StatusBadge({ state }) {
  const meta = {
    pending: {
      label: "Pending",
      chip: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]",
      dot: "bg-[#9b7414]",
    },
    submitted: {
      label: "Submitted",
      chip: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]",
      dot: "bg-[#5548d7]",
    },
    locked: {
      label: "Locked",
      chip: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]",
      dot: "bg-[#18794e]",
    },
  }[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successKind, setSuccessKind] = useState(null);

  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("accept");

  const baselineRef = useRef(null);

  const [blobUrl, setBlobUrl] = useState(null);
  const [fileState, setFileState] = useState("idle");
  const [fileError, setFileError] = useState("");

  // 🔴 NEW — controls the custom confirm modal
  const [confirmState, setConfirmState] = useState(null);
  // confirmState shape:
  // { kind: "submit" | "lock", title, message, confirmLabel, tone, onConfirm }

  const displayName = user?.name ?? user?.full_name ?? "Reviewer";

  /* ---- Load review ---------------------------------------------- */
  useEffect(() => {
    if (typeof reviewsApi?.getById !== "function") {
      setError("reviewsApi.getById is not defined.");
      setErrorKind("generic");
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setFieldErrors({});

    (async () => {
      try {
        const response = await reviewsApi.getById(id);
        const data = response?.data ?? response;
        const review = data?.data ?? data ?? null;

        if (!alive) return;
        if (!review) {
          setError(`No review found with ID ${id}.`);
          setErrorKind("notFound");
          return;
        }

        setPaper(review);

        const initialScore = review.score != null ? Number(review.score) : 3;
        const initialComments = review.comments ?? review.comment ?? "";
        const initialRecommendation = review.recommendation
          ? String(review.recommendation).toLowerCase()
          : "accept";

        setScore(initialScore);
        setComments(initialComments);
        setRecommendation(initialRecommendation);

        baselineRef.current = {
          score: initialScore,
          comments: initialComments,
          recommendation: initialRecommendation,
        };
      } catch (err) {
        if (!alive) return;
        console.error("[ScoreSubmission] load failed:", err);

        const status = err?.status;
        if (status === 403) {
          setError("You don't have access to this review.");
          setErrorKind("forbidden");
        } else if (status === 404) {
          setError("This review no longer exists.");
          setErrorKind("notFound");
        } else if (status === 401) {
          setError("Your session has expired. Please log in again.");
          setErrorKind("generic");
        } else {
          setError(err?.message ?? "Unable to load this review.");
          setErrorKind("generic");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const locked = Boolean(paper?.locked ?? paper?.is_locked);
  const alreadySubmitted = Boolean(paper?.submitted_at ?? paper?.submittedAt);
  const reviewState = locked ? "locked" : alreadySubmitted ? "submitted" : "pending";

  const dirty = useMemo(() => {
    if (locked) return false;
    const base = baselineRef.current;
    if (!base) return false;
    return (
      base.score !== score ||
      base.comments !== comments ||
      base.recommendation !== recommendation
    );
  }, [score, comments, recommendation, locked]);

  const submission = paper?.submission ?? {};
  const submissionId =
    paper?.submission_id ?? submission?.id ?? paper?.submission?.id ?? null;
  const title = submission?.title ?? paper?.title ?? `Review #${id}`;
  const abstract = submission?.abstract ?? paper?.abstract ?? "";

  const fileUrl = submissionId
    ? `${import.meta.env.VITE_API_BASE_URL}/submissions/${submissionId}/file`
    : null;

  const fileName = `submission-${submissionId ?? id}.pdf`;

  /* Fetch file with bearer token */
  useEffect(() => {
    if (!fileUrl) {
      setFileState("idle");
      setBlobUrl(null);
      setFileError("");
      return;
    }

    let objectUrl = null;
    let cancelled = false;

    (async () => {
      setFileState("loading");
      setFileError("");

      try {
        const token = tokenStore.get();
        const response = await fetch(fileUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setFileState("ready");
      } catch (err) {
        if (cancelled) return;

        const isNetworkError =
          err instanceof TypeError && /failed to fetch/i.test(err.message);

        console.error("[ScoreSubmission] file fetch failed:", {
          fileUrl,
          error: err,
        });

        if (isNetworkError) {
          let origin = fileUrl;
          try {
            origin = new URL(fileUrl).origin;
          } catch {}
          setFileError(
            `Cannot reach ${origin}. This is a CORS or wrong-host problem, ` +
              `not a permission problem.`
          );
        } else {
          setFileError(err.message);
        }
        setFileState("error");
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  /* ============================================================== *
   * 🔴 CHANGED — Submit flow now opens a styled modal first.
   *    Actual network call is in doSubmit().
   * ============================================================== */
  function handleSubmit(e) {
    e.preventDefault();
    if (locked || submitting) return;

    setConfirmState({
      kind: "submit",
      title: alreadySubmitted ? "Update this review?" : "Submit this review?",
      message: alreadySubmitted
        ? "Your previous submission will be replaced with the new score, comments, and recommendation."
        : "Your evaluation will be sent to the organiser. You can still update it before locking.",
      confirmLabel: alreadySubmitted ? "Update review" : "Submit review",
      tone: "primary",
      onConfirm: doSubmit,
    });
  }

  async function doSubmit() {
    setConfirmState(null);

    setSubmitting(true);
    setError(null);
    setErrorKind(null);
    setFieldErrors({});

    try {
      if (typeof reviewsApi?.submit !== "function") {
        throw { message: "reviewsApi.submit is not defined." };
      }

      await reviewsApi.submit(id, {
        score: Number(score),
        comments: comments.trim(),
        recommendation,
      });

      const response = await reviewsApi.getById(id);
      const data = response?.data ?? response;
      const fresh = data?.data ?? data ?? null;
      setPaper(fresh);

      baselineRef.current = { score, comments, recommendation };
      setSuccessKind("submitted");
    } catch (err) {
      console.error("[ScoreSubmission] submit failed:", err);
      const status = err?.status;

      if (status === 422 && err?.errors) {
        setFieldErrors(err.errors);
        setError(err.message ?? "Please fix the highlighted fields.");
        setErrorKind("validation");
      } else if (status === 403) {
        setError("You can't submit this review.");
        setErrorKind("forbidden");
      } else if (status === 404) {
        setError("This review no longer exists.");
        setErrorKind("notFound");
      } else if (status === 401) {
        setError("Your session has expired. Please log in again.");
        setErrorKind("generic");
      } else {
        setError(err?.message ?? "Failed to submit review.");
        setErrorKind("generic");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ============================================================== *
   * 🔴 CHANGED — Lock flow also uses the modal.
   * ============================================================== */
  function handleLock() {
    if (locking) return;

    setConfirmState({
      kind: "lock",
      title: "Lock this review?",
      message:
        "Locking is permanent. Once locked, you cannot edit your score, comments, or recommendation.",
      confirmLabel: "Lock review",
      tone: "warning",
      onConfirm: doLock,
    });
  }

  async function doLock() {
    setConfirmState(null);

    setLocking(true);
    setError(null);
    setErrorKind(null);

    try {
      if (typeof reviewsApi?.lock !== "function") {
        throw { message: "reviewsApi.lock is not defined." };
      }
      await reviewsApi.lock(id);

      const response = await reviewsApi.getById(id);
      const data = response?.data ?? response;
      setPaper(data?.data ?? data ?? null);
      setSuccessKind("locked");
    } catch (err) {
      console.error("[ScoreSubmission] lock failed:", err);
      setError(err?.message ?? "Failed to lock review.");
      setErrorKind("generic");
    } finally {
      setLocking(false);
    }
  }
  /* 🔴 END CHANGED */

  const wordCount = comments.trim()
    ? comments.trim().split(/\s+/).length
    : 0;

  /* ---- Render ---------------------------------------------------- */
  return (
    <ReviewerLayout>
      <style>{`
        @keyframes cmtFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cmtScaleIn {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cmtStarPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(.92); }
          100% { transform: scale(1); }
        }
        .cmt-fade-up   { animation: cmtFadeUp .5s cubic-bezier(.22,1,.36,1) both; }
        .cmt-scale-in  { animation: cmtScaleIn .35s cubic-bezier(.22,1,.36,1) both; }
        .cmt-star-pop  { animation: cmtStarPop .45s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {/* Header */}
      <div className="cmt-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/reviewer-dashboard")}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,.28)] transition hover:-translate-y-px hover:bg-[#1d4ed8]"
            >
              <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
              Back to dashboard
            </button>
            {paper && <StatusBadge state={reviewState} />}
          </div>
          <h1 className="m-0 mt-3 text-[22px] font-bold tracking-[-.03em] text-[#1c2a4a]">
            {title}
          </h1>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {dirty && alreadySubmitted && !locked && (
        <div className="cmt-fade-up flex items-center gap-2 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-2.5 text-[11px] font-semibold text-[#1d4ed8]">
          <Zap size={13} className="animate-pulse" />
          You have unsaved changes — remember to update your review.
        </div>
      )}

      {/* Persistent "Submitted" panel */}
      {alreadySubmitted && !locked && !loading && (
        <div className="cmt-fade-up flex flex-col gap-3 rounded-2xl border border-[#cfd0ff] bg-gradient-to-br from-[#f0efff] to-[#e8e6ff] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#5548d7] shadow-[0_6px_16px_rgba(85,72,215,.18)]">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <strong className="block text-[13px] font-extrabold text-[#3b2fa8]">
                Review submitted
              </strong>
              <span className="mt-0.5 block text-[11px] leading-5 text-[#5548d7]/85">
                The organiser can now see your score. You can still update it, or lock it when you're ready.
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/reviewer-dashboard")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,.28)] transition hover:-translate-y-px hover:bg-[#1d4ed8]"
          >
            <ArrowLeft size={13} /> Back to dashboard
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid min-h-[40vh] place-items-center text-sm text-[#66728b]">
          Loading review…
        </div>
      )}

      {/* Load error */}
      {!loading && error && !paper && (
        <div className="cmt-scale-in rounded-2xl border border-[#f87171] bg-[#fef2f2] p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-[#b13a3a]" />
          <h2 className="mt-3 text-[15px] font-bold text-[#991b1b]">
            {errorKind === "forbidden"
              ? "Access denied"
              : errorKind === "notFound"
              ? "Review not found"
              : "Couldn't load this review"}
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[12px] leading-6 text-[#991b1b]">
            {error}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => navigate("/reviewer-dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1d4ed8]"
            >
              <ArrowLeft size={13} /> Back to dashboard
            </button>
          </div>
        </div>
      )}

      {paper && (
        <>
          {error && (
            <div
              className={`cmt-fade-up flex items-start gap-3 rounded-xl border p-4 text-[12px] ${
                errorKind === "validation"
                  ? "border-[#e9d9a7] bg-[#fff9e9] text-[#7a5c10]"
                  : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
              }`}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {locked && (
            <div className="cmt-fade-up flex items-center gap-2 rounded-xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-[12px] font-semibold text-[#18794e]">
              <Lock size={16} /> This review is locked. No further changes are possible.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ============ Submission ============ */}
            <section
              className="cmt-fade-up flex flex-col gap-5 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] transition hover:shadow-[0_14px_40px_rgba(15,28,65,.06)]"
              style={{ animationDelay: "60ms" }}
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#dbeafe] to-[#e0e7ff] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#1e40af]">
                  <FileText size={11} /> Submission details
                </span>
              </div>

              <div>
                <strong className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
                  Abstract
                </strong>
                <p className="m-0 rounded-xl border border-[#eef1f7] bg-gradient-to-br from-[#fafbff] to-[#f4f6fb] p-4 text-[12px] leading-6 text-[#374151]">
                  {abstract || "No abstract available for this submission."}
                </p>
              </div>

              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <strong className="block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
                    Paper document
                  </strong>
                  {fileState === "ready" && blobUrl && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={blobUrl}
                        download={fileName}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-1.5 text-[10px] font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,.55)] transition hover:-translate-y-px hover:bg-[#1d4ed8]"
                      >
                        <Download size={12} /> Download
                      </a>
                      <a
                        href={blobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e8f0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#43506a] transition hover:bg-[#fafbff]"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  )}
                </div>

                {!fileUrl && (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] p-6 text-center">
                    <FileText size={28} className="text-[#aeb6c6]" />
                    <strong className="text-[12px] font-bold text-[#43506a]">
                      No document attached
                    </strong>
                    <span className="max-w-[280px] text-[11px] leading-5 text-[#8993a6]">
                      This submission doesn't have a file attached.
                    </span>
                  </div>
                )}

                {fileUrl && fileState === "loading" && (
                  <div className="flex h-[400px] items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f9fafb] text-[12px] font-semibold text-[#8a95a8]">
                    Loading document…
                  </div>
                )}

                {fileUrl && fileState === "ready" && blobUrl && (
                  <iframe
                    src={blobUrl}
                    title="Paper Document"
                    className="h-[500px] w-full rounded-xl border border-[#e5e7eb]"
                  />
                )}

                {fileUrl && fileState === "error" && (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-[#e9d9a7] bg-[#fff9e9] p-6 text-center">
                    <AlertCircle size={28} className="text-[#9b7414]" />
                    <strong className="text-[12px] font-bold text-[#7a5c10]">
                      Document is unavailable
                    </strong>
                    <span className="max-w-[420px] text-[11px] leading-5 text-[#7a5c10]/85">
                      {fileError}
                    </span>
                    <code className="max-w-full break-all rounded-lg bg-white px-3 py-2 text-[10px] text-[#7a5c10]">
                      {fileUrl}
                    </code>
                  </div>
                )}
              </div>
            </section>

            {/* ============ Form ============ */}
            <section
              className="cmt-fade-up flex flex-col rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] transition hover:shadow-[0_14px_40px_rgba(15,28,65,.06)]"
              style={{ animationDelay: "140ms" }}
            >
              <h3 className="m-0 mb-6 flex items-center gap-2 border-b border-[#edf0f5] pb-4 text-[16px] font-bold">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#60a5fa] text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,.55)]">
                  <Star size={13} />
                </span>
                {locked ? "Your review" : "Evaluation & scoring"}
              </h3>

              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col justify-between gap-6"
              >
                {/* Score */}
                <div>
                  <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]">
                    Score — 1 Poor to 5 Excellent
                  </label>
                  <div className="flex gap-2.5">
                    {SCORE_OPTIONS.map((num) => {
                      const active = score === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={locked}
                          onClick={() => setScore(num)}
                          className={`group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border py-3 text-sm font-bold transition-all duration-200 ${
                            active
                              ? "scale-[1.05] border-transparent bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-white shadow-[0_14px_30px_-8px_rgba(37,99,235,.6)]"
                              : "border-[#d1d5db] bg-white text-[#374151] hover:-translate-y-0.5 hover:border-[#2563eb] hover:bg-[#eff6ff]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <Star
                            size={16}
                            className={`transition ${
                              active
                                ? "cmt-star-pop fill-white"
                                : "text-[#9ca3af] group-hover:text-[#2563eb]"
                            }`}
                          />
                          <span className="text-[13px] font-extrabold">{num}</span>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-wider ${
                              active ? "text-white/85" : "text-[#9ca3af]"
                            }`}
                          >
                            {SCORE_LABELS[num - 1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError errors={fieldErrors} name="score" />
                </div>

                {/* Recommendation */}
                <div>
                  <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]">
                    Final recommendation
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {RECOMMENDATIONS.map((r) => {
                      const active = recommendation === r.value;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          disabled={locked}
                          onClick={() => setRecommendation(r.value)}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-200 ${
                            active
                              ? `scale-[1.03] border-transparent bg-gradient-to-br ${r.accent} text-white shadow-[0_14px_30px_-8px_rgba(15,28,65,.4)]`
                              : "border-[#d1d5db] bg-white text-[#374151] hover:-translate-y-0.5 hover:border-[#93c5fd]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <Icon
                            size={16}
                            className={
                              active
                                ? "text-white"
                                : "text-[#9ca3af] transition group-hover:text-[#2563eb]"
                            }
                          />
                          <strong className="text-[11px] font-extrabold">
                            {r.label}
                          </strong>
                          <span
                            className={`text-[8px] font-semibold leading-tight ${
                              active ? "text-white/85" : "text-[#8a95a8]"
                            }`}
                          >
                            {r.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError errors={fieldErrors} name="recommendation" />
                </div>

                {/* Comments */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="comments"
                      className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]"
                    >
                      Review comments
                    </label>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        wordCount < 10 ? "text-[#a55b25]" : "text-[#18794e]"
                      }`}
                    >
                      {wordCount} words
                    </span>
                  </div>
                  <textarea
                    id="comments"
                    rows={6}
                    required
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={locked}
                    placeholder="Explain your reasoning, strengths, and areas for improvement…"
                    className="w-full resize-y rounded-xl border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10 disabled:bg-[#f7f8fc] disabled:text-[#8a95a8]"
                  />
                  <FieldError errors={fieldErrors} name="comments" />
                </div>

                {/* Actions */}
                {!locked && (
                  <>
                    {!alreadySubmitted ? (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-4 text-sm font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-8px_rgba(37,99,235,.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <Send size={15} />
                        {submitting ? "Submitting review…" : "Submit final review"}
                      </button>
                    ) : (
                      <div className="mt-auto flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => navigate("/reviewer-dashboard")}
                          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-4 text-sm font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-8px_rgba(37,99,235,.65)]"
                        >
                          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                          <ArrowLeft size={15} />
                          Back to dashboard
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="submit"
                            disabled={submitting || !dirty}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4e8f0] bg-white py-3 text-[12px] font-extrabold text-[#43506a] transition hover:-translate-y-px hover:border-[#93c5fd] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send size={13} />
                            {submitting ? "Saving…" : "Update review"}
                          </button>
                          <button
                            type="button"
                            onClick={handleLock}
                            disabled={locking}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#bfdbfe] bg-[#eff6ff] py-3 text-[12px] font-extrabold text-[#1d4ed8] transition hover:-translate-y-px hover:border-[#93c5fd] hover:bg-[#dbeafe] disabled:opacity-50"
                          >
                            <Lock size={13} />
                            {locking ? "Locking…" : "Lock review"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {locked && (
                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-[#effaf4] py-3.5 text-[12px] font-bold text-[#18794e]">
                      <CheckCircle2 size={15} /> Review complete
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/reviewer-dashboard")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3.5 text-[13px] font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
                    >
                      <ArrowLeft size={14} /> Back to dashboard
                    </button>
                  </div>
                )}
              </form>
            </section>
          </div>
        </>
      )}

      <SuccessOverlay
        kind={successKind}
        onDismiss={() => setSuccessKind(null)}
      />

      {/* 🔴 NEW — custom confirm modal (replaces window.confirm) */}
      <ConfirmDialog
        state={confirmState}
        onCancel={() => setConfirmState(null)}
      />
    </ReviewerLayout>
  );
}

/* ------------------------------------------------------------------ *
 * 🔴 NEW — ConfirmDialog
 *
 * Replaces window.confirm() with a styled modal that matches the app.
 * Driven by confirmState: { kind, title, message, confirmLabel, tone,
 * onConfirm }. Renders nothing when state is null.
 * ------------------------------------------------------------------ */
function ConfirmDialog({ state, onCancel }) {
  // Close on Escape
  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, onCancel]);

  if (!state) return null;

  const isLock = state.kind === "lock";
  const Icon = isLock ? Lock : Send;

  // Tone styling — lock uses a warning look, submit uses primary blue.
  const toneStyles = isLock
    ? {
        iconBg: "bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]",
        iconShadow: "shadow-[0_18px_40px_-12px_rgba(245,158,11,.65)]",
        confirmBtn:
          "bg-gradient-to-br from-[#f59e0b] to-[#f59e0b] hover:from-[#d97706] hover:to-[#d97706] shadow-[0_16px_36px_-8px_rgba(245,158,11,.65)]",
      }
    : {
        iconBg: "bg-gradient-to-br from-[#2563eb] to-[#60a5fa]",
        iconShadow: "shadow-[0_18px_40px_-12px_rgba(37,99,235,.65)]",
        confirmBtn:
          "bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)]",
      };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-md"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <style>{`
        @keyframes cmtConfirmIn {
          0%   { opacity: 0; transform: scale(.9) translateY(12px); }
          60%  { transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cmt-confirm-in {
          animation: cmtConfirmIn .32s cubic-bezier(.22,1,.36,1) both;
        }
      `}</style>

      <div
        className="cmt-confirm-in relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white p-7 shadow-[0_40px_100px_rgba(7,19,47,.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <span
            className={`grid h-14 w-14 place-items-center rounded-2xl text-white ${toneStyles.iconBg} ${toneStyles.iconShadow}`}
          >
            <Icon size={22} />
          </span>
        </div>

        {/* Title + message */}
        <h2
          id="confirm-title"
          className="mt-5 text-center text-[18px] font-extrabold tracking-[-.025em] text-[#1c2a4a]"
        >
          {state.title}
        </h2>
        <p className="mx-auto mt-2 max-w-[340px] text-center text-[12px] leading-6 text-[#66728b]">
          {state.message}
        </p>

        {/* Buttons */}
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="order-2 inline-flex w-full items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-5 py-3 text-[12px] font-extrabold text-[#43506a] transition hover:-translate-y-px hover:border-[#c9cfe0] hover:bg-[#fafbff] sm:order-1 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={state.onConfirm}
            className={`order-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[12px] font-extrabold text-white transition hover:-translate-y-px sm:order-2 sm:w-auto ${toneStyles.confirmBtn}`}
          >
            <Icon size={14} />
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
/* 🔴 END NEW */

/* ------------------------------------------------------------------ *
 * Success overlay
 * ------------------------------------------------------------------ */
function SuccessOverlay({ kind, onDismiss }) {
  useEffect(() => {
    if (!kind) return;
    const t = setTimeout(onDismiss, 3400);
    return () => clearTimeout(t);
  }, [kind, onDismiss]);

  if (!kind) return null;

  const isLock = kind === "locked";
  const headline = isLock ? "Review locked" : "Review submitted!";
  const subtext = isLock
    ? "This review is final and can no longer be edited."
    : "Your evaluation has been sent to the organiser.";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#07132f]/70 p-4 backdrop-blur-md"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <style>{`
        @keyframes cmtConfetti {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes cmtBigTick {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes cmtBigRing {
          0%   { transform: scale(.6); opacity: .7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes cmtCardIn {
          0%   { opacity: 0; transform: scale(.85) translateY(20px); }
          60%  { transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cmt-card-in { animation: cmtCardIn .5s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div
        className="cmt-card-in relative w-full max-w-[500px] overflow-hidden rounded-[28px] bg-white p-10 text-center shadow-[0_40px_100px_rgba(7,19,47,.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {Array.from({ length: 22 }).map((_, i) => {
          const angle = (i / 22) * 2 * Math.PI;
          const distance = 160 + Math.random() * 80;
          return (
            <span
              key={i}
              className="pointer-events-none absolute left-1/2 top-[140px] h-2 w-2 rounded-full"
              style={{
                background: ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"][i % 5],
                "--tx": `${Math.cos(angle) * distance}px`,
                "--ty": `${Math.sin(angle) * distance}px`,
                "--rot": `${Math.random() * 720 - 360}deg`,
                animation: `cmtConfetti ${1.4 + Math.random() * 0.6}s cubic-bezier(.22,1,.36,1) forwards`,
                animationDelay: `${Math.random() * 0.15}s`,
              }}
            />
          );
        })}

        <div className="relative mx-auto grid h-36 w-36 place-items-center">
          <span
            className="absolute inset-0 rounded-full bg-[#10b981]/30"
            style={{ animation: "cmtBigRing 1.6s ease-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-full bg-[#10b981]/20"
            style={{ animation: "cmtBigRing 1.6s ease-out .4s infinite" }}
          />
          <div className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] shadow-[0_24px_60px_-12px_rgba(16,185,129,.7)]">
            <svg width="76" height="76" viewBox="0 0 32 32" fill="none">
              <path
                d="M7 17.2 L13.2 23.4 L25 11.6"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: "cmtBigTick .7s .3s cubic-bezier(.65,0,.35,1) forwards",
                }}
              />
            </svg>
          </div>
        </div>

        <h2 className="mt-7 text-[26px] font-extrabold tracking-[-.035em] text-[#1c2a4a]">
          {headline}
        </h2>
        <p className="mx-auto mt-2 max-w-[360px] text-[13px] leading-6 text-[#66728b]">
          {subtext}
        </p>

        <button
          onClick={onDismiss}
          className="group relative mt-7 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] px-5 py-3.5 text-[13px] font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition hover:-translate-y-0.5"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <CheckCircle2 size={15} /> Continue
        </button>
      </div>
    </div>
  );
}