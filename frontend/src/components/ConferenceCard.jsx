import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

export default function ConferenceCard({ conference }) {
  return (
    <article className="conference-card">
      <div className="conference-image-wrap">
        <img src={conference.image} alt="" className="conference-image" />
        <span className={`date-pill ${conference.accent}`}>{conference.date}</span>
      </div>

      <div className="conference-body">
        <span className={`category-pill ${conference.accent}`}>{conference.category}</span>
        <h3>{conference.shortTitle}</h3>

        <div className="conference-meta">
          <span><MapPin size={16} /> {conference.location}</span>
          <span><CalendarDays size={16} /> {conference.city}</span>
        </div>

        <button className="text-link">
          View conference <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}