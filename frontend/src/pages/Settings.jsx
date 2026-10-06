import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  LockKeyhole,
  Moon,
  Palette,
  Shield,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";

function getDashboardPath(role) {
  switch (role) {
    case "author":
      return "/author-dashboard";

    case "reviewer":
      return "/reviewer-dashboard";

    case "organiser":
      return "/organiser-dashboard";

    case "admin":
      return "/admin-dashboard";

    case "attendee":
      return "/my-conferences";

    default:
      return "/login";
  }
}

function getErrorMessage(error) {
  const first =
    Object.values(
      error?.errors || {}
    )[0];

  return Array.isArray(first)
    ? first[0]
    : first ||
        error?.message ||
        "Something went wrong.";
}

function DeleteAccountModal({
  onClose,
  onDeleted,
}) {
  const [password, setPassword] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const canDelete =
    password.length > 0 &&
    confirmation === "DELETE";

  const submit = async (event) => {
    event.preventDefault();

    if (!password) {
      setError(
        "Enter your current password."
      );
      return;
    }

    if (
      confirmation !== "DELETE"
    ) {
      setError(
        'Type DELETE to confirm account deletion.'
      );
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await authApi.deleteAccount(
        password
      );

      await onDeleted();
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07132f]/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[520px] rounded-[24px] bg-white p-6 text-[#0d1b3d] shadow-[0_30px_90px_rgba(7,19,47,.35)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle
                size={20}
              />
            </span>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-red-600">
                Danger zone
              </span>

              <h2 className="mb-0 mt-1 text-xl font-black">
                Delete account
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f5f9] text-[#657089]"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-[11px] leading-6 text-red-800">
          Deleting your account is
          permanent. Your personal
          account data and data linked
          through database cascade rules
          will be removed.
        </div>

        <p className="mt-4 text-[11px] leading-6 text-[#6d7890]">
          Organisers who still own
          conferences cannot delete their
          accounts until those conferences
          have been transferred or removed.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 grid gap-4"
        >
          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
            Current password

            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );
                setError("");
              }}
              autoComplete="current-password"
              placeholder="Enter your current password"
              className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </label>

          <label className="grid gap-1.5 text-[11px] font-bold text-[#43506a]">
            Type DELETE to confirm

            <input
              type="text"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(
                  event.target.value
                );
                setError("");
              }}
              autoComplete="off"
              placeholder="DELETE"
              className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-sm font-normal outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-1 flex flex-wrap justify-end gap-2 border-t border-[#edf0f5] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-xs font-bold text-[#66728b] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                deleting ||
                !canDelete
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />

              {deleting
                ? "Deleting..."
                : "Delete account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  const {
    role,
    logout,
  } = useAuth();

  const {
    dark,
    toggleTheme,
  } = useTheme();

  const [
    notifications,
    setNotifications,
  ] = useState(
    localStorage.getItem(
      "cmt_notifications"
    ) !== "off"
  );

  const [current, setCurrent] =
    useState("");

  const [next, setNext] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const saveNotifications = (
    value
  ) => {
    setNotifications(value);

    localStorage.setItem(
      "cmt_notifications",
      value ? "on" : "off"
    );
  };

  const changePassword =
    async (event) => {
      event.preventDefault();

      setError("");
      setMessage("");

      if (
        !current ||
        !next ||
        !confirm
      ) {
        setError(
          "Complete all password fields."
        );
        return;
      }

      if (next.length < 8) {
        setError(
          "New password must be at least 8 characters."
        );
        return;
      }

      if (next !== confirm) {
        setError(
          "New password and confirmation do not match."
        );
        return;
      }

      try {
        await authApi.changePassword({
          current_password:
            current,
          password:
            next,
          password_confirmation:
            confirm,
        });

        setCurrent("");
        setNext("");
        setConfirm("");

        setMessage(
          "Password updated successfully."
        );
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      }
    };

  const accountDeleted =
    async () => {
      /*
       * The server has already revoked
       * the user's tokens and deleted
       * the account.
       *
       * logout() still clears the token
       * and authentication state locally,
       * even if its API request receives
       * a 401 after deletion.
       */
      await logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  return (
    <div className="min-h-screen bg-[#07132f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                getDashboardPath(
                  role
                )
              )
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={17}
            />
          </button>

          <Logo />

          <div className="ml-auto text-right">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">
              CMT Settings
            </p>

            <p className="m-0 text-[10px] text-white/50">
              Preferences & security
            </p>
          </div>
        </div>
      </header>

      <main className="relative min-h-[calc(100vh-76px)] overflow-hidden px-4 py-10 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(103,87,245,.22),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(27,94,255,.15),transparent_30%),linear-gradient(135deg,#07132f,#0b1740_55%,#17165b)]" />

        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(rgba(255,255,255,.4)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

        <div className="relative mx-auto w-[min(900px,100%)] space-y-5">
          <section className="rounded-[24px] border border-white/10 bg-white/[.06] p-7 backdrop-blur-xl sm:p-9">
            <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">
              Workspace controls
            </span>

            <h1 className="mt-2 text-3xl font-bold">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-white/55">
              Control how CMT behaves
              for you. These controls
              are intentionally
              separate from your
              personal profile.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  saveNotifications(
                    !notifications
                  )
                }
                className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-left transition hover:bg-white/10"
              >
                <Bell
                  size={18}
                  className="text-[#a49cff]"
                />

                <strong className="mt-4 block text-sm">
                  Notifications
                </strong>

                <span className="mt-1 block text-[10px] text-white/45">
                  {notifications
                    ? "Enabled"
                    : "Muted"}
                </span>
              </button>

              <button
                type="button"
                onClick={
                  toggleTheme
                }
                className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-left transition hover:bg-white/10"
              >
                {dark ? (
                  <Moon
                    size={18}
                    className="text-[#a49cff]"
                  />
                ) : (
                  <Sun
                    size={18}
                    className="text-[#a49cff]"
                  />
                )}

                <strong className="mt-4 block text-sm">
                  Appearance
                </strong>

                <span className="mt-1 block text-[10px] text-white/45">
                  {dark
                    ? "Dark mode"
                    : "Light mode"}
                </span>
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
                <Palette
                  size={18}
                  className="text-[#a49cff]"
                />

                <strong className="mt-4 block text-sm">
                  Workspace
                </strong>

                <span className="mt-1 block text-[10px] text-white/45">
                  CMT professional
                  theme
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-white p-7 text-[#0d1b3d] shadow-2xl sm:p-9">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efedff] text-[#5b4fe3]">
                <LockKeyhole
                  size={18}
                />
              </span>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">
                  Security
                </span>

                <h2 className="mt-1 text-xl font-bold">
                  Change password
                </h2>

                <p className="mt-1 text-xs text-[#7b869b]">
                  Update your login
                  credentials without
                  changing your
                  profile.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                changePassword
              }
              className="mt-6 grid gap-4 sm:grid-cols-3"
            >
              <input
                type="password"
                value={current}
                onChange={(event) => {
                  setCurrent(
                    event.target.value
                  );
                  setError("");
                  setMessage("");
                }}
                placeholder="Current password"
                autoComplete="current-password"
                className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none focus:border-[#6655f6]"
              />

              <input
                type="password"
                value={next}
                onChange={(event) => {
                  setNext(
                    event.target.value
                  );
                  setError("");
                  setMessage("");
                }}
                placeholder="New password"
                autoComplete="new-password"
                className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none focus:border-[#6655f6]"
              />

              <input
                type="password"
                value={confirm}
                onChange={(event) => {
                  setConfirm(
                    event.target.value
                  );
                  setError("");
                  setMessage("");
                }}
                placeholder="Confirm password"
                autoComplete="new-password"
                className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none focus:border-[#6655f6]"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
                {error && (
                  <span className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">
                    {error}
                  </span>
                )}

                {message && (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">
                    <Check
                      size={13}
                    />

                    {message}
                  </span>
                )}

                <button className="ml-auto rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-xs font-extrabold text-white">
                  Update password
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-red-400/20 bg-red-500/10">
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-300">
                  <Shield
                    size={18}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-red-300">
                    Danger zone
                  </span>

                  <h2 className="mb-0 mt-1 text-lg font-bold">
                    Delete account
                  </h2>

                  <p className="mb-0 mt-2 max-w-2xl text-[10px] leading-5 text-white/55">
                    Permanently delete
                    your CMT account.
                    You will be asked
                    for your current
                    password before
                    the deletion is
                    allowed.
                  </p>

                  {role ===
                    "organiser" && (
                    <p className="mb-0 mt-3 text-[10px] font-semibold leading-5 text-amber-200">
                      Organisers cannot
                      delete their
                      account while
                      they still own
                      conferences.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-red-300/10 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteModalOpen(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-[11px] font-extrabold text-red-100 transition hover:bg-red-500/25"
                >
                  <Trash2
                    size={14}
                  />

                  Delete my account
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {deleteModalOpen && (
        <DeleteAccountModal
          onClose={() =>
            setDeleteModalOpen(
              false
            )
          }
          onDeleted={
            accountDeleted
          }
        />
      )}
    </div>
  );
}