import { CalendarDays, MapPin, ArrowUpRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConferenceCard({ conference, layout = "grid" }) {
  const navigate = useNavigate();
  const isList = layout === "list";

  return (
    <article className={`conference-card ${isList ? "is-list" : ""}`}>
      <div className="conference-image-wrap">
        <img src={conference.image} alt="" className="conference-image" />
        <span className={`date-pill ${conference.accent}`}>{conference.date}</span>
      </div>

      <div className="conference-body">
        <div className="conference-card-top">
          <span className={`category-pill ${conference.accent}`}>
            {conference.category}
          </span>
          {conference.status && (
            <span className="status-chip">{conference.status}</span>
          )}
          {conference.format && (
            <span className="format-chip">{conference.format}</span>
          )}
        </div>

        {conference.acronym && (
          <span className="conference-acronym">{conference.acronym}</span>
        )}
        <h3>{conference.shortTitle}</h3>

        {conference.description && (
          <p className="conference-desc">{conference.description}</p>
        )}

        {conference.submissionDeadline && (
          <p className="conference-deadline">
            <Clock size={14} />
            Submission deadline: <strong>{conference.submissionDeadline}</strong>
          </p>
        )}

        {conference.topics?.length > 0 && (
          <div className="topic-chips">
            {conference.topics.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}

        <div className="conference-meta">
          <span>
            <MapPin size={16} /> {conference.location}
          </span>
          <span>
            <CalendarDays size={16} /> {conference.city}, {conference.country}
          </span>
        </div>

        <button
          className="text-link"
          type="button"
          onClick={() => navigate("/conferences")}
        >
          View conference <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}