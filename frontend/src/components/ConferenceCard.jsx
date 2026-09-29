import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const accentClasses = {
  purple: {
    date: "text-[#5c50ec]",
    category: "bg-[#f2f1ff] text-[#5c50ec]",
  },

  green: {
    date: "text-[#159b64]",
    category: "bg-[#eaf9f2] text-[#159b64]",
  },

  orange: {
    date: "text-[#e87f19]",
    category: "bg-[#fff1e4] text-[#e87f19]",
  },
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAccent(category) {
  const value = String(category || "").toLowerCase();

  if (
    value.includes("medicine") ||
    value.includes("health")
  ) {
    return "green";
  }

  if (
    value.includes("engineering") ||
    value.includes("education")
  ) {
    return "orange";
  }

  return "purple";
}

export default function ConferenceCard({
  conference,
  layout = "grid",
}) {
  const navigate = useNavigate();

  const isList = layout === "list";

  const accent =
    conference.accent ||
    getAccent(conference.category);

  const styles =
    accentClasses[accent] ||
    accentClasses.purple;

  const conferenceName =
    conference.name ||
    conference.shortTitle ||
    "Untitled Conference";

  const conferenceCode =
    conference.code ||
    conference.acronym ||
    "";

  const conferenceCategory =
    conference.category ||
    "Conference";

  const conferenceStatus =
    conference.submission_status ||
    conference.status ||
    "";

  const conferenceFormat =
    conference.format ||
    "";

  const conferenceDescription =
    conference.description ||
    "";

  const topics = Array.isArray(conference.topics)
    ? conference.topics
    : [];

  const venue =
    conference.venue_name ||
    conference.location ||
    "Venue to be announced";

  const city =
    conference.city ||
    "";

  const country =
    conference.country ||
    "";

  const submissionDeadline =
    conference.submission_deadline ||
    conference.submissionDeadline ||
    "";

  const startDate =
    conference.start_date ||
    conference.startDate ||
    conference.date ||
    "";

  const endDate =
    conference.end_date ||
    conference.endDate ||
    "";

  const formattedStartDate = formatDate(startDate);

  const formattedEndDate = formatDate(endDate);

  const formattedDeadline =
    formatDate(submissionDeadline);

  const handleSubmitProposal = () => {
    if (!conference?.id) {
      return;
    }

    navigate(
      `/submit-proposal/${encodeURIComponent(
        conference.id
      )}`
    );
  };

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-[#e5e8ef] bg-white shadow-[0_12px_32px_rgba(15,28,65,.06)] transition hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(15,28,65,.10)] ${
        isList ? "md:flex" : ""
      }`}
    >
      {/* Conference header */}
      <div
        className={`relative flex min-h-[175px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgba(102,85,246,.3),transparent_35%),linear-gradient(135deg,#07132f,#15165a)] p-8 ${
          isList
            ? "md:min-h-[240px] md:w-2/5"
            : ""
        }`}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full border border-white/20" />
          <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full border border-white/10" />
        </div>

        <div className="relative z-[2] text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#b9b3ff]">
            Conference
          </span>

          <div className="mt-2 text-3xl font-black tracking-[-.05em] text-white">
            {conferenceCode || "CMT"}
          </div>
        </div>

        {formattedStartDate && (
          <span
            className={`absolute right-[13px] top-[13px] rounded-[9px] bg-white/95 px-2.5 py-2 text-[10px] font-extrabold ${styles.date}`}
          >
            {formattedStartDate}
          </span>
        )}
      </div>

      {/* Conference information */}
      <div
        className={`p-5 ${
          isList ? "md:flex-1" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-[7px] px-2 py-1.5 text-[9px] font-extrabold ${styles.category}`}
          >
            {conferenceCategory}
          </span>

          {conferenceStatus && (
            <span className="rounded-full bg-[#eaf9f2] px-2 py-1 text-[9px] font-bold text-[#159b64]">
              {conferenceStatus}
            </span>
          )}

          {conferenceFormat && (
            <span className="rounded-full bg-[#f2f1ff] px-2 py-1 text-[9px] font-bold text-[#5c50ec]">
              {conferenceFormat}
            </span>
          )}
        </div>

        {conferenceCode && (
          <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">
            {conferenceCode}
          </span>
        )}

        <h3 className="mt-3 min-h-[46px] text-[17px] font-bold leading-[1.35] tracking-[-.025em] text-[#0d1b3d]">
          {conferenceName}
        </h3>

        {conferenceDescription && (
          <p className="mt-2 line-clamp-3 text-xs leading-7 text-[#788398]">
            {conferenceDescription}
          </p>
        )}

        {formattedDeadline && (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#788398]">
            <Clock size={14} />

            <span>
              Submission deadline:{" "}
              <strong className="text-[#43506a]">
                {formattedDeadline}
              </strong>
            </span>
          </p>
        )}

        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topics.slice(0, 3).map((topic, index) => (
              <span
                className="rounded-full bg-[#f4f6fa] px-2 py-1 text-[9px] font-semibold text-[#68748b]"
                key={`${topic}-${index}`}
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 text-[10px] text-[#788398]">
          <span className="flex items-center gap-1.5">
            <MapPin
              size={15}
              className="shrink-0"
            />

            <span>
              {venue}
              {city ? `, ${city}` : ""}
              {country ? `, ${country}` : ""}
            </span>
          </span>

          {formattedStartDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays
                size={15}
                className="shrink-0"
              />

              <span>
                {formattedStartDate}

                {formattedEndDate &&
                  formattedEndDate !==
                    formattedStartDate &&
                  ` – ${formattedEndDate}`}
              </span>
            </span>
          )}
        </div>

        <button
          className="mt-5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-extrabold text-[#5a4df1]"
          type="button"
          onClick={handleSubmitProposal}
          disabled={!conference?.id}
        >
          Submit a proposal
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}