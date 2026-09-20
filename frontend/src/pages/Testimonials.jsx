import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Quote, Star, ArrowRight, Plus, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { toArray } from "../api/normalize";
import { testimonialsApi } from "../api/testimonialsApi";


const tBody = (t) =>
  t.content ?? t.body ?? t.message ?? t.text ?? t.quote ?? "";
const tName = (t) =>
  t.author?.name ??
  t.user?.name ??
  t.author_name ??
  t.user_name ??
  t.name ??
  "";
const tRole = (t) =>
  t.role ?? t.author?.role ?? t.user?.role ?? t.author_role ?? "";
const tRating = (t) => {
  const n = Number(t.rating ?? t.score ?? t.stars ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 5) : 0;
};

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function TestimonialCard({ item }) {
  const rating = item.rating ?? 0;
  return (
    <div className="testimonial-card">
      <Quote className="quote-icon" />
      <p className="testimonial-text">{item.quote}</p>

      {rating > 0 && (
        <div className="testimonial-stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={i < rating ? "star-filled" : "star-empty"}
            />
          ))}
        </div>
      )}

      <div className="testimonial-footer">
        <span className="testimonial-initials">{item.initials}</span>
        <div>
          <p className="testimonial-name">{item.name || "Anonymous"}</p>
          {item.role && <p className="testimonial-role">{item.role}</p>}
        </div>
      </div>
    </div>
  );
}


function AddTestimonialDialog({ open, onClose, onSaved }) {
  const [content, setContent] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!content.trim()) {
      setErr("Please write your testimonial.");
      return;
    }
    setSaving(true);
    try {
      const payload = { content: content.trim() };
      if (role.trim()) payload.role = role.trim();
      if (rating > 0) payload.rating = rating;

      await testimonialsApi.create(payload);
      await onSaved();
      setContent("");
      setRole("");
      setRating(0);
      onClose();
    } catch (e2) {
      if (e2?.status === 401) {
        setErr("Please log in to post a testimonial.");
      } else if (e2?.status === 422 && e2.errors) {
        setErr(Object.values(e2.errors).flat()[0] || e2.message);
      } else {
        setErr(e2?.message ?? "Failed to submit testimonial.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#07132f]/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(7,19,47,.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
          <strong className="text-[13px] font-extrabold text-[#1c2a4a]">
            Share your experience
          </strong>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#aeb6c6] hover:bg-[#f1f2f6] hover:text-[#5c6880]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-4 p-5">
          <label className="grid gap-2">
            <span className="text-[11px] font-bold text-[#3b4761]">
              Your testimonial
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What has your experience with CMT been like?"
              className="rounded-xl border border-[#e4e8f0] bg-white px-3.5 py-3 text-[13px] outline-none focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10 resize-y"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] font-bold text-[#3b4761]">
                Role (optional)
              </span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Author"
                className="h-11 rounded-xl border border-[#e4e8f0] bg-white px-3.5 text-[13px] outline-none focus:border-[#8878f8] focus:ring-4 focus:ring-[#8878f8]/10"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] font-bold text-[#3b4761]">
                Rating (optional)
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n === rating ? 0 : n)}
                    className="grid h-11 w-11 place-items-center rounded-xl border border-[#e4e8f0] bg-white transition hover:border-[#d6dbe8] hover:bg-[#fafbff]"
                  >
                    <Star
                      size={15}
                      className={
                        n <= rating
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-[#dfe4ed]"
                      }
                    />
                  </button>
                ))}
              </div>
            </label>
          </div>
          {err && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700"
            >
              {err}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#eef1f7] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-4 text-[11px] font-bold text-[#5c6880] hover:bg-[#fafbff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:opacity-60"
            >
              {saving ? "Posting…" : "Post testimonial"}
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
  const [dialogOpen, setDialogOpen] = useState(false);

  const testimonialsRes = useApiResource(() => testimonialsApi.getAll(), []);
  const isAuthenticated = status === "authenticated" && Boolean(user);

  /* Map API data → card shape */
  const testimonials = useMemo(() => {
    return toArray(testimonialsRes.data)
      .map((t) => {
        const body = tBody(t);
        if (!body) return null;
        const name = tName(t);
        const role = tRole(t);
        return {
          id: t.id,
          quote: body,
          name,
          role,
          initials: getInitials(name),
          rating: tRating(t),
        };
      })
      .filter(Boolean);
  }, [testimonialsRes.data]);

  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setDialogOpen(true);
  };

  return (
    <div className="site">
      <Navbar />

      <main className="testimonials-page">
        {/* Hero */}
        <section className="testimonials-hero">
          <h1>
            Trusted by researchers,{" "}
            <span className="highlight">worldwide.</span>
          </h1>
          <p>
            From first-time presenters to symposium organizers, here's how CMT
            has changed the way people find, submit to, and run conferences.
          </p>
        </section>

        {/* Action row — Add yours */}
        <section className="mx-auto -mt-2 mb-6 flex w-[min(1200px,calc(100%-40px))] justify-end">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px"
          >
            <Plus size={14} /> Add yours
          </button>
        </section>

        {/* Testimonials Grid */}
        <section className="testimonials-grid">
          {testimonialsRes.loading && (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="testimonial-card" aria-hidden="true">
                <Quote className="quote-icon" />
                <div className="h-3 w-[85%] animate-pulse rounded-full bg-[#eef1f7] mb-2.5" />
                <div className="h-3 w-[60%] animate-pulse rounded-full bg-[#eef1f7] mb-5" />
                <div className="h-3 w-[45%] animate-pulse rounded-full bg-[#eef1f7]" />
              </div>
            ))
          )}

          {!testimonialsRes.loading && testimonialsRes.error && (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff2f2] text-[#b13a3a]">
                <Quote size={22} />
              </span>
              <h3 className="m-0 text-[14px] font-bold text-[#1c2a4a]">
                Couldn't load testimonials
              </h3>
              <p className="m-0 max-w-[420px] text-[11px] leading-5 text-[#8993a6]">
                {testimonialsRes.error.message}
              </p>
              <button
                onClick={testimonialsRes.reload}
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
                  Be the first to share your experience with CMT.
                </p>
                <button
                  onClick={handleAdd}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#efedff] px-3 py-1.5 text-[10px] font-extrabold text-[#5649dc] hover:bg-[#e5e2ff]"
                >
                  <Plus size={12} /> Add yours
                </button>
              </div>
            )}

          {!testimonialsRes.loading &&
            !testimonialsRes.error &&
            testimonials.map((item, i) => (
              <TestimonialCard key={item.id ?? `t-${i}`} item={item} />
            ))}
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Ready to join them?</h2>
          <p>
            Create a free account and start discovering conferences matched to
            your research in minutes.
          </p>
          <button className="cta-button" onClick={() => navigate("/register")}>
            Register for free <ArrowRight className="icon" />
          </button>
        </section>
      </main>

      <AddTestimonialDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => testimonialsRes.reload()}
      />
    </div>
  );
}