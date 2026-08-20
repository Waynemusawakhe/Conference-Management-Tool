import { useState } from "react";
import Navbar from "../components/Navbar";
import "./contact.css";

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
    <div className="site">
      <Navbar />

      <section className="section contact-section">
        <div className="container">
          <div className="contact-heading">
            <span className="eyebrow">Get in touch</span>
            <h1>Contact Us</h1>
            <p className="contact-lead">
              Have a question about a conference, a submission, or the
              platform itself? Send us a message and we'll get back to you.
            </p>
          </div>

          <div className="contact-card">
            {submitted ? (
              <div className="contact-success" role="status">
                <div className="contact-success-icon" aria-hidden="true">
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
                <h3>Message sent</h3>
                <p>
                  Thanks for reaching out — we've received your message and
                  will get back to you as soon as we can.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost-dark"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {errors.form && (
                  <p className="field-error form-error">{errors.form}</p>
                )}

                <label className="form-field">
                  <span className="form-label">Name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <span className="field-error" id="name-error">
                      {errors.name}
                    </span>
                  )}
                </label>

                <label className="form-field">
                  <span className="form-label">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <span className="field-error" id="email-error">
                      {errors.email}
                    </span>
                  )}
                </label>

                <label className="form-field">
                  <span className="form-label">Message</span>
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
                  />
                  {errors.message && (
                    <span className="field-error" id="message-error">
                      {errors.message}
                    </span>
                  )}
                </label>

                <button
                  type="submit"
                  className="btn btn-primary contact-submit"
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