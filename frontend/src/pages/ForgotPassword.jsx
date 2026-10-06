import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Send,
} from "lucide-react";

import Logo from "../components/Logo";
import { authApi } from "../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword({
        email: normalizedEmail,
      });

      /*
       * Always show the same message.
       * The backend also uses a generic response
       * to avoid revealing registered emails.
       */
      setSent(true);
    } catch (err) {
      if (
        err.status === 422 &&
        err.errors
      ) {
        const details =
          Object.values(
            err.errors
          )
            .flat()
            .join(" ");

        setError(
          details ||
            err.message
        );
      } else if (err.status === 429) {
        setError(
          "Too many reset requests. Please wait a minute and try again."
        );
      } else {
        setError(
          err.message ||
            "Unable to send the reset link. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#15165a,#07132f_65%)] px-5 py-10">
      <section className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
            <Mail size={22} />
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d]">
            Reset your password
          </h1>

          <p className="mt-2 text-xs leading-6 text-[#788398]">
            Enter the email address associated
            with your CMT account and we will
            send you a secure reset link.
          </p>
        </div>

        {sent ? (
          <div className="mt-7">
            <div
              className="rounded-xl border border-[#cdecdc] bg-[#e8faf2] p-4 text-center text-sm leading-6 text-[#16734b]"
              role="status"
            >
              If an account exists for that
              email address, password reset
              instructions have been sent.
            </div>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#788398]">
              Check your inbox and spam folder.
              The reset link will expire after
              the configured security period.
            </p>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="mt-5 min-h-11 w-full rounded-[11px] border border-[#dfe4ed] bg-white px-4 text-sm font-bold text-[#43506a] transition hover:bg-[#fafbfe]"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form
            className="mt-7 grid gap-5"
            onSubmit={handleSubmit}
          >
            <label
              className="grid gap-2 text-xs font-bold text-[#43506a]"
              htmlFor="reset-email"
            >
              Email address

              <input
                id="reset-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                placeholder="you@example.com"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "Send reset link"}

              <Send size={15} />
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#5c50ec] hover:underline"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </section>
    </main>
  );
}