import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import ConferenceCard from "../components/ConferenceCard";
import HeroVisual from "../components/HeroVisual";
import SectionHeading from "../components/SectionHeading";
import Logo from "../components/Logo";
import {
  getAllConferences,
  getFeaturedConferences,
  searchConferences,
} from "../services/conferenceService";
import "../styles/home.css";

const topics = [
  "AI & Machine Learning",
  "Computer Science",
  "Engineering",
  "Medicine",
  "Education",
];

const waysToExplore = [
  { icon: CalendarDays, title: "Deadlines that matter", text: "See when calls close before you plan a submission." },
  { icon: Search, title: "Find your field", text: "Browse by research area, place, or conference name." },
  { icon: FileText, title: "Know the next step", text: "Move from discovery to a prepared submission." },
  { icon: Users, title: "Work together", text: "Authors, organisers, reviewers, and attendees share one space." },
];

const workflow = [
  { icon: Search, number: "01", title: "Find a good fit", text: "Compare subjects, locations, formats, and submission dates." },
  { icon: FileText, number: "02", title: "Prepare your work", text: "Keep the conference details close while you shape a proposal." },
  { icon: Users, number: "03", title: "Stay in the loop", text: "Follow registration and review updates from your workspace." },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [conferences, setConferences] = useState([]);
  const [filters, setFilters] = useState({ category: "", country: "" });
  const [conferencesLoading, setConferencesLoading] = useState(true);
  const [conferencesError, setConferencesError] = useState("");

  const loadConferences = useCallback(async (request) => {
    setConferencesLoading(true);
    setConferencesError("");
    try {
      setConferences(await request());
    } catch (error) {
      setConferences([]);
      setConferencesError(error?.message || "We couldn't load conferences. Please try again.");
    } finally {
      setConferencesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConferences(() => getFeaturedConferences());
  }, [loadConferences]);

  const scrollToConferences = () => {
    document.getElementById("featured-conferences")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = () => {
    loadConferences(() => searchConferences(query, filters));
    scrollToConferences();
  };

  const chooseTopic = (topic) => {
    setQuery(topic);
    setFilters({ category: "", country: "" });
    loadConferences(() => searchConferences(topic));
    scrollToConferences();
  };

  const showAllConferences = () => {
    setQuery("");
    setFilters({ category: "", country: "" });
    loadConferences(() => getAllConferences());
  };

  const resetSearch = () => {
    setQuery("");
    setFilters({ category: "", country: "" });
    loadConferences(() => getFeaturedConferences());
  };

  const retryConferences = () => {
    const hasSearch = query || filters.category || filters.country;
    loadConferences(() => hasSearch
      ? searchConferences(query, filters)
      : getFeaturedConferences());
  };

  return (
    <div className="cmt-home">
      <div id="top" />
      <Navbar />

      <main>
        <section className="home-hero">
          <div className="home-hero-grain" aria-hidden="true" />
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <span className="home-kicker"><Sparkles size={14} /> A clearer way to find your next conference</span>
              <h1>Find the right room<br /><span>for your ideas.</span></h1>
              <p className="home-intro">
                Good research deserves the right audience. Browse conferences,
                check the deadlines, and make your next move with confidence.
              </p>

              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                filters={filters}
                onFiltersChange={setFilters}
              />

              <div className="home-topic-list" aria-label="Popular research topics">
                <span>Start with a topic</span>
                {topics.map((topic) => (
                  <button key={topic} type="button" onClick={() => chooseTopic(topic)}>
                    {topic}
                  </button>
                ))}
              </div>

              <div className="home-community-note">
                <span className="home-community-icon"><Users size={17} /></span>
                <span>
                  <strong>One workspace for the whole conference journey</strong>
                  <small>From the first call for papers to the final review.</small>
                </span>
              </div>
            </div>

            <HeroVisual />
          </div>
          <div className="home-hero-edge" aria-hidden="true" />
        </section>

        <section className="home-explore" aria-label="What you can do">
          <div className="home-explore-inner">
            <p className="home-explore-label">A little less searching. A lot more clarity.</p>
            <div className="home-explore-grid">
              {waysToExplore.map(({ icon: Icon, title, text }) => (
                <article className="home-explore-item" key={title}>
                  <span className="home-explore-icon"><Icon size={18} /></span>
                  <span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-featured" id="featured-conferences">
          <div className="home-container">
            <SectionHeading
              eyebrow={query ? "Search results" : "Worth a closer look"}
              title={query ? `Conferences for “${query}”` : "Find a conference that fits."}
              description="A useful shortlist starts with the details that matter: what it's about, where it is, and when submissions close."
              action={(
                <button className="home-view-all" type="button" onClick={showAllConferences}>
                  Browse all conferences <ArrowRight size={16} />
                </button>
              )}
            />

            <div className="home-conference-grid">
              {conferencesLoading ? (
                <div className="home-state" role="status">
                  <span className="home-state-spinner" />
                  <span>Finding conferences for you...</span>
                </div>
              ) : conferencesError ? (
                <div className="home-state home-state-error" role="alert">
                  <p>{conferencesError}</p>
                  <button type="button" onClick={retryConferences}>Try again</button>
                </div>
              ) : conferences.length ? (
                conferences.map((conference) => (
                  <ConferenceCard key={conference.id} conference={conference} />
                ))
              ) : (
                <div className="home-state home-state-empty">
                  <span className="home-empty-icon"><MapPin size={20} /></span>
                  <h3>No conferences found</h3>
                  <p>
                    {query || filters.category || filters.country
                      ? "Try a broader topic or clear your filters to see more options."
                      : "There aren't any conferences to show just yet. Check back soon."}
                  </p>
                  <button type="button" onClick={resetSearch}>Show featured conferences</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="home-workflow">
          <div className="home-container">
            <SectionHeading
              eyebrow="How it comes together"
              title="A good next step, at every stage."
              description="Whether you're presenting, organising, or reviewing, the important details stay within reach."
            />
            <div className="home-workflow-grid">
              {workflow.map(({ icon: Icon, number, title, text }) => (
                <article className="home-workflow-card" key={number}>
                  <div className="home-workflow-top">
                    <span className="home-workflow-icon"><Icon size={19} /></span>
                    <span>{number}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
              <aside className="home-workflow-note">
                <span className="home-note-icon"><CheckCircle2 size={18} /></span>
                <div>
                  <strong>Keep the work moving.</strong>
                  <p>Clear information makes it easier for everyone to focus on the research.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div>
            <Logo />
            <p>Thoughtful tools for the research community.</p>
          </div>
          <span>© {new Date().getFullYear()} Conference Management Tool</span>
        </div>
      </footer>
    </div>
  );
}
