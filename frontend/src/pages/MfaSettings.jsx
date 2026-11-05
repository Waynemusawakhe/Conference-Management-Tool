import { useState } from "react";
import { ArrowLeft, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

export default function MfaSettings() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const startSetup = async () => {
    setBusy(true); setError(""); setMessage("");
    try { setSetup((await authApi.setupMfa()).data); }
    catch (err) { setError(err.message || "Could not start MFA setup."); }
    finally { setBusy(false); }
  };
  const confirm = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await authApi.confirmMfa(code); setRecoveryCodes(result.data?.recovery_codes || []); setMessage("MFA is now enabled. Save the recovery codes below somewhere safe."); await refreshUser(); }
    catch (err) { setError(err.message || "That verification code is invalid."); }
    finally { setBusy(false); }
  };
  const disable = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await authApi.disableMfa({ current_password: password, code: disableCode }); setMessage("MFA has been disabled."); setSetup(null); setRecoveryCodes([]); setPassword(""); setDisableCode(""); await refreshUser(); }
    catch (err) { setError(err.message || "Could not disable MFA."); }
    finally { setBusy(false); }
  };
  const copy = async (text) => { await navigator.clipboard?.writeText(text); setMessage("Copied to clipboard."); };

  return <main className="min-h-screen bg-[#f7f9fc] p-5 text-[#0d1b3d] sm:p-8"><div className="mx-auto max-w-2xl"><button onClick={() => navigate("/account-settings")} className="inline-flex items-center gap-2 text-xs font-bold text-[#5c50ec]"><ArrowLeft size={15}/> Account settings</button><section className="mt-5 rounded-2xl border border-[#e4e8f0] bg-white p-6 shadow-sm"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efedff] text-[#5c50ec]"><ShieldCheck size={20}/></span><div><h1 className="m-0 text-xl font-bold">Multi-factor authentication</h1><p className="mt-1 text-sm text-[#66728b]">Protect your CMT account with an authenticator app.</p></div></div>{error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{!user?.mfa_enabled && !setup && <button disabled={busy} onClick={startSetup} className="mt-6 rounded-xl bg-[#6655f6] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">Set up authenticator app</button>}{!user?.mfa_enabled && setup && <form onSubmit={confirm} className="mt-6 grid gap-4"><p className="text-sm text-[#43506a]">Add this secret to Google Authenticator, Microsoft Authenticator or Authy:</p><div className="flex gap-2"><code className="flex-1 break-all rounded-lg bg-[#f4f5fb] p-3 text-sm">{setup.secret}</code><button type="button" onClick={() => copy(setup.secret)} className="rounded-lg border px-3"><Copy size={16}/></button></div><p className="text-xs text-[#788398]">If your app supports setup links, use: <code className="break-all">{setup.otpauth_uri}</code></p><input required value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter 6-digit verification code" className="min-h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm"/><button disabled={busy} className="rounded-xl bg-[#6655f6] px-4 py-3 text-sm font-bold text-white">Verify and enable</button></form>}{recoveryCodes.length > 0 && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="m-0 text-sm font-bold">Recovery codes — save these now</h2><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">{recoveryCodes.map((item) => <code key={item}>{item}</code>)}</div></div>}{user?.mfa_enabled && <form onSubmit={disable} className="mt-7 grid gap-3 border-t pt-6"><h2 className="m-0 text-base font-bold">Disable MFA</h2><input required type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Current password" className="min-h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm"/><input required value={disableCode} onChange={(e)=>setDisableCode(e.target.value)} inputMode="numeric" placeholder="Current authenticator code" className="min-h-11 rounded-xl border border-[#dfe4ed] px-3 text-sm"/><button disabled={busy} className="w-fit rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Disable MFA</button></form>}</section></div></main>;
}
