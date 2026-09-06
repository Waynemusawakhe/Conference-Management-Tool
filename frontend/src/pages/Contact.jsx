import { useState } from "react";
import Navbar from "../components/Navbar";

// FR-020: Any visitor can view this page and submit a message via the
// Contact Us form without logging in. Submission is accepted and
// confirmed to the visitor.
// NFR-USE-002: clear, understandable validation messages for required fields.
// NFR-COM-001 / NFR-ACC-001-002: usable on desktop + mobile, readable text sizes.

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as soon as the user starts fixing it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) {
      next.name = "Please enter your name.";
    }
    if (!form.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      next.message = "Please enter a message.";
    } else if (form.message.trim().length < 10) {
      next.message = "Message should be at least 10 characters.";
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      // TODO: replace with the real endpoint once the backend contact
      // route is available, e.g.:
      // await fetch("/api/contact", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });
      await new Promise((resolve) => setTimeout(resolve, 500)); // temp mock delay

      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />

      <section className="px-5 py-20">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">Get in touch</span>
            <h1 className="text-4xl font-bold tracking-[-.05em]">Contact Us</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#66728b]">
              Have a question about a conference, a submission, or the
              platform itself? Send us a message and we'll get back to you.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-[0_18px_55px_rgba(15,28,65,.08)] sm:p-9">
            {submitted ? (
              <div className="py-8 text-center" role="status">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e8faf2] text-[#19a56a]" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold">Message sent</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#66728b]">
                  Thanks for reaching out — we've received your message and
                  will get back to you as soon as we can.
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-[11px] border border-[#dfe4ed] bg-white px-4 py-3 text-xs font-bold text-[#43506a]"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
                {errors.form && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{errors.form}</p>
                )}

                <label className="grid gap-2">
                  <span className="text-xs font-bold text-[#43506a]">Name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                  {errors.name && (
                    <span className="text-xs font-semibold text-red-700" id="name-error">
                      {errors.name}
                    </span>
                  )}
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold text-[#43506a]">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                  {errors.email && (
                    <span className="text-xs font-semibold text-red-700" id="email-error">
                      {errors.email}
                    </span>
                  )}
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold text-[#43506a]">Message</span>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    rows={6}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "message-error" : undefined
                    }
                    className="rounded-[10px] border border-[#dfe4ed] px-3 py-3 text-sm outline-none focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                  {errors.message && (
                    <span className="text-xs font-semibold text-red-700" id="message-error">
                      {errors.message}
                    </span>
                  )}
                </label>

                <button
                  type="submit"
                  className="min-h-11 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(103,87,245,.26)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}