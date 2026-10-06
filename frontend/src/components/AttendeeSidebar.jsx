import {
  Compass,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Settings,
  TicketCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors ${
        active
          ? "bg-[#efedff] font-extrabold text-[#5649dc]"
          : "font-semibold text-[#66728b] hover:bg-[#f5f6fa] hover:text-[#1c2a4a]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AttendeeSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#07132f]/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close attendee navigation"
        />
      )}

      <aside
        className={`${
          open ? "fixed left-4 top-[88px] z-40 block" : "hidden"
        } w-[250px] shrink-0 rounded-2xl border border-[#e4e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,28,65,.12)] lg:sticky lg:top-[100px] lg:block lg:h-[calc(100vh-124px)] lg:shadow-none`}
      >
        <div className="mb-3 rounded-xl bg-gradient-to-br from-[#111e4b] to-[#342b87] p-4 text-white">
          <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white/10">
            <TicketCheck size={17} />
          </span>

          <strong className="block text-[13px]">
            Your conference hub
          </strong>

          <p className="mt-1 text-[10px] leading-5 text-white/60">
            Track your registrations and discover upcoming conferences.
          </p>
        </div>

        <nav
          className="space-y-1"
          aria-label="Attendee dashboard navigation"
        >
          <NavItem
            icon={<LayoutDashboard size={16} />}
            label="Overview"
            active={location.pathname === "/attendee-dashboard"}
            onClick={() => goTo("/attendee-dashboard")}
          />

          <NavItem
            icon={<TicketCheck size={16} />}
            label="My registrations"
            active={location.pathname === "/my-conferences"}
            onClick={() => goTo("/my-conferences")}
          />

          <NavItem
            icon={<Compass size={16} />}
            label="Browse conferences"
            active={location.pathname === "/conferences"}
            onClick={() => goTo("/conferences")}
          />
        </nav>

        <div className="my-4 border-t border-[#edf0f5]" />

        <NavItem
          icon={<UserRound size={16} />}
          label="Profile"
          active={location.pathname === "/profile"}
          onClick={() => goTo("/profile")}
        />

        <NavItem
          icon={<Settings size={16} />}
          label="Settings"
          active={location.pathname === "/settings"}
          onClick={() => goTo("/settings")}
        />

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#9a6470] transition-colors hover:bg-[#fff4f5] disabled:cursor-wait disabled:opacity-70"
        >
          {signingOut ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}

          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </aside>
    </>
  );
}
