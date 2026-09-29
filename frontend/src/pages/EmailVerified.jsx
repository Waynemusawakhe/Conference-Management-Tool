import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CircleCheckBig,
  CircleX,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Logo from "../components/Logo";
import Navbar from "../components/Navbar";

export default function EmailVerified() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status") || "success";
  const successful = status === "success" || status === "verified";

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-76px)] items-center overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-16 text-white">
        <div className="absolute inset-0 opacity-[.15] [background-image:radial-gradient(rgba(255,255,255,.16)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

        <div className="relative z-10 mx-auto grid w-[min(1050px,100%)] items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <section className="hidden lg:block">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
              <Sparkles size={15} />
              Account verification
            </span>

            <h1 className="mt-4 max-w-[470px] text-5xl font-bold leading-[1.05] tracking-[-.055em]">
              Your CMT account is ready.
            </h1>

            <p className="mt-5 max-w-[440px] text-sm leading-7 text-white/65">
              Email verification helps protect conference accounts and confirms
              that important CMT notifications reach the correct person.
            </p>

            <div className="mt-9 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck size={20} className="text-[#9b91ff]" />
              <span className="text-xs font-semibold text-white/80">
                Secure account verification
              </span>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[500px] rounded-[24px] border border-white/15 bg-white p-7 text-[#0d1b3d] shadow-[0_28px_80px_rgba(0,0,0,.32)] sm:p-10">
            <div className="mb-7 flex justify-center lg:hidden">
              <Logo />
            </div>

            <div
              className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
                successful
                  ? "bg-[#effaf4] text-[#18794e]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {successful ? (
                <CircleCheckBig size={34} />
              ) : (
                <CircleX size={34} />
              )}
            </div>

            <div className="mt-6 text-center">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] ${
                  successful ? "text-[#18794e]" : "text-red-600"
                }`}
              >
                <MailCheck size={14} />
                Email verification
              </span>

              <h2 className="mb-0 mt-3 text-[30px] font-bold tracking-[-.045em]">
                {successful
                  ? "Email verified successfully"
                  : "Verification link could not be completed"}
              </h2>

              <p className="mx-auto mb-0 mt-3 max-w-[390px] text-xs leading-6 text-[#788398]">
                {successful
                  ? "Your email address has been confirmed. You can now log in and continue to your CMT workspace."
                  : "This verification link may be invalid or expired. Return to CMT and request a new verification email if necessary."}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-[#e4e8f0] bg-[#fafbfe] p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#efedff] text-[#5c50ec]">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <strong className="block text-xs text-[#263451]">
                    {successful ? "Verification complete" : "Need another link?"}
                  </strong>

                  <p className="mb-0 mt-1 text-[10px] leading-5 text-[#7b869b]">
                    {successful
                      ? "Your account can now use the features available to your assigned CMT role."
                      : "Return to the login or registration flow to continue."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              <Link
                to="/login"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.24)] transition hover:-translate-y-px"
              >
                Continue to login
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/"
                className="flex min-h-11 items-center justify-center rounded-xl border border-[#dfe4ed] bg-white px-5 text-xs font-bold text-[#59657d] hover:bg-[#fafbfe]"
              >
                Back to CMT home
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
