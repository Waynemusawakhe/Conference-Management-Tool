import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { label: "Conferences", to: "/conferences" },
  { label: "About CMT", to: "/about" },
  { label: "Testimonials", to: "/testimonials" },
  { label: "Help & FAQ", to: "/help-faq" },
  { label: "Contact", to: "/contact" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[#07132f] text-white">
      <div className="mx-auto grid w-[min(1200px,calc(100%-40px))] gap-10 py-12 sm:grid-cols-[1.2fr_.8fr] sm:items-center">
        <div>
          <Link
            to="/"
            aria-label="CMT home"
            className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
          >
            <Logo />
          </Link>
          <p className="mb-0 mt-4 max-w-[430px] text-sm leading-6 text-white/60">
            Conference Management Tool — a shared place to discover and manage
            conference activity.
          </p>
        </div>

        <div className="sm:justify-self-end">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]">
            Explore CMT
          </p>
          <nav className="flex max-w-[420px] flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-11 items-center rounded px-1 text-sm text-white/70 no-underline transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b3ff]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-[min(1200px,calc(100%-40px))] flex-wrap items-center justify-between gap-4 py-5">
          <span className="text-xs text-white/45">
            © {new Date().getFullYear()} CMT. Conference Management Tool.
          </span>
          <Link
            to="/conferences"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#192354] no-underline transition hover:bg-[#efedff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b9b3ff]/50"
          >
            Explore conferences <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
