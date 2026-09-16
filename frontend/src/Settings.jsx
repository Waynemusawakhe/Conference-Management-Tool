import { useState } from "react";
import { ArrowLeft, Bell, Check, LockKeyhole, Moon, Palette, Shield, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";

export default function Settings() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(localStorage.getItem("cmt_notifications") !== "off");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const saveNotifications = (value) => { setNotifications(value); localStorage.setItem("cmt_notifications", value ? "on" : "off"); };
  const changePassword = async (e) => {
    e.preventDefault(); setError(""); setMessage("");
    if (!current || !next || !confirm) return setError("Complete all password fields.");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New password and confirmation do not match.");
    try { await authApi.changePassword({ current_password: current, password: next, password_confirmation: confirm }); setCurrent(""); setNext(""); setConfirm(""); setMessage("Password updated successfully."); }
    catch (err) { setError(err?.message || "Unable to update password."); }
  };
  return <div className="min-h-screen bg-[#07132f] text-white">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/90 backdrop-blur-xl"><div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4"><button onClick={()=>navigate(role==="organiser"?"/organiser-dashboard":"/author-dashboard")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"><ArrowLeft size={17}/></button><Logo/><div className="ml-auto text-right"><p className="m-0 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">CMT Settings</p><p className="m-0 text-[10px] text-white/50">Preferences & security</p></div></div></header>
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden px-4 py-10 sm:px-6"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(103,87,245,.22),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(27,94,255,.15),transparent_30%),linear-gradient(135deg,#07132f,#0b1740_55%,#17165b)]"/><div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(rgba(255,255,255,.4)_0.7px,transparent 0.7px)] [background-size:22px_22px]"/>
      <div className="relative mx-auto w-[min(900px,100%)] space-y-5">
        <section className="rounded-[24px] border border-white/10 bg-white/[.06] p-7 backdrop-blur-xl sm:p-9"><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">Workspace controls</span><h1 className="mt-2 text-3xl font-bold">Settings</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-white/55">Control how CMT behaves for you. These controls are intentionally separate from your personal profile.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><button onClick={()=>saveNotifications(!notifications)} className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-left hover:bg-white/10"><Bell size={18} className="text-[#a49cff]"/><strong className="mt-4 block text-sm">Notifications</strong><span className="mt-1 block text-[10px] text-white/45">{notifications?"Enabled":"Muted"}</span></button><button onClick={toggleTheme} className="rounded-2xl border border-white/10 bg-white/[.06] p-5 text-left hover:bg-white/10">{dark?<Moon size={18} className="text-[#a49cff]"/>:<Sun size={18} className="text-[#a49cff]"/>}<strong className="mt-4 block text-sm">Appearance</strong><span className="mt-1 block text-[10px] text-white/45">{dark?"Dark mode":"Light mode"}</span></button><div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><Palette size={18} className="text-[#a49cff]"/><strong className="mt-4 block text-sm">Workspace</strong><span className="mt-1 block text-[10px] text-white/45">CMT professional theme</span></div></div></section>
        <section className="rounded-[24px] bg-white p-7 text-[#0d1b3d] shadow-2xl sm:p-9"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efedff] text-[#5b4fe3]"><LockKeyhole size={18}/></span><div><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">Security</span><h2 className="mt-1 text-xl font-bold">Change password</h2><p className="mt-1 text-xs text-[#7b869b]">Update your login credentials without changing your profile.</p></div></div><form onSubmit={changePassword} className="mt-6 grid gap-4 sm:grid-cols-3"><input type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Current password" className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none"/><input type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="New password" className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none"/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" className="h-12 rounded-xl border border-[#dfe4ed] px-3 text-xs outline-none"/><div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3">{error&&<span className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">{error}</span>}{message&&<span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700"><Check size={13}/>{message}</span>}<button className="ml-auto rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-xs font-extrabold text-white">Update password</button></div></form></section>
        <section className="rounded-[24px] border border-red-200/20 bg-red-500/10 p-6"><div className="flex gap-3"><Shield size={18} className="mt-0.5 text-red-300"/><div><h2 className="m-0 text-sm font-bold">Account safety</h2><p className="mt-1 text-[10px] leading-5 text-white/50">For safety, destructive account actions are not exposed from this workspace. Contact an administrator if an account must be deactivated.</p></div></div></section>
      </div>
    </main>
  </div>;
}

