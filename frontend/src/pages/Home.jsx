import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Globe2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import ConferenceCard from "../components/ConferenceCard";
import HeroVisual from "../components/HeroVisual";
import SectionHeading from "../components/SectionHeading";
import { conferencesApi } from "../api/conferencesApi";

const TOPICS = [
  "AI & Machine Learning",
  "Computer Science",
  "Engineering",
  "Medicine",
  "Education",
];
const LIVE_AUTOPLAY_MS = 20000; // 20 seconds

/* ---------- Helpers ---------- */
function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function toDate(value) {
  if (!value) return null;
  const valueString = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(valueString)
    ? new Date(`${valueString}T00:00:00`)
    : new Date(valueString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-ZA", options) : "Date to be announced";
}

function endOfEvent(conference) {
  const date = toDate(conference.rawEndDate || conference.rawStartDate);
  if (!date) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

function isLive(conference, now) {
  const start = toDate(conference.rawStartDate);
  const end = endOfEvent(conference);
  return Boolean(start && end && start.getTime() <= now && end.getTime() >= now);
}

function normaliseConference(conference) {
  return {
    ...conference,
    id: conference.id,
    code: conference.code || conference.acronym || "",
    name: conference.name || "Untitled conference",
    description: conference.description || "Explore this conference and its research opportunities.",
    category: conference.category || "General",
    topics: Array.isArray(conference.topics) ? conference.topics : [],
    format: conference.format || "",
    status: conference.submission_status || "",
    rawStartDate: conference.start_date || null,
    rawEndDate: conference.end_date || null,
    rawSubmissionDeadline: conference.submission_deadline || null,
    location: conference.venue_name || "Venue to be announced",
    city: conference.city || "",
    country: conference.country || "",
  };
}

/* ---------- Main Page Component ---------- */
export default function Home() {
  const navigate = useNavigate();
  const sequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allConferences, setAllConferences] = useState([]);
  const [totalConferences, setTotalConferences] = useState(0);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "", country: "" });
  const [now, setNow] = useState(() => Date.now());

  const fetchConferences = useCallback(async () => {
    const requestId = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const response = await conferencesApi.getAll({ per_page: 100 });
      if (requestId !== sequence.current) return;
      const items = unwrapList(response).map(normaliseConference);
      setAllConferences(items);
      const total = Number(response?.meta?.total ?? response?.data?.meta?.total ?? items.length);
      setTotalConferences(Number.isFinite(total) ? total : items.length);
    } catch (err) {
      if (requestId !== sequence.current) return;
      setError(err?.message || "We couldn't load conferences. Please try again.");
      setAllConferences([]);
    } finally {
      if (requestId === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConferences();
    return () => { sequence.current += 1; };
  }, [fetchConferences]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const liveList = useMemo(
    () => allConferences.filter((conference) => isLive(conference, now)),
    [allConferences, now]
  );

  const upcomingList = useMemo(() => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    return allConferences.filter((conference) => {
      if (isLive(conference, now)) return false;
      const end = endOfEvent(conference);
      return !end || end >= dayStart;
    }).sort((a, b) => {
      const ax = toDate(a.rawStartDate)?.getTime() ?? Infinity;
      const bx = toDate(b.rawStartDate)?.getTime() ?? Infinity;
      return ax - bx;
    });
  }, [allConferences, now]);

  const searchConferences = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.country) params.set("country", filters.country);
    navigate(`/conferences${params.toString() ? `?${params}` : ""}`);
  };

  const chooseTopic = (topic) =>
    navigate(`/conferences?search=${encodeURIComponent(topic)}`);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f9fc] text-[#0d1b3d]">
      <div id="top" />
      <Navbar />
      
      <main>
        {/* HERO — Second Doc UI */}
        <section className="relative min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.16),transparent_34%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] text-white">
          <div className="absolute inset-0 opacity-[.18] [background-image:radial-gradient(rgba(255,255,255,.14)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
          <div className="relative mx-auto grid min-h-[560px] w-[min(1200px,calc(100%-40px))] grid-cols-[1.02fr_.98fr] items-center gap-11 max-[820px]:block">
            <div className="relative z-[2] py-[60px] max-[820px]:pb-8">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]">
                <Sparkles size={15} /> Conference Management Tool
              </span>
              <h1 className="my-4 max-w-[690px] text-[clamp(42px,5.1vw,70px)] font-bold leading-[1.02] tracking-[-.055em]">
                Discover. Connect.
                <span className="block text-[#7968ff]">Advance Knowledge.</span>
              </h1>
              <p className="mb-7 max-w-[610px] text-base leading-7 text-white/75">
                Find conferences, connect with researchers and manage the
                journey from discovery to participation in one focused platform.
              </p>

              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={searchConferences}
                filters={filters}
                onFiltersChange={setFilters}
              />

              <div className="mt-[15px] flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                <span>Popular topics:</span>
                {TOPICS.map((topic) => (
                  <button
                    className="rounded-full border border-white/10 bg-white/[.08] px-2.5 py-1.5 text-[11px] text-white/80 transition hover:bg-white/[.14]"
                    key={topic}
                    onClick={() => chooseTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex">
                  <span className="grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">
                    AK
                  </span>
                  <span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">
                    LM
                  </span>
                  <span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">
                    TN
                  </span>
                  <span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">
                    +
                  </span>
                </div>
                <div>
                  <strong className="block text-[11px]">
                    Built for the research community
                  </strong>
                  <small className="mt-0.5 block text-[10px] text-white/50">
                    Discover opportunities that move your work forward.
                  </small>
                </div>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* STATS — Second Doc UI */}
        <section className="relative z-[5] -mt-[34px]">
          <div className="mx-auto grid w-[min(1200px,calc(100%-40px))] grid-cols-4 overflow-hidden rounded-[18px] border border-[#e8ebf2] bg-white shadow-[0_18px_55px_rgba(15,28,65,.1)] max-[820px]:grid-cols-2 max-[560px]:grid-cols-1">
            <StatCard
              icon={<CalendarDays size={22} />}
              value={loading ? "…" : `${totalConferences}+`}
              label="Conferences"
            />
            <StatCard
              icon={<Users size={22} />}
              value="25,000+"
              label="Researchers"
            />
            <StatCard
              icon={<FileText size={22} />}
              value="15,000+"
              label="Submissions"
            />
            <StatCard
              icon={<Globe2 size={22} />}
              value="120+"
              label="Countries"
            />
          </div>
        </section>

        {/* LIVE CONFERENCES SECTION (With Fallback) */}
        {!loading && !error && (
          <section className="bg-[#f7f9fc] px-5 pt-20" aria-label="Live conferences">
            <div className="mx-auto max-w-[1200px]">
              {liveList.length > 0 ? (
                <>
                  <SectionHeading 
                    eyebrow="Live right now" 
                    title="Happening at this moment." 
                    description="Stay close to the conversations taking place today." 
                  />
                  <LiveConferenceHero conferences={liveList} />
                </>
              ) : (
                <>
                  <SectionHeading 
                    eyebrow="Live right now" 
                    title="Happening at this moment." 
                    description="Stay close to the conversations taking place today." 
                  />
                  {/* Empty State */}
                  <div className="relative overflow-hidden rounded-[32px] border border-[#e5e8f0] bg-white p-12 text-center shadow-[0_20px_50px_rgba(15,28,65,0.04)] sm:p-20">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#efedff] blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#f7f9fc] blur-3xl" />
                    
                    <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f7f9fc] text-[#5c50ec] shadow-sm mb-6">
                        <CalendarDays size={28} />
                      </span>
                      <h3 className="text-2xl font-extrabold text-[#0d1b3d]">No live conferences right now</h3>
                      <p className="mt-3 text-sm leading-6 text-[#778198]">
                        There are no events currently taking place. Check out the upcoming conferences below to find your next opportunity.
                      </p>
                      <a 
                        href="#featured-conferences" 
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#efedff] px-6 py-3 text-sm font-extrabold text-[#5c50ec] transition hover:bg-[#e5e1ff]"
                      >
                        Browse upcoming events
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* UPCOMING CONFERENCES GRID — Animated View All Button */}
        <section className="bg-white px-5 py-24" id="featured-conferences">
          <div className="mx-auto w-[min(1200px,calc(100%-40px))]">
            <SectionHeading
              eyebrow="Featured conferences"
              title={query ? `Results for "${query}"` : "Upcoming conferences"}
              description="Explore relevant events and find the right opportunity for your next presentation, collaboration or research connection."
              action={
                <button
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#6655f6] to-[#7869ff] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(102,85,246,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(102,85,246,0.4)]"
                  onClick={() => navigate("/conferences")}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    View all conferences
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                </button>
              }
            />

            <div className="mt-10 grid grid-cols-3 gap-6 max-[820px]:grid-cols-2 max-[560px]:grid-cols-1">
              {loading ? (
                <p role="status" className="col-span-full">
                  Loading conferences...
                </p>
              ) : error ? (
                <div role="alert" className="col-span-full">
                  {error}{" "}
                  <button onClick={fetchConferences} className="font-bold text-[#6655f6] underline">
                    Retry
                  </button>
                </div>
              ) : upcomingList.length ? (
                upcomingList.slice(0, 6).map((conference) => (
                  <ConferenceCard key={conference.id} conference={conference} />
                ))
              ) : (
                <div className="col-span-full rounded-[18px] border border-dashed border-[#ccd3df] bg-[#fafbfe] p-[35px] text-center">
                  <h3 className="mb-1.5 font-bold">No upcoming conferences found</h3>
                  <p className="mb-[18px] text-xs text-[#66728b]">
                    Check back later or try resetting your search.
                  </p>
                  <button
                    className="rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white shadow-md hover:-translate-y-0.5"
                    onClick={() => {
                      setQuery("");
                      setFilters({ category: "", country: "" });
                      fetchConferences();
                    }}
                  >
                    Reset search
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* JOURNEY — First Doc UI */}
        <section className="bg-[#f7f9fc] px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading eyebrow="A simpler journey" title="From discovery to impact." description="Discover, organise and revisit conference opportunities without losing track of what matters." />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: <Compass size={22}/>, no: "01", title: "Discover", description: "Search research fields, places and upcoming conferences." },
                { icon: <CalendarPlus size={22}/>, no: "02", title: "Plan", description: "Export conference dates straight to your calendar." },
                { icon: <Users size={22}/>, no: "03", title: "Connect", description: "Build meaningful connections with researchers and organisers." },
                { icon: <CheckCircle2 size={22}/>, no: "04", title: "Advance", description: "Turn opportunities into presentations, collaborations and impact." },
              ].map((step) => (
                <article key={step.no} className="group relative overflow-hidden rounded-[22px] border border-[#e7e9f1] bg-white p-7 transition hover:-translate-y-1 hover:border-[#cbc6ff] hover:shadow-[0_18px_35px_rgba(15,28,65,.065)]">
                  <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">{step.icon}</span><span className="text-3xl font-extrabold text-[#e4e0ff]">{step.no}</span></div>
                  <h3 className="mt-8 text-lg font-extrabold tracking-[-.025em]">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-7 text-[#778198]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA — First Doc UI */}
        <section className="bg-white px-5 pb-24 pt-5">
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#07132f,#15165a)] px-8 py-12 text-white sm:px-12 lg:flex-row lg:items-center">
            <div className="pointer-events-none absolute -right-16 -top-36 h-80 w-80 rounded-full border-[55px] border-[#6655f6]/20" />
            <div className="relative z-10"><span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#b9b3ff]">Your next opportunity starts here</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-4xl">Great ideas deserve a great stage.</h2><p className="mt-3 text-sm text-white/65">Find a conference worth attending, sharing or presenting at.</p></div>
            <button type="button" onClick={() => navigate("/conferences")} className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#6655f6] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#7968ff]">Explore conferences <ArrowRight size={17}/></button>
          </div>
        </section>
      </main>

      {/* FOOTER — First Doc UI */}
      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><img className="h-9 w-9 object-contain" src="/cmt-mark.png" alt="CMT logo" /><div><strong className="block text-xl font-extrabold tracking-[-.04em] text-white">CMT</strong><span className="text-[10px]">Conference Management Tool</span></div></div>
          <p className="text-xs">© {new Date().getFullYear()} CMT. Connecting research communities.</p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Huge Live Card — Animated Buttons, Live Badge, 20s Auto-Advance   */
/* ------------------------------------------------------------------ */
function timeLeftUntil(conference, now) {
  const target = endOfEvent(conference)?.getTime();
  const diff = Math.max(0, (target || now) - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function LiveConferenceHero({ conferences }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(() => Date.now());
  const touchStart = useRef(null);
  const count = conferences.length;
  const conference = conferences[index] || conferences[0];

  useEffect(() => { setIndex((value) => Math.min(value, Math.max(0, count - 1))); }, [count]);
  
  useEffect(() => {
    const id = window.setInterval(() => setTime(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((value) => (value + 1) % count);
    }, LIVE_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, index]); // Re-runs on index change, resetting the 20s timer

  if (!conference) return null;
  const remaining = timeLeftUntil(conference, time);
  const goTo = (step) => setIndex((current) => (current + step + count) % count);

  return (
    <div 
      className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07132f] p-8 text-white shadow-[0_30px_80px_-20px_rgba(15,28,65,0.6)] sm:p-12 lg:p-16"
      onMouseEnter={() => setPaused(true)} 
      onMouseLeave={() => setPaused(false)} 
      onFocusCapture={() => setPaused(true)} 
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} 
      onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 50 && count > 1) goTo(delta < 0 ? 1 : -1); touchStart.current = null; }}
      role="region" 
      aria-roledescription="carousel" 
      aria-label="Live conferences"
    >
      {/* Background Decorators */}
      <div className="pointer-events-none absolute -right-32 -top-40 h-[500px] w-[500px] rounded-full bg-[#6655f6]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-[#15165a]/80 blur-[80px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />

      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        
        {/* LEFT: Content */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Animated LIVE Badge */}
            <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              </span>
              <span className="animate-pulse">Live now</span>
            </span>
            
            {conference.category && (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/70">
                {conference.category}
              </span>
            )}
          </div>

          <h3 className="max-w-[700px] text-[clamp(32px,4vw,58px)] font-black leading-[1.05] tracking-[-.04em] text-white">
            {conference.name}
          </h3>
          
          <p className="mt-6 line-clamp-3 max-w-[600px] text-[15px] leading-7 text-white/60">
            {conference.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-white/85">
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5">
              <CalendarDays size={16} className="text-[#b9b3ff]" />
              {formatDate(conference.rawStartDate)} – {formatDate(conference.rawEndDate || conference.rawStartDate)}
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5">
              <MapPin size={16} className="text-[#f59a43]" />
              {conference.city || conference.location}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {/* Animated View Live Button */}
            <button 
              type="button" 
              onClick={() => navigate(`/conferences/${encodeURIComponent(conference.id)}`)} 
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#6655f6] to-[#7968ff] px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(102,85,246,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(102,85,246,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                View live conference <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate("/conferences")} 
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Browse all
            </button>
          </div>
        </div>

        {/* RIGHT: Countdown */}
        <div className="flex flex-col items-center lg:items-end">
          <div className="w-full max-w-[380px] rounded-[28px] border border-white/10 bg-white/[.03] p-8 backdrop-blur-md">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[.25em] text-[#b9b3ff] mb-6">
              Conference ends in
            </p>
            
            <div className="flex justify-center divide-x divide-white/10 rounded-2xl border border-white/10 bg-[#0d1430]/50 shadow-inner overflow-hidden">
              <CountdownSegment value={remaining.days} label="Days" />
              <CountdownSegment value={remaining.hours} label="Hours" />
              <CountdownSegment value={remaining.minutes} label="Mins" />
              <CountdownSegment value={remaining.seconds} label="Secs" />
            </div>
            
            <p className="mt-6 text-center text-[10px] font-medium tracking-wide text-white/40">
              Based on published event dates
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      {count > 1 && (
        <div className="relative z-10 mt-12 flex items-center justify-between border-t border-white/10 pt-6">
          <span className="text-[11px] font-semibold text-white/50 tracking-wide">
            {index + 1} of {count} live conferences
          </span>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => goTo(-1)} 
              aria-label="Previous live conference" 
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <ChevronLeft size={20}/>
            </button>
            <button 
              type="button" 
              onClick={() => goTo(1)} 
              aria-label="Next live conference" 
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownSegment({ value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center py-4">
      <span className="font-mono text-3xl font-black text-white sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/40">
        {label}
      </span>
    </div>
  );
}