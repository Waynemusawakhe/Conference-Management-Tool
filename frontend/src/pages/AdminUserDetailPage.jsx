import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CirclePause,
  Mail,
  Play,
  Save,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardHeader,
  StateBlock,
  formatDateTime,
} from "../components/AdminUI";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/usersApi";
import { auditLogsApi } from "../api/auditLogsApi";

const labelClass =
  "block text-[9px] font-extrabold uppercase tracking-[.1em] text-[#7d879a]";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe4ee] bg-white px-3.5 py-3 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#6655f6] focus:ring-4 focus:ring-[#6655f6]/10";

const roles = ["admin", "organiser", "reviewer", "author", "attendee"];

function prettify(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [managing, setManaging] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [role, setRole] = useState("");
  const [accountStatus, setAccountStatus] = useState("active");
  const [statusReason, setStatusReason] = useState("");

  const isSelf =
    user && currentUser && String(user.id) === String(currentUser.id);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [userResponse, auditResponse] = await Promise.all([
        usersApi.getById(id),
        auditLogsApi.getAll({
          user_id: id,
          per_page: 20,
        }),
      ]);

      const loaded = userResponse.data?.data ?? userResponse.data;
      const auditData = auditResponse.data?.data ?? auditResponse.data ?? [];

      setUser(loaded);
      setProfile({
        name: loaded?.name ?? "",
        email: loaded?.email ?? "",
      });
      setRole(loaded?.role ?? "");
      setAccountStatus(loaded?.account_status ?? "active");
      setStatusReason(loaded?.account_status_reason ?? "");
      setLogs(Array.isArray(auditData) ? auditData : (auditData.data ?? []));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError.message ??
          "Could not load this account.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const messageFor = (requestError, fallback) => {
    const errors = requestError?.response?.data?.errors;

    if (errors) {
      return Object.values(errors).flat().join(" ");
    }

    return requestError?.response?.data?.message ?? fallback;
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await usersApi.update(id, profile);
      setNotice("User details updated and recorded in the audit trail.");
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "Could not update the account."));
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    setResetting(true);
    setError("");
    setNotice("");

    try {
      const response = await usersApi.sendPasswordResetEmail(id);

      setNotice(
        response.data?.message ??
          "A secure password-reset link was sent to the user.",
      );
      await load();
    } catch (requestError) {
      setError(
        messageFor(requestError, "Could not send the password-reset email."),
      );
    } finally {
      setResetting(false);
    }
  };

  const changeRole = async () => {
    setManaging(true);
    setError("");
    setNotice("");

    try {
      const response = await usersApi.updateRole(id, role);

      setNotice(response.data?.message ?? "User role updated successfully.");
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "Could not update the user role."));
    } finally {
      setManaging(false);
    }
  };

  const changeAccountStatus = async (nextStatus) => {
    setManaging(true);
    setError("");
    setNotice("");

    try {
      const response = await usersApi.updateAccountStatus(
        id,
        nextStatus,
        statusReason,
      );

      setNotice(
        response.data?.message ?? `Account ${nextStatus} successfully.`,
      );
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "Could not update account status."));
    } finally {
      setManaging(false);
    }
  };

  const archiveAccount = async () => {
    const confirmed = window.confirm(
      `Archive ${user.name}'s account? They will no longer be able to sign in. This can only be restored by a database administrator.`,
    );

    if (!confirmed) {
      return;
    }

    setManaging(true);
    setError("");
    setNotice("");

    try {
      await usersApi.archive(id);

      setNotice("Account archived successfully.");
      window.setTimeout(() => {
        navigate("/users");
      }, 900);
    } catch (requestError) {
      setError(messageFor(requestError, "Could not archive this account."));
    } finally {
      setManaging(false);
    }
  };

  return (
    <AdminLayout
      subtitle="People"
      title={user?.name ?? "Manage user"}
      action={
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white"
        >
          <ArrowLeft size={14} />
          Back to users
        </button>
      }
    >
      {loading && (
        <Card>
          <StateBlock kind="loading" message="Loading user account…" />
        </Card>
      )}

      {!loading && error && !user && (
        <Card>
          <StateBlock kind="error" message={error} onRetry={load} />
        </Card>
      )}

      {user && (
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-[12px] font-semibold text-[#b42318]">
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-[12px] font-semibold text-[#18794e]">
              {notice}
            </div>
          )}

          {isSelf && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-900">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
              <p>
                <strong>Protected administrator account.</strong> Use My
                Settings for your own profile, password and MFA. Administrators
                cannot change their own role, status, password-reset state or
                archive their own account from the User Directory.
              </p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader eyebrow="Account" title="Edit user details" />

              <form onSubmit={saveProfile} className="space-y-4">
                <label className={labelClass}>
                  Full name
                  <input
                    required
                    minLength="2"
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        name: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Email address
                  <input
                    required
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        email: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <button
                  disabled={saving || isSelf}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6655f6] px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
            </Card>

            <Card>
              <CardHeader
                eyebrow="Security"
                title="Send password-reset email"
              />

              <div className="space-y-4">
                <p className="text-[11px] leading-5 text-[#748097]">
                  The administrator never sees or sets this password. A one-time
                  reset link is sent to <strong>{user.email}</strong>. The user
                  chooses a new password and then completes MFA normally at
                  login.
                </p>

                <button
                  type="button"
                  onClick={sendPasswordResetEmail}
                  disabled={resetting || isSelf}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail size={14} />
                  {resetting ? "Sending…" : "Send reset email"}
                </button>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader eyebrow="Permissions" title="Change account role" />

              <p className="mb-4 text-[11px] leading-5 text-[#748097]">
                Role changes are recorded in the audit trail. CMT always
                requires at least one active administrator account.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  disabled={isSelf || managing}
                  className="min-w-0 flex-1 rounded-xl border border-[#dfe4ee] bg-white px-3.5 py-3 text-[13px] text-[#1c2a4a] outline-none focus:border-[#6655f6] disabled:opacity-60"
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {prettify(item)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={changeRole}
                  disabled={isSelf || managing || role === user.role}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#342b87] px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserCog size={14} />
                  Update role
                </button>
              </div>
            </Card>

            <Card>
              <CardHeader eyebrow="Access" title="Pause, block or reactivate" />

              <p className="mb-4 text-[11px] leading-5 text-[#748097]">
                Current status:{" "}
                <strong>{prettify(user.account_status ?? "active")}</strong>.
                Pausing or blocking immediately revokes active sessions.
              </p>

              <label className={labelClass}>
                Reason <span className="normal-case">(optional)</span>
                <textarea
                  rows="2"
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  disabled={isSelf || managing}
                  placeholder="Reason for this account action"
                  className={`${inputClass} resize-y`}
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => changeAccountStatus("active")}
                  disabled={
                    isSelf || managing || user.account_status === "active"
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  <Play size={14} />
                  Activate
                </button>

                <button
                  type="button"
                  onClick={() => changeAccountStatus("paused")}
                  disabled={
                    isSelf || managing || user.account_status === "paused"
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  <CirclePause size={14} />
                  Pause
                </button>

                <button
                  type="button"
                  onClick={() => changeAccountStatus("blocked")}
                  disabled={
                    isSelf || managing || user.account_status === "blocked"
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  <Ban size={14} />
                  Block
                </button>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader eyebrow="Danger zone" title="Archive account" />

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-[11px] leading-5 text-[#748097]">
                Archiving prevents future sign-in and keeps audit records.
                Accounts that own conferences cannot be archived until their
                conferences have been transferred or removed.
              </p>

              <button
                type="button"
                onClick={archiveAccount}
                disabled={isSelf || managing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={14} />
                Archive account
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Audit trail" title="Recent account changes" />

            {logs.length === 0 ? (
              <p className="text-[12px] text-[#748097]">
                No tracked changes yet. New admin updates, role changes, status
                changes and reset-link requests will appear here.
              </p>
            ) : (
              <div className="divide-y divide-[#edf0f5]">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <strong className="text-[#1c2a4a]">
                        {String(log.action ?? "change").replaceAll("_", " ")}
                      </strong>
                      <span className="ml-2 text-[#748097]">
                        by {log.actor?.name ?? "System"}
                      </span>
                    </div>

                    <span className="text-[#8e98aa]">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
