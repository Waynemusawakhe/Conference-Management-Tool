import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen overflow-clip bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-24 text-white">
          <div className="relative z-[2] mx-auto w-[min(1200px,100%)]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]"><Sparkles size={15} /> About CMT</span>
            <h1 className="my-4 max-w-[720px] text-[clamp(34px,4.4vw,54px)] font-bold leading-tight tracking-[-.05em]">One platform for the whole conference journey.</h1>
            <p className="max-w-[620px] text-[15px] leading-7 text-white/75">
              CMT replaces scattered conference work — emails, spreadsheets, chat
              threads and separate forms — with a single, role-based flow: submit,
              review, decide, schedule, register, communicate and report.
            </p>
          </div>
        </section>

        <section className="bg-white px-5 py-[88px]">
          <div className="mx-auto grid w-[min(1200px,100%)] grid-cols-[.92fr_1.08fr] items-center gap-[60px] max-[820px]:grid-cols-1">
            <div>
              <span className="mb-2 inline-block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">Why CMT exists</span>
              <h2 className="m-0 text-[clamp(30px,3.3vw,42px)] font-bold leading-tight tracking-[-.045em]">Conference admin, without the chaos.</h2>
              <p className="mt-5 max-w-[580px] text-[13px] leading-7 text-[#66728b]">
                Conference work gets difficult once information is spread across
                inboxes, spreadsheets, group chats and PDFs. Submissions get lost
                or duplicated, reviewer assignment is manual, and it becomes hard
                to say what's actually happening at any given moment.
              </p>
              <p className="mt-4 max-w-[580px] text-[13px] leading-7 text-[#66728b]">
                CMT is built to be the control room instead — one place where
                submissions, reviews, decisions, the programme and reporting all
                live together, with each role seeing exactly what they need to.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#43506a]"><ShieldCheck className="text-[#27b779]" size={17} /> One source of truth for every submission</div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#43506a]"><ShieldCheck className="text-[#27b779]" size={17} /> Clear, role-based workflow for every stakeholder</div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#43506a]"><ShieldCheck className="text-[#27b779]" size={17} /> Structured peer review with a visible audit trail</div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#43506a]"><ShieldCheck className="text-[#27b779]" size={17} /> Reporting built in from day one, not bolted on</div>
              </div>
            </div>

            <div className="rounded-[20px] bg-[#091634] p-6 text-white shadow-[0_24px_60px_rgba(7,19,47,.18)]">
              <div className="flex items-center gap-2 text-[11px] font-extrabold">
                <span className="h-2 w-2 rounded-full bg-[#32d08c] shadow-[0_0_14px_rgba(50,208,140,.7)]" /> WHAT CMT MANAGES
              </div>
              <div className="mt-[22px] grid gap-3">
                <div className="flex items-center gap-2.5 text-xs text-[#dfe4f4]"><ShieldCheck size={17} color="#8b7eff" /> Users, roles and permissions</div>
                <div className="flex items-center gap-2.5 text-xs text-[#dfe4f4]"><ShieldCheck size={17} color="#8b7eff" /> Abstracts, papers and reviews</div>
                <div className="flex items-center gap-2.5 text-xs text-[#dfe4f4]"><ShieldCheck size={17} color="#8b7eff" /> Decisions and sessions</div>
                <div className="flex items-center gap-2.5 text-xs text-[#dfe4f4]"><ShieldCheck size={17} color="#8b7eff" /> Registration records</div>
                <div className="flex items-center gap-2.5 text-xs text-[#dfe4f4]"><ShieldCheck size={17} color="#8b7eff" /> Communication logs and reports</div>
              </div>
              <div className="mt-[18px] rounded-[11px] bg-white/5 p-[13px_15px] text-[10px] leading-relaxed text-[#9ca9c2]">
                <span className="mb-1 block font-extrabold text-white">In one line</span>
                A Conference Management Tool covers the full lifecycle of an
                academic conference, from call-for-papers to the final programme
                and post-event reporting.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 pb-[88px]">
          <div className="mx-auto w-[min(1200px,100%)]">
            <div className="flex items-center justify-between gap-9 rounded-[22px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-10 text-white shadow-[0_25px_60px_rgba(20,28,80,.18)] max-[700px]:block">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]"><Sparkles size={15} /> Ready when you are</span>
                <h2 className="my-2 text-[clamp(26px,3vw,36px)] font-bold tracking-[-.04em]">See what's on offer right now.</h2>
                <p className="max-w-[650px] text-xs leading-7 text-white/65">Browse upcoming conferences, or reach out if you've got questions about how CMT works.</p>
              </div>
              <Link to="/conferences" className="inline-flex items-center gap-2 rounded-[11px] bg-white px-[18px] py-[11px] text-[13px] font-bold text-[#192354] no-underline">
                Explore conferences <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <LogoFallback />
            <p className="mt-1 text-[9px] text-white/45">Conference Management Tool</p>
          </div>
          <span>© {new Date().getFullYear()} CMT. Conference Management Tool.</span>
        </div>
      </footer>
    </div>
  );
}

function LogoFallback() {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <img className="h-[34px] w-[34px] object-contain" src="/cmt-mark.png" alt="CMT logo" />
      <div className="flex flex-col leading-[1.05]">
        <strong className="text-xl tracking-[-.04em]">CMT</strong>
        <span className="mt-1 whitespace-nowrap text-[9px] text-white/70">Conference Management Tool</span>
      </div>
    </div>
  );
}