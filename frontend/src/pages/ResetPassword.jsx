import { useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
} from "lucide-react";

import Logo from "../components/Logo";
import { authApi } from "../api/authApi";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") || "";

  const email =
    searchParams.get("email") || "";

  const [formData, setFormData] =
    useState({
      password: "",
      passwordConfirmation: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (!token || !email) {
      setError(
        "This password reset link is invalid or incomplete."
      );

      return;
    }

    if (
      formData.password.length <
      MIN_PASSWORD_LENGTH
    ) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );

      return;
    }

    if (
      formData.password !==
      formData.passwordConfirmation
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        email,
        password:
          formData.password,

        password_confirmation:
          formData.passwordConfirmation,
      });

      setSuccess(true);

      setFormData({
        password: "",
        passwordConfirmation: "",
      });
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
          "Too many password reset attempts. Please wait a minute and try again."
        );
      } else {
        setError(
          err.message ||
            "Unable to reset your password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const validLink =
    Boolean(token && email);

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#15165a,#07132f_65%)] px-5 py-10">
      <section className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {success ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8faf2] text-[#16734b]">
              <CheckCircle2
                size={32}
              />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d]">
              Password reset
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#788398]">
              Your password has been
              changed successfully.
              All previous login tokens
              have been revoked.
            </p>

            <Link
              to="/login"
              className="mt-7 flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white"
            >
              Continue to login
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                <KeyRound size={22} />
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d]">
                Create a new password
              </h1>

              <p className="mt-2 text-xs leading-6 text-[#788398]">
                Choose a new password
                for{" "}
                <strong>
                  {email ||
                    "your CMT account"}
                </strong>
                .
              </p>
            </div>

            {!validLink ? (
              <div className="mt-7">
                <p className="rounded-xl bg-red-50 p-4 text-center text-sm leading-6 text-red-700">
                  This password reset
                  link is invalid or
                  incomplete.
                </p>

                <Link
                  to="/forgot-password"
                  className="mt-5 flex min-h-11 items-center justify-center rounded-[11px] bg-[#6655f6] px-4 text-sm font-bold text-white"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-7 grid gap-5"
              >
                <label
                  className="grid gap-2 text-xs font-bold text-[#43506a]"
                  htmlFor="password"
                >
                  <span className="flex items-center gap-2">
                    <LockKeyhole
                      size={14}
                      className="text-[#5c50ec]"
                    />

                    New password
                  </span>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={
                      MIN_PASSWORD_LENGTH
                    }
                    autoComplete="new-password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="At least 8 characters"
                    className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>

                <label
                  className="grid gap-2 text-xs font-bold text-[#43506a]"
                  htmlFor="passwordConfirmation"
                >
                  Confirm new password

                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    required
                    minLength={
                      MIN_PASSWORD_LENGTH
                    }
                    autoComplete="new-password"
                    value={
                      formData.passwordConfirmation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Repeat your password"
                    className="min-h-11 rounded-[10px] border border-[#dfe4ed] px-3 text-sm font-normal text-[#0d1b3d] outline-none transition focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10"
                  />
                </label>

                {formData.passwordConfirmation &&
                  formData.password !==
                    formData.passwordConfirmation && (
                    <p className="text-xs font-semibold text-red-600">
                      Passwords do not match.
                    </p>
                  )}

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 rounded-[11px] bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 text-sm font-bold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Resetting..."
                    : "Reset password"}
                </button>
              </form>
            )}

            <Link
              to="/login"
              className="mt-6 block text-center text-xs font-bold text-[#5c50ec] hover:underline"
            >
              Back to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}