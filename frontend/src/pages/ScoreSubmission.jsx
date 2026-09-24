// src/pages/ScoreSubmission.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
 * File URL helpers
 * ------------------------------------------------------------------ */
function extractFileUrl(obj) {
  if (!obj) return null;
  return (
    obj.file_path ??
    obj.file_url ??
    obj.fileUrl ??
    obj.document_url ??
    obj.documentUrl ??
    obj.attachment_url ??
    obj.attachmentUrl ??
    obj.paper_url ??
    obj.paperUrl ??
    obj.file ??
    obj.document ??
    obj.attachment ??
    obj.paper ??
    null
  );
}

function resolveFileUrl(raw) {
  if (!raw) return null;
  if (typeof raw === "object") raw = raw.url ?? raw.path ?? raw.href ?? null;
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url) return null;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  let origin = "";
  try {
    origin = new URL(apiBase, window.location.origin).origin;
  } catch {
    origin = window.location.origin;
  }
  const clean = url.replace(/^\/+/, "");
  if (clean.startsWith("storage/")) return `${origin}/${clean}`;
  return `${origin}/storage/${clean}`;
}

export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);
  const [successKind, setSuccessKind] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("accept");

  const displayName = user?.name ?? user?.full_name ?? "Reviewer";

  /* ---- Load review ---- */
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (typeof reviewsApi?.getById !== "function") {
          throw new Error("reviewsApi.getById is not defined.");
        }
        const response = await reviewsApi.getById(id);
        const data = response?.data ?? response;
        const review = data?.data ?? data ?? null;
        if (!alive) return;
        if (!review) throw new Error(`No review found with ID ${id}.`);
        setPaper(review);
        if (review.score != null) setScore(Number(review.score));
        if (review.comments ?? review.comment)
          setComments(review.comments ?? review.comment ?? "");
        if (review.recommendation)
          setRecommendation(String(review.recommendation).toLowerCase());
      } catch (err) {
        console.error("[ScoreSubmission] load failed:", err);
        if (alive) setError(err?.message ?? "Unable to load this review.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const locked = Boolean(paper?.locked ?? paper?.is_locked);
  const alreadySubmitted = Boolean(
    paper?.submitted_at ??
      paper?.submittedAt ??
      paper?.comments ??
      paper?.comment ??
      paper?.recommendation
  );

  useEffect(() => {
    if (locked) return;
    setDirty(true);
  }, [score, comments, recommendation, locked]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.submit(id, {
        score: Number(score),
        comments: comments.trim(),
        recommendation,
      });
      const response = await reviewsApi.getById(id);
      const data = response?.data ?? response;
      setPaper(data?.data ?? data ?? null);
      setDirty(false);
      setSuccessKind("submitted");
    } catch (err) {
      console.error("[ScoreSubmission] submit failed:", err);
      setError(err?.message ?? "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLock() {
    if (!window.confirm("Lock this review? This cannot be undone.")) return;
    setLocking(true);
    setError(null);
    try {
      await reviewsApi.lock(id);
      const response = await reviewsApi.getById(id);
      const data = response?.data ?? response;
      setPaper(data?.data ?? data ?? null);
      setSuccessKind("locked");
    } catch (err) {
      console.error("[ScoreSubmission] lock failed:", err);
      setError(err?.message ?? "Failed to lock review.");
    } finally {
      setLocking(false);
    }
  }

  const submission = paper?.submission ?? {};
  const title = submission?.title ?? paper?.title ?? `Review #${id}`;
  const abstract = submission?.abstract ?? paper?.abstract ?? "";
  const rawFileUrl = extractFileUrl(submission) ?? extractFileUrl(paper) ?? null;
  const fileUrl = resolveFileUrl(rawFileUrl);

  // Derive download filename from the URL, keeping its original extension
  const fileName = (() => {
    if (!rawFileUrl) return `submission-${id}`;
    const clean = String(rawFileUrl).split("?")[0].split("#")[0];
    const last = clean.substring(clean.lastIndexOf("/") + 1);
    return last || `submission-${id}`;
  })();

  const wordCount = comments.trim() ? comments.trim().split(/\s+/).length : 0;

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
        @keyframes cmtRing {
          0%   { transform: scale(.5); opacity: .6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .cmt-fade-up   { animation: cmtFadeUp .5s cubic-bezier(.22,1,.36,1) both; }
        .cmt-scale-in  { animation: cmtScaleIn .35s cubic-bezier(.22,1,.36,1) both; }
        .cmt-star-pop  { animation: cmtStarPop .45s cubic-bezier(.34,1.56,.64,1); }
        .cmt-ring      { animation: cmtRing 1.1s ease-out infinite; }
      `}</style>

      {/* Back + heading */}
      <div className="cmt-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/reviewer-dashboard")}
            className="group inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,.28)] transition hover:-translate-y-px hover:bg-[#1d4ed8]"
          >
            <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
            Back to queue
          </button>
          <h1 className="m-0 mt-3 text-[22px] font-bold tracking-[-.03em] text-[#1c2a4a] dark:text-white">
            {title}
          </h1>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {dirty && !locked && alreadySubmitted && (
        <div className="cmt-fade-up flex items-center gap-2 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-2.5 text-[11px] font-semibold text-[#1d4ed8] dark:border-[#1e3a8a] dark:bg-[#0c1a35] dark:text-[#93c5fd]">
          <Zap size={13} className="animate-pulse" />
          You have unsaved changes — remember to update your review.
        </div>
      )}

      {error && !paper && (
        <div className="cmt-scale-in rounded-2xl border border-[#f87171] bg-[#fef2f2] p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-[#b13a3a]" />
          <h2 className="mt-3 text-[15px] font-bold text-[#991b1b]">
            Couldn't load this review
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[12px] leading-6 text-[#991b1b]">
            {error}
          </p>
          <button
            onClick={() => navigate("/reviewer-dashboard")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1d4ed8]"
          >
            <ArrowLeft size={13} /> Back to dashboard
          </button>
        </div>
      )}

      {paper && (
        <>
          {error && (
            <div className="cmt-fade-up flex items-start gap-3 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-4 text-[12px] text-[#b13a3a]">
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
              className="cmt-fade-up flex flex-col gap-5 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] transition hover:shadow-[0_14px_40px_rgba(15,28,65,.06)] dark:border-[#1e293b] dark:bg-[#0f172a]"
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
                <p className="m-0 rounded-xl border border-[#eef1f7] bg-gradient-to-br from-[#fafbff] to-[#f4f6fb] p-4 text-[12px] leading-6 text-[#374151] dark:border-[#1e293b] dark:from-[#0b1224] dark:to-[#0d1527] dark:text-[#cbd5e1]">
                  {abstract || "No abstract available for this submission."}
                </p>
              </div>

              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <strong className="block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
                    Paper document
                  </strong>
                  {fileUrl && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-1.5 text-[10px] font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(37,99,235,.55)] transition hover:-translate-y-px hover:bg-[#1d4ed8]"
                      >
                        <Download size={12} /> Download
                      </a>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e8f0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#43506a] transition hover:bg-[#fafbff] dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#111c33]"
                      >
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  )}
                </div>

                {fileUrl ? (
                  <iframe
                    src={fileUrl}
                    title="Paper Document"
                    className="h-[400px] w-full rounded-xl border border-[#e5e7eb] dark:border-[#1e293b]"
                  />
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] p-6 text-center dark:border-[#1e293b] dark:bg-[#0b1224]">
                    <FileText size={28} className="text-[#aeb6c6]" />
                    <strong className="text-[12px] font-bold text-[#43506a] dark:text-white">
                      No document attached
                    </strong>
                    <span className="max-w-[280px] text-[11px] leading-5 text-[#8993a6]">
                      The submission doesn't have a file, or the backend hasn't exposed it yet.
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ============ Form ============ */}
            <section
              className="cmt-fade-up flex flex-col rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] transition hover:shadow-[0_14px_40px_rgba(15,28,65,.06)] dark:border-[#1e293b] dark:bg-[#0f172a]"
              style={{ animationDelay: "140ms" }}
            >
              <h3 className="m-0 mb-6 flex items-center gap-2 border-b border-[#edf0f5] pb-4 text-[16px] font-bold dark:border-[#1e293b]">
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
                  <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280] dark:text-[#94a3b8]">
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
                              : "border-[#d1d5db] bg-white text-[#374151] hover:-translate-y-0.5 hover:border-[#2563eb] hover:bg-[#eff6ff] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#cbd5e1] dark:hover:bg-[#152b52]"
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
                </div>

                {/* Recommendation */}
                <div>
                  <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280] dark:text-[#94a3b8]">
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
                              : "border-[#d1d5db] bg-white text-[#374151] hover:-translate-y-0.5 hover:border-[#93c5fd] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#cbd5e1]"
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
                </div>

                {/* Comments */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="comments"
                      className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280] dark:text-[#94a3b8]"
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
                    className="w-full resize-y rounded-xl border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10 disabled:bg-[#f7f8fc] disabled:text-[#8a95a8] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white"
                  />
                </div>

                {!locked && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-4 text-sm font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-8px_rgba(37,99,235,.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <Send size={15} />
                    {submitting
                      ? "Submitting review…"
                      : alreadySubmitted
                      ? "Update review"
                      : "Submit final review"}
                  </button>
                )}

                {alreadySubmitted && !locked && (
                  <button
                    type="button"
                    onClick={handleLock}
                    disabled={locking}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#bfdbfe] bg-[#eff6ff] py-3.5 text-sm font-extrabold text-[#1d4ed8] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#93c5fd] hover:bg-[#dbeafe] disabled:opacity-50 dark:border-[#1e3a8a] dark:bg-[#0c1a35] dark:text-[#93c5fd] dark:hover:bg-[#152b52]"
                  >
                    <Lock size={15} /> {locking ? "Locking…" : "Lock review"}
                  </button>
                )}

                {locked && (
                  <div className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#effaf4] py-3.5 text-[12px] font-bold text-[#18794e]">
                    <CheckCircle2 size={15} /> Review complete
                  </div>
                )}
              </form>
            </section>
          </div>
        </>
      )}

      <SuccessOverlay
        kind={successKind}
        onDismiss={() => {
          setSuccessKind(null);
          navigate("/reviewer-dashboard");
        }}
      />
    </ReviewerLayout>
  );
}

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
        className="cmt-card-in relative w-full max-w-[500px] overflow-hidden rounded-[28px] bg-white p-10 text-center shadow-[0_40px_100px_rgba(7,19,47,.45)] dark:bg-[#0f172a]"
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

        <h2 className="mt-7 text-[26px] font-extrabold tracking-[-.035em] text-[#1c2a4a] dark:text-white">
          {headline}
        </h2>
        <p className="mx-auto mt-2 max-w-[360px] text-[13px] leading-6 text-[#66728b] dark:text-[#94a3b8]">
          {subtext}
        </p>

        <button
          onClick={onDismiss}
          className="group relative mt-7 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] px-5 py-3.5 text-[13px] font-extrabold text-white shadow-[0_16px_36px_-8px_rgba(37,99,235,.55)] transition hover:-translate-y-0.5"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <CheckCircle2 size={15} /> Back to my reviews
        </button>
      </div>
    </div>
  );
}