import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Focus,
  Lightbulb,
  Lock,
  Maximize2,
  Minimize2,
  Send,
  Star,
  X,
} from "lucide-react";
import ReviewerLayout from "../components/ReviewerLayout";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, tokenStore } from "../api/client";
import { reviewsApi } from "../api/reviewsApi";

const SCORE_OPTIONS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Good" },
  { value: 4, label: "Great" },
  { value: 5, label: "Excellent" },
];

const RECOMMENDATIONS = [
  { value: "accept", label: "Accept", description: "Ready for publication", icon: CheckCircle2 },
  { value: "revise", label: "Revise", description: "Needs corrections", icon: Lightbulb },
  { value: "reject", label: "Reject", description: "Not suitable", icon: X },
];

function getReview(response) {
  const payload = response?.data ?? response;
  return payload?.data ?? payload ?? null;
}

function getDocumentName(disposition, fallback) {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  let name = fallback;

  try {
    if (utf8Match?.[1]) name = decodeURIComponent(utf8Match[1]);
    else if (filenameMatch?.[1]) name = filenameMatch[1];
  } catch {
    if (filenameMatch?.[1]) name = filenameMatch[1];
  }

  return name.split(/[\\/]/).pop() || fallback;
}

function getDocumentType(contentType, filename) {
  const mimeType = contentType.toLowerCase();
  const extension = filename.split(".").pop()?.toLowerCase();

  if (mimeType.includes("pdf") || extension === "pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("officedocument") ||
    extension === "doc" ||
    extension === "docx"
  ) {
    return "word";
  }
  return "other";
}

function getDocumentError(status) {
  if (status === 401) return "Your session has expired. Sign in again, then retry the document.";
  if (status === 403) return "You don't have permission to view this submission's document.";
  if (status === 404) return "No document was found for this submission.";
  return `The document server returned an error (${status}). Please try again.`;
}

function FieldError({ errors, name }) {
  const messages = errors?.[name];
  if (!messages?.length) return null;

  return (
    <small role="alert" className="mt-1 block text-[11px] font-semibold text-[#b13a3a]">
      {messages.join(" ")}
    </small>
  );
}

function StatusBadge({ locked, submitted }) {
  const state = locked
    ? { label: "Locked", color: "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]" }
    : submitted
      ? { label: "Submitted", color: "border-[#cfd0ff] bg-[#f0efff] text-[#5548d7]" }
      : { label: "Pending", color: "border-[#e9d9a7] bg-[#fff9e9] text-[#9b7414]" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${state.color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {state.label}
    </span>
  );
}

export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewerRef = useRef(null);
  const baselineRef = useRef(null);

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadRetry, setLoadRetry] = useState(0);
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("accept");
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [fileRetry, setFileRetry] = useState(0);
  const [fileState, setFileState] = useState("idle");
  const [fileError, setFileError] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [viewerActionError, setViewerActionError] = useState("");

  const submission = paper?.submission ?? paper?.data?.submission ?? {};
  const submissionId = submission.id ?? paper?.submission_id ?? paper?.submissionId;
  const title = submission.title ?? paper?.title ?? `Review #${id}`;
  const abstract = submission.abstract ?? paper?.abstract ?? "";
  const locked = Boolean(paper?.locked ?? paper?.is_locked);
  const alreadySubmitted = Boolean(paper?.submitted_at ?? paper?.submittedAt);
  const documentUrl =
    submissionId && API_BASE_URL
      ? `${API_BASE_URL}/submissions/${encodeURIComponent(submissionId)}/file`
      : "";

  const dirty = useMemo(() => {
    const baseline = baselineRef.current;
    return Boolean(
      baseline &&
        !locked &&
        (baseline.score !== score ||
          baseline.comments !== comments ||
          baseline.recommendation !== recommendation),
    );
  }, [comments, locked, recommendation, score]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setActionError("");

    (async () => {
      try {
        const review = getReview(await reviewsApi.getById(id));
        if (!active) return;
        if (!review) {
          setLoadError(`No review was found with ID ${id}.`);
          return;
        }

        const initialScore = review.score == null ? 3 : Number(review.score);
        const initialComments = review.comments ?? review.comment ?? "";
        const initialRecommendation = String(review.recommendation ?? "accept").toLowerCase();
        setPaper(review);
        setScore(initialScore);
        setComments(initialComments);
        setRecommendation(initialRecommendation);
        baselineRef.current = {
          score: initialScore,
          comments: initialComments,
          recommendation: initialRecommendation,
        };
      } catch (error) {
        if (!active) return;
        console.error("[ScoreSubmission] review load failed:", error);
        if (error?.status === 403) {
          setLoadError("You don't have access to this review.");
        } else if (error?.status === 404) {
          setLoadError("This review no longer exists.");
        } else if (error?.status === 401) {
          setLoadError("Your session has expired. Please sign in again.");
        } else {
          setLoadError(error?.message ?? "Unable to load this review. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, loadRetry]);

  useEffect(() => {
    if (!documentUrl) {
      setFileState("idle");
      setFileUrl("");
      setFileError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    let objectUrl = "";
    setFileState("loading");
    setFileError("");
    setFileUrl("");
    setFileType("");
    setFileName("");

    (async () => {
      try {
        const token = tokenStore.get();
        const response = await fetch(documentUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(getDocumentError(response.status));

        const blob = await response.blob();
        if (!active) return;

        const contentType = response.headers.get("Content-Type") ?? blob.type;
        const mimeType = contentType.toLowerCase();
        const fallbackExtension = mimeType.includes("pdf")
          ? "pdf"
          : mimeType.includes("msword")
            ? "doc"
            : mimeType.includes("word") || mimeType.includes("officedocument")
              ? "docx"
              : "";
        const fallbackName = `submission-${submissionId ?? id}${fallbackExtension ? `.${fallbackExtension}` : ""}`;
        const name = getDocumentName(
          response.headers.get("Content-Disposition") ?? "",
          fallbackName,
        );
        const type = getDocumentType(contentType, name);
        objectUrl = URL.createObjectURL(blob);
        setFileName(name);
        setFileType(type);
        setFileUrl(objectUrl);
        setFileState("ready");
      } catch (error) {
        if (!active || error?.name === "AbortError") return;
        console.error("[ScoreSubmission] document load failed:", error);
        setFileError(
          error instanceof TypeError
            ? "The document server could not be reached. Check your connection and ask the organiser to verify file access if the problem continues."
            : error?.message ?? "The document could not be loaded. Please try again.",
        );
        setFileState("error");
      }
    })();

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentUrl, fileRetry, id, submissionId]);

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreenOpen(document.fullscreenElement === viewerRef.current);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !document.fullscreenElement) {
        setFullscreenOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function toggleFullscreen() {
    setViewerActionError("");
    if (document.fullscreenElement === viewerRef.current) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("[ScoreSubmission] exiting fullscreen failed:", error);
        setViewerActionError("Fullscreen could not be closed. Press Escape or use the browser's fullscreen controls.");
      }
      return;
    }
    if (fullscreenOpen) {
      setFullscreenOpen(false);
      return;
    }

    if (typeof viewerRef.current?.requestFullscreen !== "function") {
      setFullscreenOpen(true);
      return;
    }

    try {
      await viewerRef.current.requestFullscreen();
    } catch (error) {
      console.error("[ScoreSubmission] fullscreen request failed:", error);
      setViewerActionError("Native fullscreen was blocked by the browser. Opening the document in an expanded view instead.");
      setFullscreenOpen(true);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (locked || submitting) return;
    setConfirmAction("submit");
  }

  async function submitReview() {
    setConfirmAction(null);
    setSubmitting(true);
    setActionError("");
    setFieldErrors({});
    setSuccessMessage("");
    try {
      await reviewsApi.submit(id, {
        score: Number(score),
        comments: comments.trim(),
        recommendation,
      });
      const fresh = getReview(await reviewsApi.getById(id));
      if (fresh) setPaper(fresh);
      baselineRef.current = { score, comments, recommendation };
      setSuccessMessage("Your review has been submitted. You can update it until you lock it.");
    } catch (error) {
      console.error("[ScoreSubmission] review submit failed:", error);
      if (error?.status === 422) {
        setFieldErrors(error.errors ?? {});
        setActionError(error.message ?? "Please fix the highlighted fields.");
      } else if (error?.status === 403) {
        setActionError("You can't submit this review.");
      } else if (error?.status === 404) {
        setActionError("This review no longer exists.");
      } else if (error?.status === 401) {
        setActionError("Your session has expired. Please sign in again.");
      } else {
        setActionError(error?.message ?? "The review could not be submitted. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function lockReview() {
    setConfirmAction(null);
    setLocking(true);
    setActionError("");
    setSuccessMessage("");
    try {
      await reviewsApi.lock(id);
      const fresh = getReview(await reviewsApi.getById(id));
      if (fresh) setPaper(fresh);
      else setPaper((current) => ({ ...current, locked: true }));
      setSuccessMessage("This review is locked and can no longer be changed.");
    } catch (error) {
      console.error("[ScoreSubmission] review lock failed:", error);
      if (error?.status === 403) {
        setActionError("You can't lock this review.");
      } else if (error?.status === 404) {
        setActionError("This review no longer exists.");
      } else {
        setActionError(error?.message ?? "The review could not be locked. Please try again.");
      }
    } finally {
      setLocking(false);
    }
  }

  const wordCount = comments.trim() ? comments.trim().split(/\s+/).length : 0;
  const displayName = user?.name ?? user?.full_name ?? "Reviewer";
  const documentHeight = focusMode ? "h-[58vh] sm:h-[68vh] lg:h-[72vh]" : "h-[420px] sm:h-[500px]";

  return (
    <ReviewerLayout focusMode={focusMode}>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <header className={`flex flex-col gap-3 rounded-2xl sm:flex-row sm:items-center sm:justify-between ${focusMode ? "border border-white/10 bg-[#07132f] p-4 text-white" : ""}`}>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/reviewer-dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#1d4ed8]"
              >
                <ArrowLeft size={14} /> Back to dashboard
              </button>
              {paper && <StatusBadge locked={locked} submitted={alreadySubmitted} />}
            </div>
            <h1 className={`m-0 mt-3 text-[22px] font-bold tracking-[-.03em] ${focusMode ? "text-white" : "text-[#1c2a4a] dark:text-white"}`}>
              {title}
            </h1>
            <p className={`m-0 mt-1 text-[11px] ${focusMode ? "text-white/60" : "text-[#8993a6]"}`}>
              Review workspace · {displayName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focusMode && (
              <button
                type="button"
                onClick={() => document.getElementById("review-controls")?.scrollIntoView?.({ behavior: "smooth", block: "start" })}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d6dbe8] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#43506a] hover:border-[#8175ef] hover:text-[#4f46c7] lg:hidden"
              >
                Jump to scoring
              </button>
            )}
            <button
              type="button"
              onClick={() => setFocusMode((enabled) => !enabled)}
              aria-pressed={focusMode}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#d6dbe8] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#43506a] transition hover:border-[#8175ef] hover:text-[#4f46c7] sm:self-center"
            >
              <Focus size={14} />
              {focusMode ? "Exit Focus Mode" : "Focus Mode"}
            </button>
          </div>
        </header>

        {loading && (
          <div role="status" className="grid min-h-40 place-items-center rounded-2xl border border-[#e4e8f0] bg-white text-sm text-[#66728b]">
            Loading review…
          </div>
        )}

        {!loading && loadError && !paper && (
          <div role="alert" className="rounded-2xl border border-[#f1c8c8] bg-[#fff2f2] p-6 text-[#8f2d2d]">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <strong className="block text-[13px]">Couldn't open this review</strong>
                <p className="mb-0 mt-1 text-[12px] leading-5">{loadError}</p>
                {loadError.includes("expired") ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-4 rounded-lg bg-[#8f2d2d] px-3 py-2 text-[11px] font-bold text-white"
                  >
                    Sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLoadRetry((attempt) => attempt + 1)}
                    className="mt-4 rounded-lg bg-[#8f2d2d] px-3 py-2 text-[11px] font-bold text-white"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {paper && (
          <>
            {locked && (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-[12px] font-semibold text-[#18794e]">
                <Lock size={16} className="mt-0.5 shrink-0" />
                <span>This review is locked. Your submitted score, recommendation, and comments are available as read-only.</span>
              </div>
            )}
            {alreadySubmitted && !locked && (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-[#cfd0ff] bg-[#f0efff] p-4 text-[12px] font-semibold text-[#5548d7]">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>Review submitted. You can update it before locking it as final.</span>
              </div>
            )}
            {successMessage && (
              <div role="status" className="rounded-xl border border-[#bfe5d1] bg-[#effaf4] p-3 text-[12px] font-semibold text-[#18794e]">
                {successMessage}
              </div>
            )}
            {actionError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#f1c8c8] bg-[#fff2f2] p-4 text-[12px] text-[#b13a3a]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className={`grid items-start gap-4 sm:gap-6 ${focusMode ? "lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]" : "lg:grid-cols-2"}`}>
              <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eff6ff] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#1e40af]">
                    <FileText size={11} /> Submission document
                  </span>
                  <h2 className="mb-0 mt-3 text-[15px] font-bold text-[#1c2a4a] dark:text-white">{title}</h2>
                </div>

                {abstract && !focusMode && (
                  <div>
                    <strong className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">Abstract</strong>
                    <p className="m-0 rounded-xl border border-[#eef1f7] bg-[#fafbff] p-4 text-[12px] leading-6 text-[#374151] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#cbd5e1]">
                      {abstract}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">Paper document</strong>
                  {fileState === "ready" && fileUrl && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a
                        href={fileUrl}
                        download={fileName}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-1.5 text-[10px] font-extrabold text-white hover:bg-[#1d4ed8]"
                      >
                        <Download size={12} /> Download
                      </a>
                      {fileType === "pdf" && (
                        <>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e4e8f0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#43506a] hover:bg-[#fafbff]"
                          >
                            <ExternalLink size={12} /> Open PDF
                          </a>
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={fullscreenOpen ? "Exit fullscreen document" : "View document fullscreen"}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e4e8f0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#43506a] hover:bg-[#fafbff]"
                          >
                            {fullscreenOpen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                            {fullscreenOpen ? "Exit fullscreen" : "Fullscreen"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!documentUrl && (
                  <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] p-6 text-center">
                    <FileText size={32} className="text-[#aeb6c6]" />
                    <strong className="text-[12px] font-bold text-[#43506a]">No document attached</strong>
                    <span className="max-w-[280px] text-[11px] leading-5 text-[#8993a6]">This submission doesn't have a file attached.</span>
                  </div>
                )}

                {documentUrl && fileState === "loading" && (
                  <div role="status" className={`grid ${documentHeight} place-items-center rounded-xl border border-[#e5e7eb] bg-[#f9fafb] text-[12px] font-semibold text-[#8a95a8]`}>
                    Loading document…
                  </div>
                )}

                {documentUrl && fileState === "ready" && fileUrl && (
                  <div className="space-y-2">
                    {fileType === "pdf" ? (
                      <>
                        <div
                          ref={viewerRef}
                          className={`relative overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] ${fullscreenOpen ? "fixed inset-0 z-[100] flex flex-col border-0" : "rounded-xl"}`}
                        >
                          {fullscreenOpen && (
                            <button
                              type="button"
                              onClick={toggleFullscreen}
                              className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-lg bg-[#07132f]/90 px-3 py-2 text-[11px] font-bold text-white shadow-lg"
                            >
                              <Minimize2 size={13} /> Exit fullscreen
                            </button>
                          )}
                          <iframe
                            src={fileUrl}
                            title="Submission PDF preview"
                            className={`block w-full ${fullscreenOpen ? "h-screen" : documentHeight}`}
                          />
                        </div>
                        {!fullscreenOpen && (
                          <p className="m-0 text-[10px] leading-5 text-[#8993a6]">
                            If the inline PDF preview is blank or unavailable, use Open PDF or Download.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className={`flex ${focusMode ? "min-h-[320px]" : "min-h-[260px]"} flex-col items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-6 text-center`}>
                        <FileText size={32} className="text-[#4f46c7]" />
                        <strong className="text-[13px] font-bold text-[#1c2a4a]">
                          {fileType === "word" ? "Word document ready to download" : "Preview unavailable"}
                        </strong>
                        <p className="m-0 max-w-[440px] text-[11px] leading-5 text-[#66728b]">
                          {fileType === "word"
                            ? "Word documents can't be previewed in this browser. Download the file and open it with Microsoft Word or another compatible editor."
                            : "This file type can't be previewed here. Download it to open it with a compatible application."}
                        </p>
                        <a
                          href={fileUrl}
                          download={fileName}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#1d4ed8]"
                        >
                          <Download size={13} /> Download {fileType === "word" ? "Word document" : "file"}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {documentUrl && fileState === "error" && (
                  <div role="alert" className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-[#e9d9a7] bg-[#fff9e9] p-6 text-center">
                    <AlertCircle size={30} className="text-[#9b7414]" />
                    <strong className="text-[12px] font-bold text-[#7a5c10]">Document is unavailable</strong>
                    <span className="max-w-[420px] text-[11px] leading-5 text-[#7a5c10]">{fileError}</span>
                    <button
                      type="button"
                      onClick={() => setFileRetry((attempt) => attempt + 1)}
                      className="rounded-lg bg-[#7a5c10] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#62490d]"
                    >
                      Retry document
                    </button>
                  </div>
                )}

                {viewerActionError && (
                  <p role="alert" className="m-0 rounded-lg border border-[#e9d9a7] bg-[#fff9e9] p-3 text-[11px] text-[#7a5c10]">
                    {viewerActionError}
                  </p>
                )}
              </section>

              <section
                id="review-controls"
                className={`rounded-2xl border border-[#e4e8f0] bg-white p-4 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-6 ${focusMode ? "lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto" : ""}`}
              >
                <h2 className="m-0 mb-5 flex items-center gap-2 border-b border-[#edf0f5] pb-4 text-[16px] font-bold text-[#1c2a4a] dark:border-[#1e293b] dark:text-white">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#2563eb] text-white">
                    <Star size={13} />
                  </span>
                  {locked ? "Your review" : "Evaluation & scoring"}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
                    <legend className="mb-3 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]">
                      Score — 1 Poor to 5 Excellent
                    </legend>
                    <div className="flex gap-1.5 sm:gap-2">
                      {SCORE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-label={`Score ${option.value} ${option.label}`}
                          aria-pressed={score === option.value}
                          onClick={() => setScore(option.value)}
                          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm font-bold transition ${
                            score === option.value
                              ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,.25)]"
                              : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#2563eb] hover:bg-[#eff6ff]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <Star size={15} className={score === option.value ? "fill-white" : "text-[#9ca3af]"} />
                          <span>{option.value}</span>
                        </button>
                      ))}
                    </div>
                    <FieldError errors={fieldErrors} name="score" />
                  </fieldset>

                  <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
                    <legend className="mb-3 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]">
                      Final recommendation
                    </legend>
                    <div className="grid gap-2">
                      {RECOMMENDATIONS.map((option) => {
                        const Icon = option.icon;
                        const selected = recommendation === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setRecommendation(option.value)}
                            className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              selected
                                ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                                : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#93c5fd]"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <Icon size={17} />
                            <span>
                              <strong className="block text-[12px]">{option.label}</strong>
                              <span className="text-[10px] text-[#8a95a8]">{option.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError errors={fieldErrors} name="recommendation" />
                  </fieldset>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label htmlFor="review-comments" className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6b7280]">
                        Review comments
                      </label>
                      <span className="text-[10px] font-semibold tabular-nums text-[#8a95a8]">{wordCount} words</span>
                    </div>
                    <textarea
                      id="review-comments"
                      rows={focusMode ? 5 : 7}
                      required
                      value={comments}
                      onChange={(event) => setComments(event.target.value)}
                      disabled={locked}
                      spellCheck="true"
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      placeholder="Explain your reasoning, strengths, and areas for improvement…"
                      className="w-full resize-y rounded-xl border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:bg-[#f7f8fc] disabled:text-[#8a95a8]"
                    />
                    <FieldError errors={fieldErrors} name="comments" />
                  </div>

                  {!locked && (
                    <>
                      <button
                        type="submit"
                        disabled={submitting || locking || (alreadySubmitted && !dirty)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-[12px] font-extrabold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={14} />
                        {submitting ? "Submitting review…" : alreadySubmitted ? "Update review" : "Submit review"}
                      </button>
                      {alreadySubmitted && (
                        <button
                          type="button"
                          onClick={() => setConfirmAction("lock")}
                          disabled={submitting || locking}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[12px] font-extrabold text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Lock size={14} /> {locking ? "Locking review…" : "Lock review"}
                        </button>
                      )}
                    </>
                  )}
                </form>
              </section>
            </div>
          </>
        )}
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-confirm-title"
        >
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="review-confirm-title" className="m-0 text-[17px] font-bold text-[#1c2a4a]">
              {confirmAction === "lock" ? "Lock this review?" : alreadySubmitted ? "Update this review?" : "Submit this review?"}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#66728b]">
              {confirmAction === "lock"
                ? "Locking is permanent. Your score, comments, and recommendation can no longer be changed."
                : alreadySubmitted
                  ? "Your previous review will be replaced with this score, comments, and recommendation."
                  : "Your score, comments, and recommendation will be sent to the organiser."}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="min-h-10 rounded-lg border border-[#e4e8f0] px-4 text-[11px] font-bold text-[#43506a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction === "lock" ? lockReview : submitReview}
                className="min-h-10 rounded-lg bg-[#2563eb] px-4 text-[11px] font-bold text-white hover:bg-[#1d4ed8]"
              >
                {confirmAction === "lock" ? "Lock review" : alreadySubmitted ? "Update review" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ReviewerLayout>
  );
}
