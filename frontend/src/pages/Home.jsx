import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import ConferenceCard from "../components/ConferenceCard";
import HeroVisual from "../components/HeroVisual";
import SectionHeading from "../components/SectionHeading";
import { getFeaturedConferences, searchConferences } from "../services/conferenceService";

const topics = ["AI & Machine Learning", "Computer Science", "Engineering", "Medicine", "Education"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [conferences, setConferences] = useState([]);
  const [filters, setFilters] = useState({ category: "", country: "" });

  useEffect(() => {
    getFeaturedConferences().then(setConferences);
  }, []);

  const handleSearch = async () => {
    setConferences(await searchConferences(query, filters));
    document.getElementById("featured-conferences")?.scrollIntoView({ behavior: "smooth" });
  };

  const chooseTopic = async (topic) => {
    setQuery(topic);
    setFilters({ category: "", country: "" });
    setConferences(await searchConferences(topic));
    document.getElementById("featured-conferences")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-clip bg-[#f7f9fc] text-[#0d1b3d]">
      <div id="top" />
      <Navbar />

      <main>
        <section className="relative min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.16),transparent_34%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] text-white">
          <div className="absolute inset-0 opacity-[.18] [background-image:radial-gradient(rgba(255,255,255,.14)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
          <div className="relative mx-auto grid min-h-[560px] w-[min(1200px,calc(100%-40px))] grid-cols-[1.02fr_.98fr] items-center gap-11 max-[820px]:block">
            <div className="relative z-[2] py-[60px] max-[820px]:pb-8">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#b9b3ff]"><Sparkles size={15} /> Conference Management Tool</span>
              <h1 className="my-4 max-w-[690px] text-[clamp(42px,5.1vw,70px)] font-bold leading-[1.02] tracking-[-.055em]">
                Discover. Connect.
                <span className="block text-[#7968ff]">Advance Knowledge.</span>
              </h1>
              <p className="mb-7 max-w-[610px] text-base leading-7 text-white/75">
                Find conferences, connect with researchers and manage the journey
                from discovery to participation in one focused platform.
              </p>

              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                filters={filters}
                onFiltersChange={setFilters}
              />

              <div className="mt-[15px] flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                <span>Popular topics:</span>
                {topics.map((topic) => (
                  <button className="rounded-full border border-white/10 bg-white/[.08] px-2.5 py-1.5 text-[11px] text-white/80 transition hover:bg-white/[.14]" key={topic} onClick={() => chooseTopic(topic)}>
                    {topic}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex">
                  <span className="grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">AK</span><span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">LM</span><span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">TN</span><span className="-ml-1.5 grid h-[29px] w-[29px] place-items-center rounded-full border-2 border-[#0b1740] bg-[#e5e9ff] text-[8px] font-extrabold text-[#253060]">+</span>
                </div>
                <div>
                  <strong className="block text-[11px]">Built for the research community</strong>
                  <small className="mt-0.5 block text-[10px] text-white/50">Discover opportunities that move your work forward.</small>
                </div>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section className="relative z-[5] -mt-[34px]">
          <div className="mx-auto grid w-[min(1200px,calc(100%-40px))] grid-cols-4 overflow-hidden rounded-[18px] border border-[#e8ebf2] bg-white shadow-[0_18px_55px_rgba(15,28,65,.1)] max-[820px]:grid-cols-2 max-[560px]:grid-cols-1">
            <StatCard icon={<CalendarDays size={22} />} value="1,250+" label="Conferences" />
            <StatCard icon={<Users size={22} />} value="25,000+" label="Researchers" />
            <StatCard icon={<FileText size={22} />} value="15,000+" label="Submissions" />
            <StatCard icon={<Globe2 size={22} />} value="120+" label="Countries" />
          </div>
        </section>

        <section className="bg-white px-0 py-[88px]" id="featured-conferences">
          <div className="mx-auto w-[min(1200px,calc(100%-40px))]">
            <SectionHeading
              eyebrow="Featured conferences"
              title={query ? `Results for “${query}”` : "Upcoming conferences"}
              description="Explore relevant events and find the right opportunity for your next presentation, collaboration or research connection."
              action={
                <button
                  className="inline-flex items-center gap-2 border-0 bg-transparent text-xs font-extrabold text-[#574af0]"
                  onClick={async () => {
                    setQuery("");
                    setFilters({ category: "", country: "" });
                    setConferences(await getFeaturedConferences());
                  }}
                >
                  View all conferences <ArrowRight size={18} />
                </button>
              }
            />

            <div className="grid grid-cols-3 gap-6 max-[820px]:grid-cols-2 max-[560px]:grid-cols-1">
              {conferences.length ? (
                conferences.map((conference) => (
                  <ConferenceCard key={conference.id} conference={conference} />
                ))
              ) : (
                <div className="col-span-full rounded-[18px] border border-dashed border-[#ccd3df] bg-[#fafbfe] p-[35px] text-center">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    onSearch={handleSearch}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                  <h3 className="mb-1.5 font-bold">No conferences found yet</h3>
                  <p className="mb-[18px] text-xs text-[#66728b]">Try another topic, conference name or location.</p>
                  <button className="rounded-[11px] border-0 bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-[18px] py-[11px] text-[13px] font-bold text-white" onClick={() => { setQuery(""); setFilters({ category: "", country: "" }); getFeaturedConferences().then(setConferences); }}>
                    Reset search
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f9fc] px-0 py-[88px]">
          <div className="mx-auto w-[min(1200px,calc(100%-40px))]">
            <SectionHeading
              eyebrow="One connected workflow"
              title="Everything starts with discovery."
              description="The first CMT release is designed around a simple journey that can grow into the full conference management platform."
            />

            <div className="grid grid-cols-4 gap-[17px] max-[820px]:grid-cols-2 max-[560px]:grid-cols-1">
              {[
                { icon: <Globe2 />, number: "01", title: "Discover", text: "Find conferences by topic, location, date and research area." },
                { icon: <FileText />, number: "02", title: "Participate", text: "Prepare submissions and follow important conference information." },
                { icon: <Users />, number: "03", title: "Connect", text: "Build meaningful connections with researchers and organisers." },
                { icon: <CheckCircle2 />, number: "04", title: "Advance", text: "Turn opportunities into presentations, collaborations and impact." },
              ].map((item) => (
                <article className="rounded-[15px] border border-[#e4e8f0] bg-white p-[23px] shadow-[0_10px_28px_rgba(15,28,65,.035)]" key={item.number}>
                  <div className="flex items-center justify-between">
                    <div className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#efedff] text-[#5c50ec]">{item.icon}</div>
                    <span className="text-[10px] font-extrabold text-[#b0b7c7]">{item.number}</span>
                  </div>
                  <h3 className="mb-2 mt-[22px] text-[17px] font-bold">{item.title}</h3>
                  <p className="m-0 text-[11px] leading-7 text-[#788398]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-[#07132f] text-white/60">
        <div className="mx-auto flex min-h-[100px] w-[min(1200px,calc(100%-40px))] items-center justify-between gap-5 text-[10px] max-[560px]:block max-[560px]:py-6">
          <div>
            <LogoFallback />
            <p>Conference Management Tool</p>
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