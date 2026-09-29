import { useState } from "react";
import { Bell, Menu, Sparkles, X } from "lucide-react";
import Logo from "./Logo";
import AttendeeIdentity from "./AttendeeIdentity";
import { useTheme } from "../context/ThemeContext";

export default function AttendeeHeader({
  name,
  onMenuToggle,
  menuOpen = false,
}) {
  const { toggleTheme } = useTheme();
  const [notice, setNotice] = useState(true);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/95 text-white shadow-[0_8px_30px_rgba(7,19,47,.12)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-[min(1400px,calc(100%-32px))] items-center gap-5">
        {onMenuToggle && (
          <button
            type="button"
            className="text-white/80 hover:text-white lg:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle attendee navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <a href="/" aria-label="CMT home" className="shrink-0">
          <Logo />
        </a>

        <div className="hidden h-7 w-px bg-white/10 sm:block" />

        <div className="hidden sm:block">
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a9a2ff]">
            Attendee workspace
          </p>
          <p className="m-0 mt-0.5 text-[12px] font-semibold text-white/65">
            Conference Management Tool
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10"
            onClick={() => setNotice((value) => !value)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {notice && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7d6bff]" />
            )}
          </button>

          <button
            type="button"
            className="hidden h-10 w-10 place-items-center rounded-[11px] border border-white/15 bg-white/[.05] text-white/80 hover:bg-white/10 sm:grid"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Sparkles size={16} />
          </button>

          <AttendeeIdentity name={name} className="ml-1 hidden sm:flex" />
        </div>
      </div>
    </header>
  );
}