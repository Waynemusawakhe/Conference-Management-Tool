import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Edit3,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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

  const dashboardPath =
    role === "organiser"
      ? "/organiser-dashboard"
      : role === "reviewer"
        ? "/ReviewerDashboard"
        : role === "admin"
          ? "/AdminDashboard"
          : "/author-dashboard";

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

      setTimeout(() => {
        setSaved(false);
      }, 2200);

      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await authApi.updateProfile({
        name: trimmedName,
      });

      await refreshUser();

      setName(trimmedName);
      setEditing(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2200);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#102044]">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-[#e5e9f2] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e4e8f0] bg-white text-[#536078] transition hover:-translate-x-0.5 hover:border-[#6655f6] hover:text-[#6655f6]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={17} />
          </button>

          <Logo />

          <div className="ml-auto hidden text-right sm:block">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6655f6]">
              My Profile
            </p>
            <p className="m-0 mt-0.5 text-[10px] text-[#8993a7]">
              Your CMT identity
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1120px,calc(100%-28px))] py-7 sm:py-10">
        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#07132f] p-6 text-white shadow-[0_20px_60px_rgba(7,19,47,.16)] sm:p-9">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#6655f6]/25 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-[#2875ff]/15 blur-3xl" />

          <div className="relative flex flex-col gap-7 md:flex-row md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="grid h-28 w-28 place-items-center rounded-full border-[5px] border-white/15 bg-gradient-to-br from-[#e9e7ff] to-[#cfcaff] text-3xl font-black text-[#5146ca] shadow-2xl">
                {initials}
              </div>

              <div className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-4 border-[#07132f] bg-[#71d9a6] text-[#09251a]">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#bcb6ff]">
                  CMT Member
                </span>

                {saved && (
                  <span className="flex items-center gap-1 rounded-full bg-[#71d9a6]/10 px-3 py-1 text-[9px] font-bold text-[#a7e8c5]">
                    <Check size={11} />
                    Profile saved
                  </span>
                )}
              </div>

              <h1 className="mt-3 truncate text-2xl font-black sm:text-3xl">
                {user?.name || "CMT User"}
              </h1>

              <p className="mt-1 text-sm text-white/55">
                {getRoleDescription(role)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                <span className="flex items-center gap-2">
                  <Mail size={14} className="text-[#aaa2ff]" />
                  {user?.email || "No email available"}
                </span>

                <span className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-[#71d9a6]" />
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Edit button */}
            <button
              type="button"
              onClick={startEditing}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-xs font-extrabold transition hover:bg-white/15"
            >
              <Edit3 size={15} />
              Edit profile
            </button>
          </div>
        </section>

        {/* Main profile area */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          {/* Personal information */}
          <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#6655f6]">
                  Personal information
                </p>

                <h2 className="mt-2 text-xl font-black text-[#102044]">
                  Your profile details
                </h2>

                <p className="mt-1 max-w-xl text-xs leading-6 text-[#7c879c]">
                  Keep the information shown across your CMT account
                  accurate and up to date.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center gap-2 rounded-lg border border-[#e1e5ed] px-3 py-2 text-[10px] font-extrabold text-[#59647a] transition hover:border-[#6655f6] hover:text-[#6655f6]"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
              )}
            </div>

            <div className="mt-7 grid gap-5">
              {/* Full name */}
              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#69758b]">
                  Full name
                </label>

                {editing ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#dfe4ed] bg-white px-3 transition focus-within:border-[#6655f6] focus-within:ring-4 focus-within:ring-[#6655f6]/10">
                    <UserRound
                      size={17}
                      className="shrink-0 text-[#8993a7]"
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                        setSaved(false);
                      }}
                      className="h-12 w-full border-0 bg-transparent text-sm font-semibold text-[#102044] outline-none"
                      placeholder="Your full name"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4">
                    <UserRound size={17} className="text-[#7d88a0]" />
                    <span className="text-sm font-semibold text-[#243252]">
                      {user?.name || "Not provided"}
                    </span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#69758b]">
                  Email address
                </label>

                <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4">
                  <Mail size={17} className="text-[#7d88a0]" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#243252]">
                      {user?.email || "Not provided"}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#9aa3b5]">
                      Login email
                    </p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.08em] text-[#69758b]">
                  CMT role
                </label>

                <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4">
                  <ShieldCheck size={17} className="text-[#6655f6]" />

                  <div>
                    <p className="text-sm font-semibold text-[#243252]">
                      {roleLabel}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#9aa3b5]">
                      Assigned account role
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold leading-5 text-red-700">
                  {error}
                </div>
              )}

              {editing && (
                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-xl border border-[#dfe4ed] px-5 py-3 text-xs font-extrabold text-[#59647a] transition hover:bg-[#f7f8fb] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving || !name.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#6655f6] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-[#6655f6]/20 transition hover:-translate-y-0.5 hover:bg-[#5847e8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Profile overview */}
          <aside className="space-y-6">
            {/* Role card */}
            <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-sm">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eeeaff] text-[#6655f6]">
                <UsersRound size={20} />
              </div>

              <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#8b95a8]">
                Account role
              </p>

              <h3 className="mt-1 text-lg font-black text-[#102044]">
                {roleLabel}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#7c879c]">
                {getRoleDescription(role)} permissions and workspace
                access are connected to this account role.
              </p>
            </section>

            {/* Account status */}
            <section className="rounded-[24px] border border-[#dcefe5] bg-[#f5fcf8] p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dff6e9] text-[#27945b]">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-xs font-black text-[#175b3a]">
                    Account connected
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#67927c]">
                    Your profile is synced with CMT.
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-[#dcefe5] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#6e8b7b]">
                    Profile status
                  </span>

                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#27945b]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#27945b]" />
                    Active
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer navigation */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#e5e9f1] bg-white px-5 py-4 text-center shadow-sm sm:flex-row sm:text-left">
          <p className="m-0 text-[10px] text-[#8a94a8]">
            Profile information is managed through your authenticated CMT
            account.
          </p>

          <button
            type="button"
            onClick={() => navigate("/account-settings")}
            className="text-[10px] font-extrabold text-[#6655f6] transition hover:text-[#5140df]"
          >
            Open account settings →
          </button>
        </div>
      </main>
    </div>
  );
}