import { useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  MessageSquareQuote,
  Quote,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock } from "../components/AdminUI";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { testimonialsApi } from "../api/testimonialsApi";

/* Defensive resolvers — guide §8.9 says fields require confirmation */
const testimonialBody = (t) =>
  t.content ?? t.body ?? t.message ?? t.text ?? t.quote ?? "";
const testimonialAuthorName = (t) =>
  t.author?.name ??
  t.user?.name ??
  t.author_name ??
  t.user_name ??
  t.name ??
  "Unknown user";
const testimonialRole = (t) =>
  t.role ?? t.author?.role ?? t.user?.role ?? t.author_role ?? "";
const testimonialRating = (t) => {
  const n = Number(t.rating ?? t.score ?? t.stars ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 5) : 0;
};

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function Stars({ value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < value ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#dfe4ed]"}
        />
      ))}
    </span>
  );
}

function StatStrip({ testimonials }) {
  const avg = useMemo(() => {
    const rated = testimonials.map(testimonialRating).filter((n) => n > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
  }, [testimonials]);

  const items = [
    { label: "Total", value: testimonials.length, icon: <MessageSquareQuote size={14} />, tone: "text-[#4f46c7] bg-[#efedff]" },
    { label: "Average rating", value: avg ?? "—", icon: <Star size={14} />, tone: "text-[#9b7414] bg-[#fff9e9]" },
    { label: "With text", value: testimonials.filter((t) => testimonialBody(t).trim()).length, icon: <Quote size={14} />, tone: "text-[#1d5fa8] bg-[#eef5fd]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function LoadingCards({ rows = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#edf0f5] bg-white p-5">
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2.5 w-full animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-[#eef1f7]" />
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-[#eef1f7]" />
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#eef1f7]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Custom delete confirmation dialog
 * ------------------------------------------------------------------ */
function DeleteConfirmDialog({ open, onClose, onConfirm, testimonial, busy }) {
  if (!open || !testimonial) return null;

  const author = testimonialAuthorName(testimonial);
  const body = testimonialBody(testimonial);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <style>{`
        @keyframes cmtDialogIn {
          0%   { opacity: 0; transform: scale(.94) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cmt-dialog-in { animation: cmtDialogIn .28s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div
        className="cmt-dialog-in w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(7,19,47,.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warning icon */}
        <div className="flex items-start gap-4 border-b border-[#edf0f5] px-6 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
            <TriangleAlert size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-title"
              className="m-0 text-[15px] font-bold text-[#1c2a4a]"
            >
              Delete this testimonial?
            </h2>
            <p className="m-0 mt-1 text-[11px] leading-5 text-[#8a95a8]">
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#aeb6c6] transition hover:bg-[#f1f2f6] hover:text-[#5c6880] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Preview of what's being deleted */}
        <div className="px-6 py-5">
          <div className="rounded-xl border border-[#eef1f7] bg-[#fafbff] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                {getInitials(author)}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-[12px] font-bold text-[#1c2a4a]">
                  {author}
                </strong>
                {testimonialRole(testimonial) && (
                  <span className="block truncate text-[10px] capitalize text-[#8a95a8]">
                    {testimonialRole(testimonial)}
                  </span>
                )}
              </div>
            </div>
            <p className="m-0 mt-3 line-clamp-3 text-[11px] leading-5 text-[#5c6880]">
              "{body || "—"}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-[#edf0f5] bg-[#fafbff] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-5 text-[11px] font-bold text-[#5c6880] transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            No, cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#dc2626] px-5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(239,68,68,.32)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {busy ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Yes, delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function AdminTestimonialsPage() {
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const testimonialsRes = useApiResource(() => testimonialsApi.getAll(), []);
  const testimonials = useMemo(
    () => toArray(testimonialsRes.data),
    [testimonialsRes.data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return testimonials;
    return testimonials.filter((t) =>
      [testimonialBody(t), testimonialAuthorName(t), testimonialRole(t), String(t.id ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [testimonials, query]);

  /* ---- Open confirm dialog ---- */
  const handleDeleteClick = (t) => {
    setFeedback(null);
    setConfirmTarget(t);
  };

  /* ---- Confirm delete ---- */
  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const author = testimonialAuthorName(confirmTarget);

    setDeleting(true);
    try {
      if (typeof testimonialsApi?.remove !== "function") {
        throw new Error(
          "testimonialsApi.remove is not defined — add it to src/api/testimonialsApi.js."
        );
      }
      await testimonialsApi.remove(confirmTarget.id);
      await testimonialsRes.reload();
      setFeedback({
        type: "success",
        message: `Testimonial from ${author} was deleted.`,
      });
      setConfirmTarget(null);
    } catch (err) {
      console.error("Delete testimonial failed:", err);
      const status = err?.status ?? null;
      let message = err?.message ?? "Failed to delete testimonial.";
      if (status === 403) {
        message =
          "You don't have permission to delete testimonials. Ask the backend team to grant admins delete access on this endpoint (guide §8.9).";
      } else if (status === 401) {
        message = "Your session expired. Please log in again.";
      } else if (status === 404) {
        message = "This testimonial no longer exists — refreshing the list.";
        await testimonialsRes.reload();
      }
      setFeedback({ type: "error", message });
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout subtitle="Content" title="Testimonials">
      {feedback && (
        <div
          role="alert"
          className={`mb-4 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[11px] font-semibold ${
            feedback.type === "success"
              ? "border-[#bfe5d1] bg-[#effaf4] text-[#18794e]"
              : "border-[#f1c8c8] bg-[#fff2f2] text-[#b13a3a]"
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === "error" && (
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!testimonialsRes.loading &&
        !testimonialsRes.error &&
        testimonials.length > 0 && (
          <div className="mb-5">
            <StatStrip testimonials={testimonials} />
          </div>
        )}

      <Card className="overflow-hidden border-0 ring-1 ring-[#eef1f7] shadow-[0_20px_60px_-30px_rgba(23,35,66,.18)]">
        <CardHeader
          eyebrow="Manage"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6655f6] to-[#8b7bff] text-white shadow-[0_8px_18px_-6px_rgba(102,85,246,.55)]">
                <MessageSquareQuote size={14} />
              </span>
              {filtered.length === testimonials.length
                ? `${testimonials.length} testimonial${testimonials.length === 1 ? "" : "s"}`
                : `${filtered.length} of ${testimonials.length} testimonials`}
            </span>
          }
          action={
            <div className="relative w-full sm:w-[280px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1b3]"
                size={15}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search content, author…"
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

        {testimonialsRes.loading && <LoadingCards />}

        {!testimonialsRes.loading && testimonialsRes.error && (
          <StateBlock
            kind="error"
            message={testimonialsRes.error.message}
            onRetry={testimonialsRes.reload}
          />
        )}

        {!testimonialsRes.loading &&
          !testimonialsRes.error &&
          filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                <MessageSquareQuote size={22} />
              </span>
              <h3 className="m-0 text-[13px] font-bold text-[#1c2a4a]">
                {testimonials.length === 0 ? "No testimonials yet" : "No matches"}
              </h3>
              <p className="m-0 max-w-[400px] text-[11px] leading-5 text-[#8993a6]">
                {testimonials.length === 0
                  ? "Testimonials posted by users will appear here for review."
                  : "Try a different search term."}
              </p>
            </div>
          )}

        {!testimonialsRes.loading &&
          !testimonialsRes.error &&
          filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {filtered.map((t) => {
                const author = testimonialAuthorName(t);
                const role = testimonialRole(t);
                const rating = testimonialRating(t);
                const body = testimonialBody(t);

                return (
                  <article
                    key={t.id}
                    className="group relative rounded-2xl border border-[#edf0f5] bg-white p-5 transition hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(15,28,65,.06)]"
                  >
                    <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-[#f1efff] text-[#5b4fe3]">
                      <Quote size={14} />
                    </span>

                    {rating > 0 && (
                      <div className="mb-3">
                        <Stars value={rating} />
                      </div>
                    )}

                    <p className="m-0 line-clamp-4 pr-12 text-[12px] leading-6 text-[#43506a]">
                      "{body || "—"}"
                    </p>

                    <div className="mt-4 flex items-center gap-3 border-t border-[#f2f4f9] pt-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#4f46c7]">
                        {getInitials(author)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-[11px] font-bold text-[#1c2a4a]">
                          {author}
                        </strong>
                        <span className="text-[9px] capitalize text-[#8a95a8]">
                          {role || "—"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteClick(t)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                        aria-label={`Delete testimonial from ${author}`}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </Card>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => !deleting && setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        testimonial={confirmTarget}
        busy={deleting}
      />
    </AdminLayout>
  );
}