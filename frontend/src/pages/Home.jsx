import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "", country: "" });
  const [now, setNow] = useState(() => Date.now());

  const [allConferences, setAllConferences] = useState([]);
  const [totalConferences, setTotalConferences] = useState(0);

  const fetchConferences = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await conferencesApi.getAll({ per_page: 100 });
      const items = unwrapList(response).map(normaliseConference);
      setAllConferences(items);
      const total = Number(response?.meta?.total ?? response?.data?.meta?.total ?? items.length);
      setTotalConferences(Number.isFinite(total) ? total : items.length);
    } catch (err) {
      setError(err?.message || "We couldn't load conferences. Please try again.");
      setAllConferences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConferences();
  }, [fetchConferences]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const upcomingList = useMemo(() => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    return allConferences
      .filter((conference) => {
        const end = endOfEvent(conference);
        return !end || end >= dayStart;
      })
      .sort((a, b) => {
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

        <section className="bg-[#f7f9fc] px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading eyebrow="A simpler journey" title="From discovery to impact." description="Discover, organise and revisit conference opportunities without losing track of what matters." />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: <Compass size={22}/>, no: "01", title: "Discover", description: "Search research fields, places and upcoming conferences." },
                { icon: <CalendarDays size={22}/>, no: "02", title: "Plan", description: "Export conference dates straight to your calendar." },
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

        <section className="bg-white px-5 pb-24 pt-5">
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#07132f,#15165a)] px-8 py-12 text-white sm:px-12 lg:flex-row lg:items-center">
            <div className="pointer-events-none absolute -right-16 -top-36 h-80 w-80 rounded-full border-[55px] border-[#6655f6]/20" />
            <div className="relative z-10"><span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#b9b3ff]">Your next opportunity starts here</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-4xl">Great ideas deserve a great stage.</h2><p className="mt-3 text-sm text-white/65">Find a conference worth attending, sharing or presenting at.</p></div>
            <button type="button" onClick={() => navigate("/conferences")} className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#6655f6] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#7968ff]">Explore conferences <ArrowRight size={17}/></button>
          </div>
        </section>
      </main>

      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><img className="h-9 w-9 object-contain" src="/cmt-mark.png" alt="CMT logo" /><div><strong className="block text-xl font-extrabold tracking-[-.04em] text-white">CMT</strong><span className="text-[10px]">Conference Management Tool</span></div></div>
          <p className="text-xs">© {new Date().getFullYear()} CMT. Connecting research communities.</p>
        </div>
      </footer>
    </div>
  );
}
