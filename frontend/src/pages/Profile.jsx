import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Check, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

const KEY = "cmt_profile_name";

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser, role } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const initials = useMemo(() => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "C", [name]);

  useEffect(() => {
    setName(localStorage.getItem(KEY) || user?.name || "");
  }, [user?.name]);

  const [error, setError] = useState("");
  const save = async () => {
    setError("");
    try {
      await authApi.updateProfile({ name: name.trim() });
      localStorage.setItem(KEY, name.trim());
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) { setError(err?.message || "Unable to save profile."); }
  };

  return <div className="min-h-screen bg-[#07132f] text-white">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07132f]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4">
        <button onClick={() => navigate(role === "organiser" ? "/organiser-dashboard" : "/author-dashboard")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5"><ArrowLeft size={17}/></button>
        <Logo/><div className="ml-auto text-right"><p className="m-0 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">CMT Profile</p><p className="m-0 text-[10px] text-white/50">Personal information</p></div>
      </div>
    </header>
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(103,87,245,.22),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(27,94,255,.15),transparent_32%),linear-gradient(135deg,#07132f,#0b1740_55%,#17165b)]"/>
      <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(rgba(255,255,255,.4)_0.7px,transparent_0.7px)] [background-size:22px_22px]"/>
      <div className="relative mx-auto grid w-[min(900px,100%)] gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <section className="rounded-[24px] border border-white/10 bg-white/[.06] p-7 backdrop-blur-xl sm:p-9">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-[#7869ff]/30 bg-[#e9e7ff] text-2xl font-black text-[#5146ca]">{initials}</div>
          <h1 className="mt-5 text-center text-2xl font-bold">{name || "CMT User"}</h1>
          <p className="mt-1 text-center text-xs text-white/50">{role || "User"}</p>
          <div className="mt-7 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center gap-3"><Mail size={16} className="text-[#9b92ff]"/><div><span className="block text-[9px] uppercase tracking-wider text-white/40">Email</span><strong className="text-xs">{user?.email || "—"}</strong></div></div></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#71d9a6]"/><div><span className="block text-[9px] uppercase tracking-wider text-white/40">Role</span><strong className="text-xs capitalize">{role || "—"}</strong></div></div></div>
          </div>
        </section>
        <section className="rounded-[24px] border border-white/10 bg-white p-7 text-[#0d1b3d] shadow-2xl sm:p-9">
          <div><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#6655f6]">Profile information</span><h2 className="mt-2 text-2xl font-bold">Keep your profile up to date</h2><p className="mt-2 text-xs leading-6 text-[#7b869b]">Your profile is separate from application preferences and security settings.</p></div>
          <div className="mt-7 grid gap-5">
            <label className="grid gap-2 text-xs font-bold">Full name<div className="flex items-center gap-3 rounded-xl border border-[#dfe4ed] px-3"><UserRound size={16} className="text-[#7c87a0]"/><input value={name} onChange={e=>setName(e.target.value)} className="h-12 w-full border-0 outline-none" placeholder="Your full name"/></div></label>
            <label className="grid gap-2 text-xs font-bold">Email address<div className="flex items-center gap-3 rounded-xl border border-[#e7eaf0] bg-[#f7f8fb] px-3"><Mail size={16} className="text-[#9aa3b5]"/><input value={user?.email || ""} disabled className="h-12 w-full border-0 bg-transparent text-[#7a859a] outline-none"/></div></label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f5ff] p-4 text-xs text-[#6257c9]"><span className="flex items-center gap-2"><Camera size={15}/> Profile details are saved to your CMT account.</span>{saved && <span className="flex items-center gap-1 font-bold"><Check size={14}/> Saved</span>}</div>
            <button onClick={save} disabled={!name.trim()} className="w-full rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50">Save profile</button>
          <div>{error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">{error}</p>}</div>
          </div>
        </section>
      </div>
    </main>
  </div>;
}
