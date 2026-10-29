import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import RoleChrome from "../components/RoleChrome";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";      
import { authApi } from "../api/authApi";

const MIN_PASSWORD_LENGTH = 8;

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  
  const [notifications, setNotifications] = useState(
    localStorage.getItem("cmt_notifications") !== "off"
  );
  const saveNotifications = (value) => {
    setNotifications(value);
    localStorage.setItem("cmt_notifications", value ? "on" : "off");
  };

  /* ---- Change password ---- */
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ---- Delete account ---- */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /* ---- Auto-dismiss success message ---- */
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  /* ---- Change password submit ---- */
  async function changePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!current || !next || !confirm) {
      setError("Please complete all password fields.");
      return;
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage("Password updated successfully.");
    } catch (err) {
      // 422 — field-level errors from Laravel
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
        setError(err.message || "Please fix the highlighted fields.");
      } else if (err?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(err?.message || "Unable to update password.");
      }
    } finally {
      setSaving(false);
    }
  }

  /* ---- Delete account ---- */
  async function confirmDelete() {
  if (!deletePassword.trim()) {
    setDeleteError("Please enter your current password.");
    return;
  }

  setDeleting(true);
  setDeleteError("");

  try {
    await authApi.deleteAccount(deletePassword);

    setDeleteConfirmOpen(false);
    setDeletePassword("");

    await logout();

    navigate("/login", {
      replace: true,
    });
  } catch (err) {
    const firstError = Object.values(
      err?.errors || {}
    ).flat()[0];

    setDeleteError(
      firstError ||
        err?.message ||
        "Could not delete your account."
    );
  } finally {
    setDeleting(false);
  }
}

  /* ---- Password strength indicator ---- */
  const pwHint =
    next.length === 0
      ? null
      : next.length < MIN_PASSWORD_LENGTH
      ? `${MIN_PASSWORD_LENGTH - next.length} more character${
          MIN_PASSWORD_LENGTH - next.length === 1 ? "" : "s"
        } needed`
      : confirm.length > 0 && next !== confirm
      ? "Passwords don't match yet"
      : "Looks good";

  const initials =
    (user?.name ?? user?.full_name ?? "U")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return (
    <RoleChrome>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#07132f] via-[#0b1740] to-[#1c1a5c] p-6 text-white shadow-[0_24px_60px_-15px_rgba(7,19,47,.35)] sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6655f6]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#2875ff]/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:radial-gradient(rgba(255,255,255,.25)_0.7px,transparent_0.7px)] [background-size:24px_24px]" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.08] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#bcb6ff]">
            <Palette size={11} /> Workspace controls
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-.03em] text-white sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-white/60">
            Manage how CMT looks and behaves for you, and update your account
            security. Appearance and notifications are saved on this device.
          </p>
        </div>
      </section>

      {/* ============ Profile card ============ */}
      {user && (
        <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-[0_10px_30px_-15px_rgba(15,28,65,.1)] dark:border-[#1e293b] dark:bg-[#0f172a]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e8e6ff] to-[#d8d4ff] text-[16px] font-black text-[#4f46c7] dark:from-[#2a2354] dark:to-[#1e1a45] dark:text-[#a9a2ff]">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[15px] font-black text-[#102044] dark:text-white">
                {user.name ?? user.full_name ?? "—"}
              </strong>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7c879c] dark:text-[#94a3b8]">
                <Mail size={11} /> {user.email ?? "—"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e8f0] bg-[#fafbff] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#43506a] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#cbd5e1]">
              <UserRound size={11} />
              {user.role ?? "Member"}
            </span>
          </div>
        </section>
      )}

      {/* ============ Quick toggles ============ */}
      <section className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => saveNotifications(!notifications)}
          className="group relative overflow-hidden rounded-[20px] border border-[#e4e8f0] bg-white p-5 text-left shadow-[0_10px_30px_-15px_rgba(15,28,65,.1)] transition hover:-translate-y-px hover:border-[#d6dbe8] hover:shadow-[0_20px_40px_-18px_rgba(15,28,65,.15)] dark:border-[#1e293b] dark:bg-[#0f172a] dark:hover:border-[#334155]"
        >
          <div
            className={`grid h-11 w-11 place-items-center rounded-xl transition ${
              notifications
                ? "bg-[#efedff] text-[#4f46c7] dark:bg-[#2a2354] dark:text-[#a9a2ff]"
                : "bg-[#f5f6fa] text-[#8a95a8] dark:bg-[#1e293b] dark:text-[#94a3b8]"
            }`}
          >
            {notifications ? <Bell size={19} /> : <BellOff size={19} />}
          </div>
          <strong className="mt-4 block text-[13px] font-bold text-[#1c2a4a] dark:text-white">
            Notifications
          </strong>
          <span
            className={`mt-1 block text-[10px] font-semibold ${
              notifications
                ? "text-[#18794e] dark:text-[#34d399]"
                : "text-[#8a95a8] dark:text-[#94a3b8]"
            }`}
          >
            {notifications ? "Enabled" : "Muted"}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="group relative overflow-hidden rounded-[20px] border border-[#e4e8f0] bg-white p-5 text-left shadow-[0_10px_30px_-15px_rgba(15,28,65,.1)] transition hover:-translate-y-px hover:border-[#d6dbe8] hover:shadow-[0_20px_40px_-18px_rgba(15,28,65,.15)] dark:border-[#1e293b] dark:bg-[#0f172a] dark:hover:border-[#334155]"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#efedff] text-[#4f46c7] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
            {dark ? <Moon size={19} /> : <Sun size={19} />}
          </div>
          <strong className="mt-4 block text-[13px] font-bold text-[#1c2a4a] dark:text-white">
            Appearance
          </strong>
          <span className="mt-1 block text-[10px] font-semibold text-[#66728b] dark:text-[#94a3b8]">
            {dark ? "Dark mode" : "Light mode"}
          </span>
        </button>

        <div className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,28,65,.1)] dark:border-[#1e293b] dark:bg-[#0f172a]">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef5fd] text-[#1d5fa8] dark:bg-[#0c2340] dark:text-[#60a5fa]">
            <Palette size={19} />
          </div>
          <strong className="mt-4 block text-[13px] font-bold text-[#1c2a4a] dark:text-white">
            Workspace theme
          </strong>
          <span className="mt-1 block text-[10px] font-semibold text-[#66728b] dark:text-[#94a3b8]">
            CMT professional
          </span>
        </div>
      </section>

      {/* ============ Change password ============ */}
      <section className="rounded-[24px] border border-[#e5e9f1] bg-white p-6 shadow-[0_10px_30px_-15px_rgba(15,28,65,.1)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#efedff] text-[#5b4fe3] dark:bg-[#2a2354] dark:text-[#a9a2ff]">
              <LockKeyhole size={19} />
            </span>
            <div>
              <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#6655f6] dark:text-[#a9a2ff]">
                Security
              </p>
              <h2 className="mt-1 text-xl font-black text-[#102044] dark:text-white">
                Change password
              </h2>
              <p className="mt-1 max-w-[440px] text-[11px] leading-5 text-[#7c879c] dark:text-[#94a3b8]">
                New password must be at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={changePassword} className="mt-8 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            {/* Current password */}
            <label className="grid gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                Current password
              </span>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-[52px] w-full rounded-xl border border-[#dfe4ed] bg-white pl-4 pr-11 text-sm font-semibold text-[#1c2a4a] outline-none transition focus:border-[#6655f6] focus:ring-4 focus:ring-[#6655f6]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white dark:placeholder:text-[#64748b]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#98a1b3] transition hover:bg-[#f3f5f9] hover:text-[#5c6880] dark:hover:bg-[#1e293b]"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.current_password?.[0] && (
                <span role="alert" className="text-[10px] font-semibold text-red-600 dark:text-[#f08a9a]">
                  {fieldErrors.current_password[0]}
                </span>
              )}
            </label>

            {/* New password */}
            <label className="grid gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                New password
              </span>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  autoComplete="new-password"
                  className="h-[52px] w-full rounded-xl border border-[#dfe4ed] bg-white pl-4 pr-11 text-sm font-semibold text-[#1c2a4a] outline-none transition focus:border-[#6655f6] focus:ring-4 focus:ring-[#6655f6]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white dark:placeholder:text-[#64748b]"
                />
                <button
                  type="button"
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#98a1b3] transition hover:bg-[#f3f5f9] hover:text-[#5c6880] dark:hover:bg-[#1e293b]"
                  aria-label={showNext ? "Hide password" : "Show password"}
                >
                  {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password?.[0] && (
                <span role="alert" className="text-[10px] font-semibold text-red-600 dark:text-[#f08a9a]">
                  {fieldErrors.password[0]}
                </span>
              )}
            </label>

            {/* Confirm password */}
            <label className="grid gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#69758b] dark:text-[#94a3b8]">
                Confirm password
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className="h-[52px] w-full rounded-xl border border-[#dfe4ed] bg-white px-4 text-sm font-semibold text-[#1c2a4a] outline-none transition focus:border-[#6655f6] focus:ring-4 focus:ring-[#6655f6]/10 dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-white dark:placeholder:text-[#64748b]"
              />
            </label>
          </div>

          {/* Password strength hint */}
          {pwHint && (
            <div className="flex items-center gap-2 rounded-xl border border-[#eef1f7] bg-[#fafbff] px-4 py-2.5 text-[10px] font-semibold text-[#7c879c] dark:border-[#1e293b] dark:bg-[#0b1224] dark:text-[#94a3b8]">
              <ShieldCheck size={12} className="text-[#6655f6] dark:text-[#a9a2ff]" />
              <span>{pwHint}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-5 text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
            >
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-[11px] font-semibold text-[#18794e] dark:border-[#1e4d33] dark:bg-[#052e1f] dark:text-[#34d399]"
            >
              <Check size={13} /> {message}
            </div>
          )}

          <div className="flex justify-end border-t border-[#eef1f7] pt-5 dark:border-[#1e293b]">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-[12px] font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(37,99,235,.5)] transition hover:-translate-y-px hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      {/* ============ Danger zone — delete account ============ */}
      <section className="rounded-[24px] border border-red-200 bg-red-50/60 p-6 shadow-[0_10px_30px_-15px_rgba(220,38,38,.15)] dark:border-[#5b1e1e] dark:bg-[#2a1218]/40 sm:p-8">
        <header className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700 dark:bg-[#3a1515] dark:text-[#f08a9a]">
            <Trash2 size={19} />
          </span>
          <div>
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.13em] text-red-700 dark:text-[#f08a9a]">
              Danger zone
            </p>
            <h2 className="mt-1 text-xl font-black text-red-900 dark:text-[#f5c5c5]">
              Delete account
            </h2>
            <p className="mt-1 max-w-[520px] text-[11px] leading-5 text-red-800/80 dark:text-[#f08a9a]/80">
              Permanently remove your account and every submission, review,
              registration, and testimonial tied to it. This cannot be undone.
            </p>
          </div>
        </header>

        {!deleteConfirmOpen ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-[12px] font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(220,38,38,.5)] transition hover:-translate-y-px hover:bg-red-700"
            >
              <Trash2 size={14} /> Delete my account
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-red-300 bg-white p-5 dark:border-[#5b1e1e] dark:bg-[#1a0e0e]">
            <p className="m-0 text-[12px] font-bold text-red-900 dark:text-[#f5c5c5]">
              Are you absolutely sure?
            </p>
            <p className="mt-1 text-[11px] leading-5 text-red-800/80 dark:text-[#f08a9a]/80">
              This will permanently delete your account and related account data. You
              cannot recover it.
            </p>

            <label className="mt-4 grid gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[.08em] text-red-800 dark:text-[#f08a9a]">
                Current password
              </span>

              <input
                type="password"
                value={deletePassword}
                onChange={(event) => {
                  setDeletePassword(event.target.value);
                  setDeleteError("");
                }}
                autoComplete="current-password"
                placeholder="Enter your current password"
                disabled={deleting}
                className="h-11 rounded-xl border border-red-200 bg-white px-3 text-sm text-[#1c2a4a] outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-[#5b1e1e] dark:bg-[#0f172a] dark:text-white"
              />
            </label>

            {deleteError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
              >
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={deleting}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#e4e8f0] bg-white px-5 text-[12px] font-extrabold text-[#43506a] transition hover:-translate-y-px hover:border-[#c9cfe0] hover:bg-[#fafbff] disabled:opacity-50 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#111c33]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-[12px] font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(220,38,38,.5)] transition hover:-translate-y-px hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Trash2 size={13} />
                {deleting ? "Deleting…" : "Yes, delete forever"}
              </button>
            </div>
          </div>
        )}
      </section>
    </RoleChrome>
  );
}