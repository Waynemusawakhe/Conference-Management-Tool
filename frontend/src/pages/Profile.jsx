import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Edit3,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoleChrome from "../components/RoleChrome";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "C"
  );
}

function getRoleLabel(role) {
  if (!role) return "User";
  return role
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRoleDescription(role) {
  switch (role) {
    case "author":
      return "Conference author";
    case "organiser":
      return "Conference organiser";
    case "reviewer":
      return "Conference reviewer";
    case "admin":
      return "System administrator";
    case "attendee":
      return "Conference attendee";
    default:
      return "CMT account member";
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, role, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const initials = useMemo(
    () => getInitials(user?.name || name),
    [user?.name, name]
  );

  const roleLabel = getRoleLabel(role);

  const startEditing = () => {
    setName(user?.name || "");
    setError("");
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setName(user?.name || "");
    setError("");
    setSaved(false);
    setEditing(false);
  };

  const saveProfile = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (trimmedName.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }
    if (trimmedName === user?.name?.trim()) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await authApi.updateProfile({ name: trimmedName });
      await refreshUser();
      setName(trimmedName);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleChrome>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#07132f] via-[#0b1740] to-[#1c1a5c] p-6 text-white shadow-[0_24px_60px_-15px_rgba(7,19,47,.35)] sm:p-10">
        {/* decorative orbs */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6655f6]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#2875ff]/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:radial-gradient(rgba(255,255,255,.25)_0.7px,transparent_0.7px)] [background-size:24px_24px]" />

        <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="grid h-24 w-24 place-items-center rounded-full border-[5px] border-white/15 bg-gradient-to-br from-[#e9e7ff] to-[#cfcaff] text-3xl font-black text-[#5146ca] shadow-[0_20px_50px_-12px_rgba(102,85,246,.7)] sm:h-28 sm:w-28">
              {initials}
            </div>
            <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-[4px] border-[#0b1740] bg-[#22c55e] text-white">
              <Check size={14} strokeWidth={3} />
            </span>
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.08] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#bcb6ff]">
                <BadgeCheck size={11} /> CMT Member
              </span>
              {saved && (
                <span className="flex items-center gap-1.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 text-[9px] font-bold text-[#a7e8c5]">
                  <Check size={11} /> Saved
                </span>
              )}
            </div>

            <h1 className="mt-4 truncate text-3xl font-black leading-tight tracking-[-.03em] sm:text-4xl">
              {user?.name || "CMT User"}
            </h1>

            <p className="mt-1.5 text-sm text-white/60">
              {getRoleDescription(role)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-white/55">
              <span className="inline-flex items-center gap-2">
                <Mail size={14} className="text-[#aaa2ff]" />
                {user?.email || "No email available"}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#a7e8c5]" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Edit action */}
          <button
            type="button"
            onClick={startEditing}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[.08] px-5 py-3 text-[12px] font-extrabold text-white backdrop-blur-sm transition hover:-translate-y-px hover:border-white/25 hover:bg-white/[.14]"
          >
            <Edit3 size={14} className="transition group-hover:rotate-12" />
            Edit profile
          </button>
        </div>
      </section>

      {/* ============ Info grid ============ */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        {/* ---------- Personal information ---------- */}
        <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-[0_10px_30px_-12px_rgba(15,28,65,.08)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#6655f6] dark:text-[#a9a2ff]">
                Personal information
              </p>
              <h2 className="mt-2 text-xl font-black text-[#102044] dark:text-white">
                Profile details
              </h2>
              <p className="mt-1 max-w-[440px] text-[11px] leading-5 text-[#7c879c] dark:text-[#94a3b8]">
                Information shown across your authenticated CMT account.
              </p>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e1e5ed] bg-white px-3 py-2 text-[10px] font-extrabold text-[#59647a] transition hover:-translate-y-px hover:border-[#6655f6] hover:text-[#6655f6] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8] dark:hover:border-[#a9a2ff] dark:hover:text-[#a9a2ff]"
              >
                <Edit3 size={12} /> Edit
              </button>
            )}
          </header>

          <div className="mt-8 grid gap-6">
            {/* Full name */}
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                Full name
              </label>
              {editing ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#dfe4ed] bg-white px-4 transition focus-within:border-[#6655f6] focus-within:ring-4 focus-within:ring-[#6655f6]/10 dark:border-[#1e293b] dark:bg-[#0b1224]">
                  <UserRound size={17} className="shrink-0 text-[#8993a7]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                      setSaved(false);
                    }}
                    className="h-[52px] w-full border-0 bg-transparent text-sm font-semibold text-[#102044] outline-none dark:text-white"
                    placeholder="Your full name"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 dark:border-[#1e293b] dark:bg-[#0b1224]">
                  <UserRound size={17} className="text-[#7d88a0]" />
                  <span className="text-sm font-semibold text-[#243252] dark:text-white">
                    {user?.name || "Not provided"}
                  </span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                Email address
              </label>
              <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 dark:border-[#1e293b] dark:bg-[#0b1224]">
                <Mail size={17} className="text-[#7d88a0]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#243252] dark:text-white">
                    {user?.email || "Not provided"}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[#9aa3b5] dark:text-[#64748b]">
                    Login email
                  </p>
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                Account role
              </label>
              <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 dark:border-[#1e293b] dark:bg-[#0b1224]">
                <ShieldCheck size={17} className="text-[#6655f6] dark:text-[#a9a2ff]" />
                <div>
                  <p className="text-sm font-semibold text-[#243252] dark:text-white">
                    {roleLabel}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[#9aa3b5] dark:text-[#64748b]">
                    Assigned account role
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-5 text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]">
                <X size={13} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Save / cancel row */}
            {editing && (
              <div className="flex flex-col-reverse gap-3 border-t border-[#eef1f7] pt-5 dark:border-[#1e293b] sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-xl border border-[#dfe4ed] px-5 py-3 text-xs font-extrabold text-[#59647a] transition hover:bg-[#f7f8fb] disabled:opacity-50 dark:border-[#1e293b] dark:text-[#94a3b8] dark:hover:bg-[#111c33]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-xs font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(37,99,235,.5)] transition hover:-translate-y-px hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Sidebar ---------- */}
        <aside className="space-y-5">
          {/* Role card */}
          <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-[0_10px_30px_-12px_rgba(15,28,65,.08)] dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eeeaff] text-[#6655f6] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
              <UsersRound size={20} />
            </div>
            <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#8b95a8] dark:text-[#64748b]">
              Account role
            </p>
            <h3 className="mt-1 text-lg font-black text-[#102044] dark:text-white">
              {roleLabel}
            </h3>
            <p className="mt-2 text-[11px] leading-5 text-[#7c879c] dark:text-[#94a3b8]">
              {getRoleDescription(role)} permissions and workspace access are
              connected to this account role.
            </p>
          </section>

          {/* Status card */}
          <section className="relative overflow-hidden rounded-[24px] border border-[#dcefe5] bg-gradient-to-br from-[#f5fcf8] to-[#ecfaf3] p-6 dark:border-[#1e4d33] dark:from-[#052e1f] dark:to-[#04361f]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dff6e9] text-[#27945b] dark:bg-[#0d3d24] dark:text-[#34d399]">
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className="text-xs font-black text-[#175b3a] dark:text-[#34d399]">
                  Account connected
                </p>
                <p className="mt-0.5 text-[9px] text-[#67927c] dark:text-[#4ade80]">
                  Your profile is synced with CMT.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#dcefe5] pt-4 dark:border-[#1e4d33]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#6e8b7b] dark:text-[#4ade80]">
                  Profile status
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#27945b] dark:text-[#34d399]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#27945b] opacity-60 dark:bg-[#34d399]" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#27945b] dark:bg-[#34d399]" />
                  </span>
                  Active
                </span>
              </div>
            </div>
          </section>

          {/* Account settings shortcut */}
          <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-[0_10px_30px_-12px_rgba(15,28,65,.08)] dark:border-[#1e293b] dark:bg-[#0f172a]">
            <p className="m-0 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#8b95a8] dark:text-[#64748b]">
              Security
            </p>
            <h3 className="mt-1 text-sm font-black text-[#102044] dark:text-white">
              Manage account
            </h3>
            <p className="mt-1.5 text-[11px] leading-5 text-[#7c879c] dark:text-[#94a3b8]">
              Change your password or update account preferences from Settings.
            </p>
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#59647a] transition hover:-translate-y-px hover:border-[#6655f6] hover:text-[#6655f6] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8] dark:hover:border-[#a9a2ff] dark:hover:text-[#a9a2ff]"
            >
              Open settings
            </button>
          </section>
        </aside>
      </div>
    </RoleChrome>
  );
}