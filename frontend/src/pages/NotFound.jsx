import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PublicFooter from "../components/PublicFooter";

const publicLinks = [
  { label: "Conferences", to: "/conferences" },
  { label: "Help & FAQ", to: "/help-faq" },
  { label: "Contact", to: "/contact" },
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />
      <main className="relative isolate grid min-h-[calc(100vh-82px)] place-items-center overflow-hidden px-5 py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(121,104,255,.16),transparent_35%),linear-gradient(180deg,#f7f9fc,#fff)]"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-[780px] text-center">
          <div
            className="relative mx-auto mb-8 grid h-48 w-48 place-items-center sm:h-56 sm:w-56"
            aria-hidden="true"
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-[#c9c4ff]" />
            <div className="absolute inset-7 rounded-full bg-gradient-to-br from-[#efedff] to-white shadow-[0_20px_60px_rgba(84,73,220,.12)]" />
            <div className="relative grid h-20 w-20 place-items-center rounded-[26px] bg-gradient-to-br from-[#6655f6] to-[#342b87] text-white shadow-[0_18px_36px_rgba(84,73,220,.3)]">
              <Compass size={38} strokeWidth={1.5} />
            </div>
            <span className="absolute right-8 top-8 h-3 w-3 rounded-full bg-[#8b7eff]" />
            <span className="absolute bottom-8 left-7 h-2.5 w-2.5 rounded-full bg-[#b9b3ff]" />
          </div>

          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.16em] text-[#5c50ec]">
            Error 404
          </p>
          <h1 className="mx-auto mb-4 max-w-[620px] text-[clamp(34px,6vw,58px)] font-bold leading-[1.05] tracking-[-.05em]">
            This page isn’t on the programme.
          </h1>
          <p className="mx-auto mb-8 max-w-[520px] text-sm leading-7 text-[#66728b] sm:text-base">
            The link may be out of date, or the page may have moved. Let’s get
            you back to somewhere useful.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe4ed] bg-white px-5 text-sm font-bold text-[#35415f] shadow-sm transition hover:border-[#c8c0ff] hover:text-[#5649dc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7568f7]/20"
            >
              <ArrowLeft size={16} />
              Go back
            </button>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 text-sm font-bold text-white no-underline shadow-[0_10px_26px_rgba(103,87,245,.24)] transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7568f7]/30"
            >
              Back to home <ArrowRight size={16} />
            </Link>
          </div>

          <nav
            className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3"
            aria-label="Helpful pages"
          >
            {publicLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded px-1 py-1 text-sm font-semibold text-[#66728b] underline decoration-[#c9c4ff] underline-offset-4 transition hover:text-[#5649dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7568f7]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
