<<<<<<< HEAD
import { useState } from "react";
import Navbar from "../components/Navbar";

function AccountSettings()
{
    //CHANGE PASSWORD
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passError, setPassError] = useState("");
    const [passSuccess, setPassSuccess] = useState(false);

    //DELETE ACCOUNT
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handlePassSubmit = (e) => 
    {
        e.preventDefault();
        setPassError("");
        setPassSuccess(false);

        if (!currentPass || !newPass || !confirmPass)
        {
            setPassError("All fields are required.");
            return;
        }
        if (newPass !== confirmPass)
        {
            setPassError("New password and confirmation do not match.");
            return;
        }
        if (newPass.length < 8) 
        {
            setPassError("New password must be at least 8 characters.");
            return;
        }

        //REAL PASSWORD-UPDATE 
        setPassSuccess(true);
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
    };

    const handleDeleteAccount = () => 
    {
        //REAL DELETE ACOOUNT REQUEST
        alert("Account deletion would be processed here.");
    };

    return (
        <div className="site">
        <Navbar />

        <main className="settings-page">
            <div className="container">
            <h1 className="settings-title">Account Settings</h1>
            <p className="settings-subtitle">
                Change your password or delete your account.
            </p>

            {/* CHANGE PASSWORD */}
            <div className="settings-card">
                <h2 className="settings-card-heading">Change Password</h2>

                <form className="settings-form" onSubmit={handlePassSubmit}>
                <div className="form-field">
                    <label className="form-label">Current Password</label>
                    <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">New Password</label>
                    <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">Confirm New Password</label>
                    <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    />
                </div>

                {passError && (
                    <div className="form-error">
                    <span className="field-error">{passError}</span>
                    </div>
                )}

                {passSuccess && (
                    <div className="settings-success">
                    Password updated successfully.
                    </div>
                )}

                <button type="submit" className="btn btn-primary settings-submit">
                    Update Password
                </button>
                </form>
            </div>

            {/* DELETE ACCOUNT */}
            <div className="settings-card settings-danger">
                <h2 className="settings-card-heading">Delete Account</h2>
                <p className="settings-danger-text">
                This will permanently delete your account and all associated data.
                This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                <button
                    className="btn btn-ghost-dark settings-delete-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    Delete My Account
                </button>
                ) : (
                <div className="settings-confirm">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="settings-confirm-actions">
                    <button
                        className="btn btn-ghost-dark"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn settings-delete-confirm-btn"
                        onClick={handleDeleteAccount}
                    >
                        Yes, Delete My Account
                    </button>
                    </div>
                </div>
                )}
            </div>
             <p style={{ textAlign: "center", fontSize: "11px", color: "#9aa4b8", marginTop: "24px"}}>
               VT Marumo 
               </p>
            </div>
        </main>
        </div>
    );
    }

    export default AccountSettings;
    
=======
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";
import { useTheme } from "../context/ThemeContext";

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

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(
    localStorage.getItem("cmt_notifications") !== "off"
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const initials = useMemo(
    () => getInitials(profileName || user?.name),
    [profileName, user?.name]
  );

  const roleLabel = getRoleLabel(role);

  const dashboardPath =
  role === "author"
    ? "/author-dashboard"
    : role === "reviewer"
      ? "/reviewer-dashboard"
      : role === "organiser"
        ? "/organiser-dashboard"
        : role === "admin"
          ? "/admin-dashboard"
          : "/";
          
  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user?.name]);

  const updateNotifications = (value) => {
    setNotifications(value);
    localStorage.setItem("cmt_notifications", value ? "on" : "off");
  };

  const saveProfile = async () => {
    const trimmedName = profileName.trim();

    setProfileError("");
    setProfileMessage("");

    if (!trimmedName) {
      setProfileError("Please enter your full name.");
      return;
    }

    if (trimmedName.length < 2) {
      setProfileError("Your name must contain at least 2 characters.");
      return;
    }

    if (trimmedName === user?.name?.trim()) {
      setProfileMessage("Your profile is already up to date.");
      return;
    }

    setProfileSaving(true);

    try {
      await authApi.updateProfile({
        name: trimmedName,
      });

      setProfileName(trimmedName);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(
        error?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirmation do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Your new password must be different from your current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(
        error?.message ||
          "Unable to update your password. Please check your current password and try again."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07132f] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={17} />
          </button>

          <Logo />

          <div className="ml-auto text-right">
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">
              CMT Settings
            </p>
            <p className="m-0 text-[10px] text-white/50">
              Account & preferences
            </p>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="relative min-h-[calc(100vh-76px)] overflow-hidden px-4 py-10 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(103,87,245,.22),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(27,94,255,.15),transparent_32%),linear-gradient(135deg,#07132f,#0b1740_55%,#17165b)]" />

        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(rgba(255,255,255,.4)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

        <div className="relative mx-auto w-[min(1050px,100%)]">
          {/* PAGE INTRO */}
          <div className="mb-7">
            <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#aaa2ff]">
              Account centre
            </span>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Account Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Manage your profile, security and workspace preferences from one
              place.
            </p>
          </div>

          {/* ACCOUNT SUMMARY */}
          <section className="mb-5 rounded-[24px] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-[#7869ff]/30 bg-[#e9e7ff] text-xl font-black text-[#5146ca]">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">
                  Signed-in account
                </p>

                <h2 className="mt-1 truncate text-xl font-bold">
                  {user?.name || "CMT User"}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Mail size={13} />
                    {user?.email || "No email available"}
                  </span>

                  <span className="text-white/20">•</span>

                  <span>{roleLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#71d9a6]/15 bg-[#71d9a6]/5 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#71d9a6]" />
                <span className="text-[10px] font-bold text-[#a7e8c5]">
                  Account connected
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* PROFILE */}
            <section className="rounded-[24px] border border-white/10 bg-white p-6 text-[#0d1b3d] shadow-2xl sm:p-7">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#6655f6]">
                  <UserRound size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Profile information
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#7b869b]">
                    Update the name connected to your account.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="grid gap-2 text-xs font-bold">
                  Full name

                  <div className="flex items-center gap-3 rounded-xl border border-[#dfe4ed] px-3 transition focus-within:border-[#6655f6] focus-within:ring-2 focus-within:ring-[#6655f6]/10">
                    <UserRound
                      size={16}
                      className="shrink-0 text-[#7c87a0]"
                    />

                    <input
                      type="text"
                      value={profileName}
                      onChange={(event) => {
                        setProfileName(event.target.value);
                        setProfileError("");
                        setProfileMessage("");
                      }}
                      className="h-12 w-full border-0 bg-transparent text-sm font-medium outline-none"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>
                </label>

                <div className="grid gap-2 text-xs font-bold">
                  Email address

                  <div className="flex items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f7f8fb] px-3">
                    <Mail
                      size={16}
                      className="shrink-0 text-[#9aa3b5]"
                    />

                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="h-12 w-full border-0 bg-transparent text-sm text-[#7a859a] outline-none"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold leading-5 text-red-700">
                    {profileError}
                  </div>
                )}

                {profileMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700">
                    <Check size={14} />
                    {profileMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving || !profileName.trim()}
                  className="rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-[#6655f6]/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileSaving ? "Saving profile..." : "Save profile"}
                </button>
              </div>
            </section>

            {/* SECURITY */}
            <section className="rounded-[24px] border border-white/10 bg-white p-6 text-[#0d1b3d] shadow-2xl sm:p-7">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef7ff] text-[#2563eb]">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Security
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#7b869b]">
                    Keep your CMT account secure with a strong password.
                  </p>
                </div>
              </div>

              <form
                onSubmit={changePassword}
                className="mt-6 grid gap-4"
              >
                <PasswordField
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrent}
                  setVisible={setShowCurrent}
                />

                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNew}
                  setVisible={setShowNew}
                />

                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirm}
                  setVisible={setShowConfirm}
                />

                <p className="text-[9px] font-medium text-[#9aa3b5]">
                  Password must contain at least 8 characters.
                </p>

                {passwordError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold leading-5 text-red-700">
                    {passwordError}
                  </div>
                )}

                {passwordMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700">
                    <Check size={14} />
                    {passwordMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0d1b3d] px-5 py-3 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#162752] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound size={15} />

                  {passwordSaving
                    ? "Updating password..."
                    : "Update password"}
                </button>
              </form>
            </section>

            {/* PREFERENCES */}
            <section className="rounded-[24px] border border-white/10 bg-white p-6 text-[#0d1b3d] shadow-2xl sm:p-7 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff6e8] text-[#d97706]">
                  <Palette size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Preferences
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#7b869b]">
                    Customize how the CMT workspace behaves on this device.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <PreferenceRow
                  icon={<Bell size={17} />}
                  title="Notifications"
                  description="Allow workspace notifications and reminders."
                  enabled={notifications}
                  onToggle={() =>
                    updateNotifications(!notifications)
                  }
                />

                <PreferenceRow
                  icon={dark ? <Moon size={17} /> : <Sun size={17} />}
                  title="Appearance"
                  description={
                    dark
                      ? "Dark workspace appearance is active."
                      : "Light workspace appearance is active."
                  }
                  enabled={dark}
                  onToggle={toggleTheme}
                  label={dark ? "Dark" : "Light"}
                />
              </div>
            </section>

            {/* ACCOUNT STATUS */}
            <section className="rounded-[24px] border border-white/10 bg-white/[.06] p-6 backdrop-blur-xl sm:p-7 lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#aaa2ff]">
                  <LockKeyhole size={19} />
                </div>

                <div className="flex-1">
                  <h2 className="text-sm font-bold">
                    Account security status
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Your CMT session is connected to your registered account.
                    Profile and password changes are sent to the backend API.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-[#71d9a6]/15 bg-[#71d9a6]/5 px-3 py-2">
                  <Check size={13} className="text-[#71d9a6]" />

                  <span className="text-[10px] font-bold text-[#a7e8c5]">
                    Secure session
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="text-xs font-bold text-white/45 transition hover:text-white"
            >
              ← Return to dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  setVisible,
}) {
  return (
    <label className="grid gap-2 text-xs font-bold">
      {label}

      <div className="flex items-center gap-3 rounded-xl border border-[#dfe4ed] px-3 transition focus-within:border-[#6655f6] focus-within:ring-2 focus-within:ring-[#6655f6]/10">
        <LockKeyhole
          size={16}
          className="shrink-0 text-[#7c87a0]"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full border-0 bg-transparent text-sm font-medium outline-none"
          placeholder="Enter password"
          autoComplete="current-password"
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#8a95a9] transition hover:bg-[#f1f3f7] hover:text-[#6655f6]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  label,
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#e7eaf0] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5f3ff] text-[#6655f6]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold">{title}</h3>

        <p className="mt-1 text-[10px] leading-5 text-[#8a95a9]">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-[#6655f6]" : "bg-[#d9dee8]"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>

      {label && (
        <span className="hidden min-w-10 text-right text-[9px] font-bold text-[#7c87a0] sm:block">
          {label}
        </span>
      )}
    </div>
  );
}
>>>>>>> origin/main
