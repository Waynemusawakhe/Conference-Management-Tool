import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import RoleChrome from "../components/RoleChrome";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  ongoing: "Ongoing",
  completed: "Completed",
  closed: "Closed",
};

function formatDate(value) {
  if (!value) return "Date not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(start, end) {
  if (!start && !end) return "Date not set";
  if (start && !end) return formatDate(start);
  if (!start && end) return `Ends ${formatDate(end)}`;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return formatDate(start);
  }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export default function UserConferencePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conference, setConference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const loadConference = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await conferencesApi.getById(id);
      const data = response?.data ?? response;
      setConference(data);
    } catch (err) {
      if (err?.status === 404) setError("This conference could not be found.");
      else setError(err?.message || "Unable to load this conference.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadConference();
  }, [loadConference]);

  async function handleRegister() {
    if (!user) {
      navigate("/login", { state: { from: `/conferences/${id}` } });
      return;
    }
    setRegistering(true);
    setRegisterError("");
    try {
      await registrationsApi.create({ conference_id: Number(id) });
      setRegistered(true);
    } catch (err) {
      setRegisterError(
        err?.message || "Unable to register. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  }

  function handleSubmitProposal() {
    if (!user) {
      navigate("/login", { state: { from: `/conferences/${id}` } });
      return;
    }
    navigate(`/author-dashboard#my-proposals`);
  }

  return (
    <RoleChrome>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5c6880] transition hover:text-[#2563eb] dark:text-[#cbd5e1] dark:hover:text-white"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {loading && (
        <div className="grid min-h-[40vh] place-items-center">
          <LoaderCircle size={22} className="animate-spin text-[#7c879a]" />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-xs font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {!loading && !error && conference && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.24),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.2),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.14)] sm:p-10">
            <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.08] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#b9b3ff]">
                <Globe size={11} /> Conference
              </span>
              <h1 className="mt-4 text-[clamp(24px,3.4vw,38px)] font-bold leading-tight tracking-[-.045em]">
                {conference.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatDateRange(
                    conference.start_date || conference.date,
                    conference.end_date
                  )}
                </span>
                {(conference.location || conference.venue) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {conference.venue ? `${conference.venue}, ` : ""}
                    {conference.location}
                  </span>
                )}
                {conference.organiser?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} />
                    {conference.organiser.name}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Grid */}
          <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div className="space-y-5">
              {conference.description && (
                <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
                  <h2 className="m-0 text-[16px] font-bold text-[#1c2a4a] dark:text-white">
                    About this conference
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#5c6880] dark:text-[#94a3b8]">
                    {conference.description}
                  </p>
                </article>
              )}

              <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)] dark:border-[#1e293b] dark:bg-[#0f172a]">
                <h2 className="m-0 text-[16px] font-bold text-[#1c2a4a] dark:text-white">
                  Conference details
                </h2>
                <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-2">
                  <DetailItem
                    label="Dates"
                    value={formatDateRange(
                      conference.start_date || conference.date,
                      conference.end_date
                    )}
                  />
                  <DetailItem
                    label="Location"
                    value={conference.location || "Not specified"}
                  />
                  <DetailItem
                    label="Organiser"
                    value={conference.organiser?.name || "CMT"}
                  />
                  {conference.website && (
                    <DetailItem
                      label="Website"
                      value={
                        <a
                          href={conference.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-[#2563eb] hover:underline"
                        >
                          Visit site <ExternalLink size={11} />
                        </a>
                      }
                    />
                  )}
                  {conference.submission_deadline && (
                    <DetailItem
                      label="Submission deadline"
                      value={formatDate(conference.submission_deadline)}
                    />
                  )}
                  {conference.status && (
                    <DetailItem
                      label="Status"
                      value={STATUS_LABELS[conference.status] || conference.status}
                    />
                  )}
                </dl>
              </article>
            </div>

            {/* Actions */}
            <aside>
              <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.05)] dark:border-[#1e293b] dark:bg-[#0f172a] lg:sticky lg:top-[100px]">
                <h3 className="m-0 text-[13px] font-extrabold text-[#1c2a4a] dark:text-white">
                  Take part in this conference
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-[#7c879c] dark:text-[#94a3b8]">
                  Attend the event, or submit your research proposal for review.
                </p>

                <div className="mt-4 space-y-2.5">
                  <button
                    onClick={handleRegister}
                    disabled={registering || registered}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {registered ? (
                      <>✓ Registered</>
                    ) : registering ? (
                      <>
                        <LoaderCircle size={15} className="animate-spin" />{" "}
                        Registering…
                      </>
                    ) : (
                      <>
                        <Ticket size={15} /> Register to attend
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSubmitProposal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 text-[12px] font-extrabold text-[#43506a] transition hover:-translate-y-px hover:border-[#8175ef] hover:text-[#4f46c7] dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-white"
                  >
                    <FileText size={15} /> Submit a proposal
                  </button>
                </div>

                {registerError && (
                  <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700 dark:border-[#5b1e1e] dark:bg-[#2a1218] dark:text-[#f08a9a]"
                  >
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>{registerError}</span>
                  </div>
                )}

                {registered && (
                  <div
                    role="status"
                    className="mt-3 rounded-xl border border-[#bfe5d1] bg-[#effaf4] px-3 py-2 text-[10px] font-bold text-[#18794e] dark:border-[#1e4d33] dark:bg-[#052e1f] dark:text-[#34d399]"
                  >
                    You're registered. Check "My conferences" for details.
                  </div>
                )}
              </article>
            </aside>
          </section>
        </>
      )}
    </RoleChrome>
  );
}

function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-[#edf0f5] bg-[#fafbfe] p-3 dark:border-[#1e293b] dark:bg-[#0b1224]">
      <dt className="m-0 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5] dark:text-[#94a3b8]">
        {label}
      </dt>
      <dd className="m-0 mt-1 text-[12px] font-semibold text-[#1c2a4a] dark:text-white">
        {value}
      </dd>
    </div>
  );
}