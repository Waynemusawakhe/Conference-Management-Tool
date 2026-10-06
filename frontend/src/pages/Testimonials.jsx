import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Pencil,
  Plus,
  Quote,
  Star,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { testimonialsApi } from "../api/testimonialsApi";
import { conferencesApi } from "../api/conferencesApi";

const tBody = (testimonial) =>
  testimonial.content ??
  testimonial.body ??
  testimonial.message ??
  testimonial.text ??
  testimonial.quote ??
  "";

const tName = (testimonial) =>
  testimonial.user?.name ??
  testimonial.author?.name ??
  testimonial.user_name ??
  testimonial.author_name ??
  testimonial.name ??
  "";

const tRole = (testimonial) =>
  testimonial.user?.role ??
  testimonial.author?.role ??
  testimonial.role ??
  testimonial.author_role ??
  "";

const tOwnerId = (testimonial) =>
  testimonial.user_id ??
  testimonial.author_id ??
  testimonial.userId ??
  testimonial.authorId ??
  testimonial.user?.id ??
  testimonial.author?.id ??
  null;

const tRating = (testimonial) => {
  const rating = Number(
    testimonial.rating ??
      testimonial.score ??
      testimonial.stars ??
      0
  );

  return Number.isFinite(rating) && rating > 0
    ? Math.min(Math.round(rating), 5)
    : 0;
};

const conferenceName = (conference) =>
  conference.name ??
  conference.title ??
  conference.code ??
  `Conference #${conference.id}`;

function getInitials(name) {
  if (!name) return "?";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TestimonialCard({
  item,
  isOwn,
  onEdit,
}) {
  return (
    <div className="testimonial-card">
      <Quote className="quote-icon" />

      <p className="testimonial-text">
        {item.quote}
      </p>

      {item.rating > 0 && (
        <div className="testimonial-stars">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <Star
                key={index}
                className={
                  index < item.rating
                    ? "star-filled"
                    : "star-empty"
                }
              />
            )
          )}
        </div>
      )}

      <div className="testimonial-footer">
        <span className="testimonial-initials">
          {item.initials}
        </span>

        <div className="min-w-0">
          <p className="testimonial-name">
            {item.name || "CMT user"}
          </p>

          {item.role && (
            <p className="testimonial-role">
              {item.role}
            </p>
          )}
        </div>

        {isOwn && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-2.5 py-1.5 text-[10px] font-extrabold text-[#5649dc] transition hover:bg-[#e5e2ff]"
            aria-label="Edit your testimonial"
          >
            <Pencil size={11} />
            Edit yours
          </button>
        )}
      </div>
    </div>
  );
}

function AddTestimonialDialog({
  open,
  onClose,
  onSaved,
  conferences,
  conferencesLoading,
  existing,
}) {
  const isEdit = Boolean(existing);

  const [conferenceId, setConferenceId] =
    useState("");
  const [content, setContent] =
    useState("");
  const [rating, setRating] =
    useState(0);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) return;

    if (existing) {
      setContent(tBody(existing));
      setRating(tRating(existing));
      setConferenceId(
        String(existing.conference_id ?? "")
      );
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
      setError(
        "Please select a conference."
      );
      return;
    }

    if (!content.trim()) {
      setError(
        "Please write your testimonial."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating between 1 and 5 stars."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        rating,
        content: content.trim(),
      };

      if (isEdit) {
        await testimonialsApi.update(
          existing.id,
          payload
        );
      } else {
        await testimonialsApi.create({
          conference_id:
            Number(conferenceId),
          ...payload,
        });
      }

      await onSaved();
      onClose();
    } catch (requestError) {
      if (requestError?.status === 401) {
        setError(
          "Your session expired. Please log in again."
        );
      } else if (
        requestError?.status === 422 &&
        requestError?.errors
      ) {
        const firstError =
          Object.values(
            requestError.errors
          )
            .flat()
            .find(Boolean);

        setError(
          firstError ||
            requestError.message ||
            "Please check your testimonial details."
        );
      } else {
        setError(
          requestError?.message ??
            "Failed to save testimonial."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#07132f]/60 p-4 backdrop-blur-sm"
      onClick={closeDialog}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(7,19,47,.28)]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
          <strong className="text-[13px] font-extrabold text-[#1c2a4a]">
            {isEdit
              ? "Edit your testimonial"
              : "Share your experience"}
          </strong>

          <button
            type="button"
            onClick={closeDialog}
            disabled={saving}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#aeb6c6] hover:bg-[#f1f2f6] hover:text-[#5c6880] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-4 p-5"
        >
          {!isEdit && (
            <label className="grid gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b4761]">
                <CalendarDays
                  size={12}
                  className="text-[#7a6ef0]"
                />
                Conference
              </span>

              <select
                value={conferenceId}
                onChange={(event) =>
                  setConferenceId(
                    event.target.value
                  )
                }
                disabled={
                  conferencesLoading ||
                  saving
                }
                required
                className="h-11 rounded-xl border border-[#e4e8f0] bg-white px-3.5 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10 disabled:cursor-not-allowed disabled:bg-[#f7f8fb]"
              >
                <option value="">
                  {conferencesLoading
                    ? "Loading conferences..."
                    : "Select a conference"}
                </option>

                {conferences.map(
                  (conference) => (
                    <option
                      key={conference.id}
                      value={conference.id}
                    >
                      {conferenceName(
                        conference
                      )}
                    </option>
                  )
                )}
              </select>
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">
              Your testimonial
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              rows={5}
              required
              placeholder="What has your experience with this conference been like?"
              className="resize-y rounded-xl border border-[#e4e8f0] bg-white px-3.5 py-3 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">
              Rating
            </span>

            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() =>
                      setRating(number)
                    }
                    className="grid h-11 w-11 place-items-center rounded-xl border border-[#e4e8f0] bg-white transition hover:border-[#d6dbe8] hover:bg-[#fafbff]"
                    aria-label={`${number} star${
                      number === 1
                        ? ""
                        : "s"
                    }`}
                  >
                    <Star
                      size={17}
                      className={
                        number <= rating
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-[#dfe4ed]"
                      }
                    />
                  </button>
                )
              )}

              {rating > 0 && (
                <span className="ml-2 text-[11px] font-bold text-[#66728b]">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {!isEdit &&
            !conferencesLoading &&
            conferences.length === 0 && (
              <p className="rounded-lg bg-[#fff8e8] px-3 py-2 text-[11px] font-semibold text-[#8b6514]">
                There are currently no
                conferences available
                for a testimonial.
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
                (!isEdit &&
                  (conferencesLoading ||
                    conferences.length ===
                      0))
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

export default function Testimonials() {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  const [dialogOpen, setDialogOpen] =
    useState(false);
  const [
    editingTestimonial,
    setEditingTestimonial,
  ] = useState(null);
  const [
    successFlash,
    setSuccessFlash,
  ] = useState(false);

  const testimonialsRes =
    useApiResource(
      () => testimonialsApi.getAll(),
      []
    );

  const conferencesRes =
    useApiResource(
      () =>
        conferencesApi.getAll({
          per_page: 100,
        }),
      []
    );

  const isAuthenticated =
    status === "authenticated" &&
    Boolean(user);
  const isInitializing =
    status === "initializing";

  const conferences = useMemo(
    () =>
      toArray(conferencesRes.data),
    [conferencesRes.data]
  );

  const testimonials = useMemo(
    () =>
      toArray(testimonialsRes.data)
        .map((testimonial) => {
          const body =
            tBody(testimonial);

          if (!body) return null;

          const name =
            tName(testimonial);

          return {
            id: testimonial.id,
            quote: body,
            name,
            role:
              tRole(testimonial),
            initials:
              getInitials(name),
            rating:
              tRating(testimonial),
            ownerId:
              tOwnerId(testimonial),
            _raw: testimonial,
          };
        })
        .filter(Boolean),
    [testimonialsRes.data]
  );

  const currentUserId =
    user?.id ?? null;

  const handleAdd = () => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setEditingTestimonial(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    if (
      !isAuthenticated ||
      !item?._raw
    ) {
      return;
    }

    setEditingTestimonial(
      item._raw
    );
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingTestimonial(null);
  };

  const handleSaved = async () => {
    await testimonialsRes.reload();

    setSuccessFlash(true);

    window.setTimeout(
      () =>
        setSuccessFlash(false),
      4000
    );
  };

  return (
    <div className="site">
      <Navbar />

      <main className="testimonials-page">
        <section className="testimonials-hero">
          <h1>
            Trusted by researchers,{" "}
            <span className="highlight">
              worldwide.
            </span>
          </h1>

          <p>
            From first-time
            presenters to symposium
            organizers, here's how CMT
            has changed the way people
            find, submit to, and run
            conferences.
          </p>
        </section>

        <section className="mx-auto -mt-2 mb-6 flex w-[min(1200px,calc(100%-40px))] justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isInitializing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Plus size={14} />
            {isInitializing
              ? "Loading..."
              : "Add yours"}
          </button>
        </section>

        {successFlash && (
          <div
            role="status"
            className="mx-auto mb-6 flex w-[min(1200px,calc(100%-40px))] items-center gap-2 rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-[11px] font-semibold text-[#18794e]"
          >
            <Quote size={13} />
            Your testimonial was saved
            successfully.
          </div>
        )}

        <section className="testimonials-grid">
          {testimonialsRes.loading &&
            Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="testimonial-card"
                aria-hidden="true"
              >
                <Quote className="quote-icon" />
                <div className="mb-2.5 h-3 w-[85%] animate-pulse rounded-full bg-[#eef1f7]" />
                <div className="mb-5 h-3 w-[60%] animate-pulse rounded-full bg-[#eef1f7]" />
                <div className="h-3 w-[45%] animate-pulse rounded-full bg-[#eef1f7]" />
              </div>
            ))}

          {!testimonialsRes.loading &&
            testimonialsRes.error && (
              <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff2f2] text-[#b13a3a]">
                  <Quote size={22} />
                </span>

                <h3 className="m-0 text-[14px] font-bold text-[#1c2a4a]">
                  Couldn't load
                  testimonials
                </h3>

                <p className="m-0 max-w-[420px] text-[11px] leading-5 text-[#8993a6]">
                  {testimonialsRes
                    .error?.message ||
                    "Please try again."}
                </p>

                <button
                  type="button"
                  onClick={
                    testimonialsRes.reload
                  }
                  className="mt-1 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                >
                  Try again
                </button>
              </div>
            )}

          {!testimonialsRes.loading &&
            !testimonialsRes.error &&
            testimonials.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                  <Quote size={22} />
                </span>

                <h3 className="m-0 text-[14px] font-bold text-[#1c2a4a]">
                  No testimonials yet
                </h3>

                <p className="m-0 max-w-[420px] text-[11px] leading-5 text-[#8993a6]">
                  Be the first to share
                  your conference
                  experience with CMT.
                </p>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                >
                  <Plus size={12} />
                  Add yours
                </button>
              </div>
            )}

          {!testimonialsRes.loading &&
            !testimonialsRes.error &&
            testimonials.map(
              (item, index) => {
                const isOwn =
                  currentUserId != null &&
                  item.ownerId != null &&
                  String(
                    item.ownerId
                  ) ===
                    String(
                      currentUserId
                    );

                return (
                  <TestimonialCard
                    key={
                      item.id ??
                      `testimonial-${index}`
                    }
                    item={item}
                    isOwn={isOwn}
                    onEdit={
                      handleEdit
                    }
                  />
                );
              }
            )}
        </section>

        <section className="cta-section">
          <h2>
            Ready to join them?
          </h2>

          <p>
            Create a free account and
            start discovering
            conferences matched to
            your research in minutes.
          </p>

          <button
            type="button"
            className="cta-button"
            onClick={() =>
              navigate("/register")
            }
          >
            Register for free
            <ArrowRight className="icon" />
          </button>
        </section>
      </main>

      <AddTestimonialDialog
        open={dialogOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        conferences={conferences}
        conferencesLoading={
          conferencesRes.loading
        }
        existing={
          editingTestimonial
        }
      />
    </div>
  );
}
