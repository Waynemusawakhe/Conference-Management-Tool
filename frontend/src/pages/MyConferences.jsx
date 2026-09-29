import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, FileText, MapPin, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { conferencesApi } from "../api/conferencesApi";
import { submissionsApi } from "../api/submissionsApi";
import { registrationsApi } from "../api/registrationsApi";

const unwrap = (r) => { if (Array.isArray(r)) return r; if (Array.isArray(r?.data)) return r.data; if (Array.isArray(r?.data?.data)) return r.data.data; return Array.isArray(r?.data?.items) ? r.data.items : []; };
const dateLabel = (v) => { if (!v) return "Date TBA"; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}); };

export default function MyConferences() {
  const navigate=useNavigate();
  const { user, role }=useAuth();
  const [conferences,setConferences]=useState([]);
  const [submissions,setSubmissions]=useState([]);
  const [registrations,setRegistrations]=useState([]);
  const [tab,setTab]=useState("attending");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const dashboard = role==="author"?"/author-dashboard":role==="reviewer"?"/reviewer-dashboard":role==="organiser"?"/organiser-dashboard":role==="admin"?"/admin-dashboard":"/my-conferences";

  const load=useCallback(async()=>{
    setLoading(true); setError("");
    try {
      const [c,s,r]=await Promise.all([
        conferencesApi.getAll({per_page:100}),
        submissionsApi.getAll({per_page:100}),
        registrationsApi.getAll(),
      ]);
      setConferences(unwrap(c)); setSubmissions(unwrap(s)); setRegistrations(unwrap(r));
    } catch(e) { setError(e?.message || "Unable to load My Conferences."); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const attending=useMemo(()=>registrations.filter(r=>Number(r.user_id??r.user?.id??r.attendee_id)===Number(user?.id)&&r.status!=="cancelled").map(r=>conferences.find(c=>Number(c.id)===Number(r.conference_id??r.conference?.id))||r.conference).filter(Boolean),[registrations,conferences,user?.id]);
  const proposed=useMemo(()=>submissions.filter(s=>Number(s.author_id??s.author?.id??s.user_id)===Number(user?.id)),[submissions,user?.id]);
  const organising=useMemo(()=>conferences.filter(c=>Number(c.organiser_id??c.organiser?.id)===Number(user?.id)),[conferences,user?.id]);

  const tabs=[["attending","Attending",attending.length],["proposals","My Proposals",proposed.length],["organising","Organising",organising.length]];
  const current=tab==="attending"?attending:tab==="proposals"?proposed:organising;

  return <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
    <header className="border-b border-white/10 bg-[#07132f] text-white"><div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-28px))] items-center gap-4"><button onClick={()=>navigate(dashboard)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 hover:bg-white/10"><ArrowLeft size={16}/></button><Logo/><div className="ml-auto text-right"><p className="m-0 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#aaa2ff]">My Conferences</p><p className="m-0 text-[10px] text-white/50">Your CMT activity in one place</p></div></div></header>
    <main className="mx-auto w-[min(1100px,calc(100%-28px))] py-8">
      <section className="rounded-[24px] bg-[radial-gradient(circle_at_80%_20%,rgba(121,104,255,.22),transparent_28%),linear-gradient(135deg,#07132f,#17165b)] p-7 text-white sm:p-9"><span className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#b9b3ff]">Conference activity</span><h1 className="mt-2 text-3xl font-bold">Everything connected to your account.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">See conferences you attend, proposals you submitted, and conferences you organise from one workspace.</p></section>
      {error&&<div className="mt-5 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</div>}
      <section className="mt-6 rounded-[22px] border border-[#e4e8f0] bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-[#edf0f5] p-4">{tabs.map(([key,label,count])=><button key={key} onClick={()=>setTab(key)} className={`rounded-xl px-4 py-2.5 text-xs font-extrabold ${tab===key?"bg-[#efedff] text-[#5649dc]":"text-[#66728b] hover:bg-[#f6f7fa]"}`}>{label} <span className="ml-1 opacity-60">{count}</span></button>)}</div>
        {loading?<div className="p-12 text-center text-sm text-[#8993a6]">Loading your activity…</div>:<div className="divide-y divide-[#edf0f5]">
          {current.map((item)=><article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#efedff] text-[#5c50ec]">{tab==="proposals"?<FileText size={17}/>:tab==="organising"?<Users size={17}/>:<CalendarDays size={17}/>}</span><div><h3 className="m-0 text-sm font-bold">{tab==="proposals"?item.title:(item.name||item.conference?.name||`Conference #${item.id}`)}</h3><p className="m-0 mt-1 text-[10px] text-[#8993a6]">{tab==="proposals"?`${item.status||"pending"} · ${item.track||"General track"}`:`${dateLabel(item.start_date||item.conference?.start_date)} · ${[item.venue_name,item.city,item.country].filter(Boolean).join(", ")||"Location TBA"}`}</p></div></div>
            {tab==="proposals"?<button onClick={()=>navigate("/author-dashboard")} className="rounded-xl border border-[#dfe4ed] px-3 py-2 text-[10px] font-extrabold text-[#59657d]">Open proposals</button>:tab==="organising"?<button onClick={()=>navigate("/organiser-dashboard")} className="rounded-xl border border-[#dfe4ed] px-3 py-2 text-[10px] font-extrabold text-[#59657d]">Manage conference</button>:<span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700"><MapPin size={13}/> Attending</span>}
          </article>)}
          {!current.length&&<div className="p-12 text-center"><Plus size={22} className="mx-auto text-[#aab2c0]"/><h3 className="mt-3 text-sm font-bold">Nothing here yet</h3><p className="mt-1 text-xs text-[#8993a6]">Browse conferences to start building your CMT activity.</p><button onClick={()=>navigate("/conferences")} className="mt-4 rounded-xl bg-[#6655f6] px-4 py-2.5 text-xs font-extrabold text-white">Browse conferences</button></div>}
        </div>}
      </section>
    </main>
  </div>;
}
