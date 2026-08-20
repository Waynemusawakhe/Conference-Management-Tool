import { CalendarDays, MapPin, ArrowUpRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConferenceCard({ conference, layout = "grid" }) {
  const navigate = useNavigate();
  const isList = layout === "list";

  return (
    <article className={`overflow-hidden rounded-2xl border border-[#e5e8ef] bg-white shadow-[0_12px_32px_rgba(15,28,65,.06)] transition hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(15,28,65,.10)] ${isList ? "md:flex" : ""}`}>
      <div className={`relative h-[175px] overflow-hidden ${isList ? "md:h-auto md:min-h-[240px] md:w-2/5" : ""}`}>
        <img src={conference.image} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <span className={`absolute right-[13px] top-[13px] rounded-[9px] bg-white/95 px-2.5 py-2 text-[10px] font-extrabold ${accentClasses[conference.accent]?.date ?? accentClasses.purple.date}`}>{conference.date}</span>
      </div>

      <div className={`p-5 ${isList ? "md:flex-1" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-[7px] px-2 py-1.5 text-[9px] font-extrabold ${accentClasses[conference.accent]?.category ?? accentClasses.purple.category}`}>
            {conference.category}
          </span>
          {conference.status && (
            <span className="rounded-full bg-[#eaf9f2] px-2 py-1 text-[9px] font-bold text-[#159b64]">{conference.status}</span>
          )}
          {conference.format && (
            <span className="rounded-full bg-[#f2f1ff] px-2 py-1 text-[9px] font-bold text-[#5c50ec]">{conference.format}</span>
          )}
        </div>

        {conference.acronym && (
          <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">{conference.acronym}</span>
        )}
        <h3 className="mt-3 min-h-[46px] text-[17px] font-bold leading-[1.35] tracking-[-.025em] text-[#0d1b3d]">{conference.shortTitle}</h3>

        {conference.description && (
          <p className="mt-2 text-xs leading-7 text-[#788398]">{conference.description}</p>
        )}

        {conference.submissionDeadline && (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#788398]">
            <Clock size={14} />
            Submission deadline: <strong>{conference.submissionDeadline}</strong>
          </p>
        )}

        {conference.topics?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {conference.topics.slice(0, 3).map((t) => (
              <span className="rounded-full bg-[#f4f6fa] px-2 py-1 text-[9px] font-semibold text-[#68748b]" key={t}>{t}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[#788398]">
          <span>
            <MapPin size={16} /> {conference.location}
          </span>
          <span>
            <CalendarDays size={16} /> {conference.city}, {conference.country}
          </span>
        </div>

        <button
          className="mt-5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-extrabold text-[#5a4df1]"
          type="button"
          onClick={() => navigate("/conferences")}
        >
          View conference <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}

const accentClasses = {
  purple: { date: "text-[#5c50ec]", category: "bg-[#f2f1ff] text-[#5c50ec]" },
  green: { date: "text-[#159b64]", category: "bg-[#eaf9f2] text-[#159b64]" },
  orange: { date: "text-[#e87f19]", category: "bg-[#fff1e4] text-[#e87f19]" },
};