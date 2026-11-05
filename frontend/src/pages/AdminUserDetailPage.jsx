import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Card, CardHeader, StateBlock, formatDateTime } from "../components/AdminUI";
import { usersApi } from "../api/usersApi";
import { auditLogsApi } from "../api/auditLogsApi";

const labelClass = "block text-[9px] font-extrabold uppercase tracking-[.1em] text-[#7d879a]";
const inputClass = "mt-2 w-full rounded-xl border border-[#dfe4ee] bg-white px-3.5 py-3 text-[13px] text-[#1c2a4a] outline-none transition focus:border-[#6655f6] focus:ring-4 focus:ring-[#6655f6]/10";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null), [logs, setLogs] = useState([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [saving, setSaving] = useState(false), [resetting, setResetting] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ password: "", password_confirmation: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [userResponse, auditResponse] = await Promise.all([usersApi.getById(id), auditLogsApi.getAll({ user_id: id, per_page: 20 })]);
      const loaded = userResponse.data?.data ?? userResponse.data;
      setUser(loaded); setProfile({ name: loaded?.name ?? "", email: loaded?.email ?? "" });
      const auditData = auditResponse.data?.data ?? auditResponse.data ?? [];
      setLogs(Array.isArray(auditData) ? auditData : auditData.data ?? []);
    } catch (e) { setError(e?.response?.data?.message ?? e.message ?? "Could not load this account."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);
  const messageFor = (e, fallback) => {
    const errors = e?.response?.data?.errors;
    return errors ? Object.values(errors).flat().join(" ") : e?.response?.data?.message ?? fallback;
  };
  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { await usersApi.update(id, profile); setNotice("User details updated and recorded in the audit trail."); await load(); }
    catch (requestError) { setError(messageFor(requestError, "Could not update the account.")); }
    finally { setSaving(false); }
  };
  const resetPassword = async (e) => {
    e.preventDefault(); setResetting(true); setError(""); setNotice("");
    try { const response = await usersApi.resetPassword(id, passwords); setPasswords({ password: "", password_confirmation: "" }); setNotice(response.data?.message ?? "Password reset. Existing sessions were signed out."); await load(); }
    catch (requestError) { setError(messageFor(requestError, "Could not reset the password.")); }
    finally { setResetting(false); }
  };

  return <AdminLayout subtitle="People" title={user?.name ?? "Manage user"} action={<button onClick={() => navigate("/users")} className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-2.5 text-[11px] font-extrabold text-white"><ArrowLeft size={14}/> Back to users</button>}>
    {loading && <Card><StateBlock kind="loading" message="Loading user account…" /></Card>}
    {!loading && error && !user && <Card><StateBlock kind="error" message={error} onRetry={load} /></Card>}
    {user && <div className="space-y-5">
      {error && <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-[12px] font-semibold text-[#b42318]">{error}</div>}
      {notice && <div className="rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-4 py-3 text-[12px] font-semibold text-[#18794e]">{notice}</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader eyebrow="Account" title="Edit user details" /><form onSubmit={saveProfile} className="space-y-4"><label className={labelClass}>Full name<input required minLength="2" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass}/></label><label className={labelClass}>Email address<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass}/></label><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#6655f6] px-4 py-3 text-[11px] font-extrabold text-white disabled:opacity-60"><Save size={14}/>{saving ? "Saving…" : "Save changes"}</button></form></Card>
        <Card><CardHeader eyebrow="Security" title="Reset password" /><form onSubmit={resetPassword} className="space-y-4"><p className="text-[11px] leading-5 text-[#748097]">Set a temporary password. Existing API sessions will be revoked. Passwords are never stored in the audit trail.</p><label className={labelClass}>New password<input required minLength="8" type="password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} className={inputClass}/></label><label className={labelClass}>Confirm password<input required minLength="8" type="password" value={passwords.password_confirmation} onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })} className={inputClass}/></label><button disabled={resetting} className="inline-flex items-center gap-2 rounded-xl bg-[#07132f] px-4 py-3 text-[11px] font-extrabold text-white disabled:opacity-60"><KeyRound size={14}/>{resetting ? "Resetting…" : "Reset password"}</button></form></Card>
      </div>
      <Card><CardHeader eyebrow="Audit trail" title="Recent account changes" />{logs.length === 0 ? <p className="text-[12px] text-[#748097]">No tracked changes yet. New admin updates and password resets will appear here.</p> : <div className="divide-y divide-[#edf0f5]">{logs.map((log) => <div key={log.id} className="flex flex-col gap-1 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-[#1c2a4a]">{String(log.action ?? "change").replaceAll("_", " ")}</strong><span className="ml-2 text-[#748097]">by {log.actor?.name ?? "System"}</span></div><span className="text-[#8e98aa]">{formatDateTime(log.created_at)}</span></div>)}</div>}</Card>
    </div>}
  </AdminLayout>;
}
