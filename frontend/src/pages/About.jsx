import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="site">
      <Navbar />

      <main>
        <section className="page-header">
          <div className="hero-noise" />
          <div className="container" style={{ position: "relative", zIndex: 2 }}>
            <span className="hero-kicker"><Sparkles size={15} /> About CMT</span>
            <h1>One platform for the whole conference journey.</h1>
            <p>
              CMT replaces scattered conference work — emails, spreadsheets, chat
              threads and separate forms — with a single, role-based flow: submit,
              review, decide, schedule, register, communicate and report.
            </p>
          </div>
        </section>

        <section className="section value-section">
          <div className="container value-grid">
            <div className="value-copy">
              <span className="eyebrow">Why CMT exists</span>
              <h2>Conference admin, without the chaos.</h2>
              <p>
                Conference work gets difficult once information is spread across
                inboxes, spreadsheets, group chats and PDFs. Submissions get lost
                or duplicated, reviewer assignment is manual, and it becomes hard
                to say what's actually happening at any given moment.
              </p>
              <p>
                CMT is built to be the control room instead — one place where
                submissions, reviews, decisions, the programme and reporting all
                live together, with each role seeing exactly what they need to.
              </p>
              <div className="check-list">
                <div><ShieldCheck size={17} /> One source of truth for every submission</div>
                <div><ShieldCheck size={17} /> Clear, role-based workflow for every stakeholder</div>
                <div><ShieldCheck size={17} /> Structured peer review with a visible audit trail</div>
                <div><ShieldCheck size={17} /> Reporting built in from day one, not bolted on</div>
              </div>
            </div>

            <div className="architecture-card">
              <div className="architecture-header">
                <span className="status-dot" /> WHAT CMT MANAGES
              </div>
              <div className="check-list" style={{ marginTop: 22 }}>
                <div style={{ color: "#dfe4f4" }}><ShieldCheck size={17} color="#8b7eff" /> Users, roles and permissions</div>
                <div style={{ color: "#dfe4f4" }}><ShieldCheck size={17} color="#8b7eff" /> Abstracts, papers and reviews</div>
                <div style={{ color: "#dfe4f4" }}><ShieldCheck size={17} color="#8b7eff" /> Decisions and sessions</div>
                <div style={{ color: "#dfe4f4" }}><ShieldCheck size={17} color="#8b7eff" /> Registration records</div>
                <div style={{ color: "#dfe4f4" }}><ShieldCheck size={17} color="#8b7eff" /> Communication logs and reports</div>
              </div>
              <div className="architecture-note">
                <span>In one line</span>
                A Conference Management Tool covers the full lifecycle of an
                academic conference, from call-for-papers to the final programme
                and post-event reporting.
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="hero-kicker"><Sparkles size={15} /> Ready when you are</span>
                <h2>See what's on offer right now.</h2>
                <p>Browse upcoming conferences, or reach out if you've got questions about how CMT works.</p>
              </div>
              <a href="/" className="btn btn-white" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                Explore conferences <ArrowRight size={16} />
              </a>
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