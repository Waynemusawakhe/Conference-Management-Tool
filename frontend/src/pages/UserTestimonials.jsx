import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Quote,
  Star,
  X,
} from "lucide-react";
import RoleChrome from "../components/RoleChrome";
import { useAuth } from "../context/AuthContext";
import { testimonialsApi } from "../api/testimonialsApi";
import { conferencesApi } from "../api/conferencesApi";

const unwrapList = (r) => (Array.isArray(r) ? r : r?.data || []);

const tBody = (t) =>
  t.content ?? t.body ?? t.message ?? t.text ?? t.quote ?? "";

const tName = (t) =>
  t.user?.name ??
  t.author?.name ??
  t.user_name ??
  t.author_name ??
  t.name ??
  "";

const tRole = (t) =>
  t.user?.role ??
  t.author?.role ??
  t.role ??
  t.author_role ??
  "";

const tOwnerId = (t) =>
  t.user_id ??
  t.author_id ??
  t.user?.id ??
  t.author?.id ??
  null;

const tRating = (t) => {
  const r = Number(t.rating ?? t.score ?? t.stars ?? 0);
  return Number.isFinite(r) && r > 0 ? Math.min(Math.round(r), 5) : 0;
};

const conferenceName = (c) =>
  c?.name ?? c?.title ?? c?.code ?? `Conference #${c?.id}`;

const getInitials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
};

const ROLE_LABEL = {
  author: "Author",
  reviewer: "Reviewer",
  organiser: "Organiser",
  attendee: "Attendee",
  admin: "Admin",
};

function StarRow({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < value ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#dfe4ed]"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item, isOwn, onEdit }) {
  return (
    <article className="flex flex-col rounded-[17px] border border-[#e9ecf2] bg-white p-5 shadow-[0_10px_28px_rgba(15,28,65,.04)]">
      <Quote size={18} className="text-[#6757f5]" />

      <p className="mt-3 flex-1 whitespace-pre-wrap text-[12px] leading-6 text-[#35415f]">
        {item.quote}
      </p>

      {item.rating > 0 && (
        <div className="mt-4">
          <StarRow value={item.rating} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-[#edf0f5] pt-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efedff] text-[10px] font-extrabold text-[#5649dc]">
          {item.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[11px] font-bold text-[#1c2a4a]">
            {item.name || "CMT user"}
          </p>
          {item.role && (
            <p className="m-0 text-[9px] text-[#8993a6]">
              {ROLE_LABEL[item.role] || item.role}
            </p>
          )}
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-2.5 py-1.5 text-[10px] font-extrabold text-[#5649dc] transition hover:bg-[#e5e2ff]"
          >
            <Pencil size={11} /> Edit yours
          </button>
        )}
      </div>
    </article>
  );
}

function TestimonialDialog({
  open,
  onClose,
  onSaved,
  conferences,
  conferencesLoading,
  existing,
  userRole,
  userName,
}) {
  const isEdit = Boolean(existing);

  const [conferenceId, setConferenceId] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setContent(tBody(existing));
      setRating(tRating(existing));
      setConferenceId(String(existing.conference_id ?? ""));
    } else {
      setConferenceId("");
      setContent("");
      setRating(0);
    }
    setError("");
  }, [open, existing]);

  if (!open) return null;

  const closeDialog = () => {
    if (saving) return;
    setError("");
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isEdit && !conferenceId) {
      setError("Please select a conference.");
      return;
    }
    if (!content.trim()) {
      setError("Please write your testimonial.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        rating,
        content: content.trim(),
        role: ROLE_LABEL[userRole] || userRole || "",
        user_name: userName || "",
      };

      if (isEdit) {
        await testimonialsApi.update(existing.id, payload);
      } else {
        await testimonialsApi.create({
          conference_id: Number(conferenceId),
          ...payload,
        });
      }

      await onSaved();
      onClose();
    } catch (requestError) {
      if (requestError?.status === 401) {
        setError("Your session expired. Please log in again.");
      } else if (requestError?.status === 422 && requestError?.errors) {
        const firstError = Object.values(requestError.errors)
          .flat()
          .find(Boolean);
        setError(
          firstError ||
            requestError.message ||
            "Please check your testimonial details.",
        );
      } else {
        setError(requestError?.message ?? "Failed to save testimonial.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
      onClick={closeDialog}
    >
      <div
        className="w-full max-w-[540px] overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(7,19,47,.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-6 py-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
              Your voice
            </span>
            <h2 className="mb-0 mt-1 text-[16px] font-extrabold text-[#1c2a4a]">
              {isEdit ? "Edit your testimonial" : "Share your experience"}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089] hover:bg-[#e9ecf3] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-6">
          {!isEdit && (
            <label className="grid gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b4761]">
                <CalendarDays size={12} className="text-[#7a6ef0]" />
                Conference
              </span>
              <select
                value={conferenceId}
                onChange={(e) => setConferenceId(e.target.value)}
                disabled={conferencesLoading || saving}
                required
                className="h-11 rounded-xl border border-[#e4e8f0] bg-white px-3.5 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10 disabled:cursor-not-allowed disabled:bg-[#f7f8fb]"
              >
                <option value="">
                  {conferencesLoading
                    ? "Loading conferences..."
                    : "Select a conference"}
                </option>
                {conferences.map((c) => (
                  <option key={c.id} value={c.id}>
                    {conferenceName(c)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">
              Your testimonial
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={1000}
              required
              placeholder="What has your experience with CMT been like?"
              className="resize-y rounded-xl border border-[#e4e8f0] bg-white px-3.5 py-3 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10"
            />
            <span className="text-right text-[9px] text-[#8a95a8]">
              {content.length}/1000
            </span>
          </label>

          <div className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">Rating</span>
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-[#e4e8f0] bg-white transition hover:border-[#d6dbe8] hover:bg-[#fafbff]"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    size={17}
                    className={
                      n <= rating
                        ? "fill-[#f59e0b] text-[#f59e0b]"
                        : "text-[#dfe4ed]"
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-[11px] font-bold text-[#66728b]">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#fafbfe] px-3 py-2 text-[10px] text-[#66728b]">
            <MessageSquareQuote size={12} className="text-[#7a6ef0]" />
            Posting as{" "}
            <strong className="font-extrabold text-[#1c2a4a]">
              {userName || "You"}
            </strong>
            {userRole && (
              <>
                ·{" "}
                <strong className="font-extrabold text-[#5649dc]">
                  {ROLE_LABEL[userRole] || userRole}
                </strong>
              </>
            )}
          </div>

          {!isEdit && !conferencesLoading && conferences.length === 0 && (
            <p className="rounded-lg bg-[#fff8e8] px-3 py-2 text-[11px] font-semibold text-[#8b6514]">
              There are currently no conferences available for a testimonial.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#eef1f7] pt-4">
            <button
              type="button"
              onClick={closeDialog}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[11px] font-bold text-[#5c6880] hover:bg-[#fafbff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                rating < 1 ||
                (!isEdit && (conferencesLoading || conferences.length === 0))
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Post testimonial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserTestimonials() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conferencesLoading, setConferencesLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testimonialsApi.getAll();
      setItems(unwrapList(res));
    } catch (err) {
      if (err?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.message || "Unable to load testimonials.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  const loadConferences = useCallback(async () => {
    setConferencesLoading(true);
    try {
      const res = await conferencesApi.getAll({ per_page: 100 });
      setConferences(unwrapList(res));
    } catch {
      setConferences([]);
    } finally {
      setConferencesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
    loadConferences();
  }, [loadTestimonials, loadConferences]);

  const currentUserId = user?.id ?? null;

  const myTestimonial = useMemo(() => {
    if (currentUserId == null) return null;
    return (
      items.find((t) => String(tOwnerId(t)) === String(currentUserId)) || null
    );
  }, [items, currentUserId]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditing(item._raw ?? item);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    await loadTestimonials();
    setFeedback("Your testimonial has been saved.");
    window.setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <RoleChrome>
      <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.22),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.18),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.12)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
              <MessageSquareQuote size={14} /> Community
            </span>
            <h1 className="mb-2 mt-3 text-[clamp(24px,3.4vw,36px)] font-bold leading-tight tracking-[-.04em]">
              What people say
            </h1>
            <p className="m-0 max-w-[620px] text-[12px] leading-6 text-white/65">
              Real experiences from authors, reviewers, organisers and attendees
              across CMT.
            </p>
          </div>
          <button
            type="button"
            onClick={myTestimonial ? () => handleEdit(myTestimonial) : handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
          >
            {myTestimonial ? <Pencil size={16} /> : <Plus size={16} />}
            {myTestimonial ? "Edit yours" : "Add yours"}
          </button>
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe5d1] bg-[#effaf4] p-4 text-xs font-semibold text-[#18794e]"
        >
          <span>{feedback}</span>
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
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadTestimonials}
            className="font-extrabold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="mt-6 rounded-[20px] border border-[#e4e8f0] bg-white shadow-[0_10px_30px_rgba(15,28,65,.035)]">
        <div className="border-b border-[#edf0f5] p-5 sm:p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
            All testimonials
          </span>
          <h2 className="mb-0 mt-1 text-[20px] font-bold tracking-[-.03em]">
            {loading
              ? "Loading…"
              : `${items.length} testimonial${items.length === 1 ? "" : "s"}`}
          </h2>
        </div>

        {loading ? (
          <div className="grid place-items-center p-12 text-xs font-semibold text-[#7c879a]">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading
            testimonials…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareQuote
              size={22}
              className="mx-auto text-[#aeb6c6]"
            />
            <h3 className="mb-1 mt-3 text-[13px] font-bold">
              No testimonials yet
            </h3>
            <p className="m-0 text-[10px] text-[#8993a6]">
              Be the first to share your CMT experience.
            </p>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-2 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
            >
              <Plus size={12} /> Add yours
            </button>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {items.map((raw, idx) => {
              const quote = tBody(raw);
              if (!quote) return null;
              const name = tName(raw);
              const rating = tRating(raw);
              const ownerId = tOwnerId(raw);
              const isOwn =
                currentUserId != null &&
                ownerId != null &&
                String(ownerId) === String(currentUserId);

              const item = {
                id: raw.id ?? `t-${idx}`,
                quote,
                name,
                role: tRole(raw),
                rating,
                initials: getInitials(name),
                _raw: raw,
              };

              return (
                <TestimonialCard
                  key={item.id}
                  item={item}
                  isOwn={isOwn}
                  onEdit={handleEdit}
                />
              );
            })}
          </div>
        )}
      </section>

      <TestimonialDialog
        open={dialogOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        conferences={conferences}
        conferencesLoading={conferencesLoading}
        existing={editing}
        userRole={user?.role}
        userName={user?.name || user?.full_name || ""}
      />
    </RoleChrome>
  );
}