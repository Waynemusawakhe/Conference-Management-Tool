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
    <div className="site">
      <div id="top" />
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-noise" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><Sparkles size={15} /> Conference Management Tool</span>
              <h1>
                Discover. Connect.
                <span>Advance Knowledge.</span>
              </h1>
              <p className="hero-lead">
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

              <div className="popular-topics">
                <span>Popular topics:</span>
                {topics.map((topic) => (
                  <button key={topic} onClick={() => chooseTopic(topic)}>
                    {topic}
                  </button>
                ))}
              </div>

              <div className="hero-trust">
                <div className="trust-avatars">
                  <span>AK</span><span>LM</span><span>TN</span><span>+</span>
                </div>
                <div>
                  <strong>Built for the research community</strong>
                  <small>Discover opportunities that move your work forward.</small>
                </div>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section className="stats-section">
          <div className="container stats-panel">
            <StatCard icon={<CalendarDays size={22} />} value="1,250+" label="Conferences" />
            <StatCard icon={<Users size={22} />} value="25,000+" label="Researchers" />
            <StatCard icon={<FileText size={22} />} value="15,000+" label="Submissions" />
            <StatCard icon={<Globe2 size={22} />} value="120+" label="Countries" />
          </div>
        </section>

        <section className="section featured-section" id="featured-conferences">
          <div className="container">
            <SectionHeading
              eyebrow="Featured conferences"
              title={query ? `Results for “${query}”` : "Upcoming conferences"}
              description="Explore relevant events and find the right opportunity for your next presentation, collaboration or research connection."
              action={
                <button
                  className="section-action"
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

            <div className="conference-grid">
              {conferences.length ? (
                conferences.map((conference) => (
                  <ConferenceCard key={conference.id} conference={conference} />
                ))
              ) : (
                <div className="empty-state">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    onSearch={handleSearch}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                  <h3>No conferences found yet</h3>
                  <p>Try another topic, conference name or location.</p>
                  <button className="btn btn-primary" onClick={() => { setQuery(""); setFilters({ category: "", country: "" }); getFeaturedConferences().then(setConferences); }}>
                    Reset search
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section process-section">
          <div className="container">
            <SectionHeading
              eyebrow="One connected workflow"
              title="Everything starts with discovery."
              description="The first CMT release is designed around a simple journey that can grow into the full conference management platform."
            />

            <div className="process-grid">
              {[
                { icon: <Globe2 />, number: "01", title: "Discover", text: "Find conferences by topic, location, date and research area." },
                { icon: <FileText />, number: "02", title: "Participate", text: "Prepare submissions and follow important conference information." },
                { icon: <Users />, number: "03", title: "Connect", text: "Build meaningful connections with researchers and organisers." },
                { icon: <CheckCircle2 />, number: "04", title: "Advance", text: "Turn opportunities into presentations, collaborations and impact." },
              ].map((item) => (
                <article className="process-card" key={item.number}>
                  <div className="process-top">
                    <div className="process-icon">{item.icon}</div>
                    <span>{item.number}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="footer">
        <div className="container footer-inner">
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
    <div className="brand footer-brand">
      <img className="brand-mark" src="/cmt-mark.png" alt="CMT logo" />
      <div className="brand-copy">
        <strong>CMT</strong>
        <span>Conference Management Tool</span>
      </div>
    </div>
  );
}