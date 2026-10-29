import { ArrowUpRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAccent(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("medicine") || value.includes("health")) return "sage";
  if (value.includes("engineering") || value.includes("education")) return "clay";
  return "violet";
}

export default function ConferenceCard({ conference, layout = "grid" }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAuthor = role === "author";
  const isList = layout === "list";

  const conferenceName = conference.name || conference.shortTitle || conference.title || "Untitled Conference";
  const conferenceCode = conference.code || conference.acronym || "CMT";
  const category = conference.category || "Conference";
  const status = conference.submission_status || conference.status || "";
  const format = conference.format || "";
  const topics = Array.isArray(conference.topics) ? conference.topics : [];
  const venue = conference.venue_name || conference.location || "Venue to be announced";
  const city = conference.city || "";
  const country = conference.country || "";
  const deadline = formatDate(conference.submission_deadline || conference.submissionDeadline);
  const startDate = formatDate(conference.start_date || conference.startDate || conference.date);
  const endDate = formatDate(conference.end_date || conference.endDate);
  const accent = getAccent(category);

  const handleSubmitProposal = () => {
    if (!conference?.id) return;
    navigate(`/submit-proposal/${encodeURIComponent(conference.id)}`);
  };

  return (
    <article className={`conference-card-modern${isList ? " is-list" : ""}`}>
      <div className={`conference-artwork accent-${accent}`}>
        <div className="conference-artwork-lines" aria-hidden="true" />
        <div className="conference-artwork-header">
          <span>CONFERENCE</span>
          {startDate && <time>{startDate}</time>}
        </div>
        <div className="conference-artwork-center">
          <span className="conference-artwork-code">{conferenceCode}</span>
          <span className="conference-artwork-caption">Ideas in conversation</span>
        </div>
        <span className="conference-artwork-ring" aria-hidden="true" />
      </div>

      <div className="conference-card-content">
        <div className="conference-card-labels">
          <span className={`conference-category-label accent-${accent}`}>{category}</span>
          {status && <span className="conference-status-label">{status}</span>}
          {format && <span className="conference-format-label">{format}</span>}
        </div>

        <h3>{conferenceName}</h3>
        {conference.description && <p className="conference-card-description">{conference.description}</p>}

        <div className="conference-card-details">
          {deadline && (
            <div>
              <Clock3 size={15} aria-hidden="true" />
              <span><small>Submissions close</small><strong>{deadline}</strong></span>
            </div>
          )}
          <div>
            <MapPin size={15} aria-hidden="true" />
            <span><small>Where</small><strong>{[venue, city, country].filter(Boolean).join(", ")}</strong></span>
          </div>
          {startDate && (
            <div>
              <CalendarDays size={15} aria-hidden="true" />
              <span>
                <small>When</small>
                <strong>{startDate}{endDate && endDate !== startDate ? ` – ${endDate}` : ""}</strong>
              </span>
            </div>
          )}
        </div>

        {topics.length > 0 && (
          <div className="conference-card-topics" aria-label="Conference topics">
            {topics.slice(0, 3).map((topic, index) => (
              <span key={`${topic}-${index}`}>{topic}</span>
            ))}
            {topics.length > 3 && <span>+{topics.length - 3}</span>}
          </div>
        )}

        {isAuthor && (
          <div className="conference-card-action">
            <button type="button" onClick={handleSubmitProposal} disabled={!conference?.id}>
              Submit a proposal <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
