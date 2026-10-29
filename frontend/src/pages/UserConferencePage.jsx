import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { useAuth } from "../hooks/useAuth";

const STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  ongoing: "Ongoing",
  completed: "Completed",
  closed: "Closed",
  open: "Open",
};

function formatDate(value) {
  if (!value) return "Date not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(start, end) {
  if (!start && !end) {
    return "Date not set";
  }

  if (start && !end) {
    return formatDate(start);
  }

  if (!start && end) {
    return `Ends ${formatDate(end)}`;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return formatDate(start);
  }

  if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth()
  ) {
    return `${startDate.getDate()}–${endDate.getDate()} ${startDate.toLocaleDateString(
      "en-ZA",
      {
        month: "long",
        year: "numeric",
      },
    )}`;
  }

  return `${formatDate(start)} → ${formatDate(end)}`;
}

function unwrapList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function getRegistrationConferenceId(registration) {
  return (
    registration?.conference_id ??
    registration?.conference?.id ??
    null
  );
}

export default function UserConferencePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    status: authStatus,
  } = useAuth();

  const [conference, setConference] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [registerError, setRegisterError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const isAuthor = user?.role === "author";

  const loadConference = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await conferencesApi.getById(id);

      const data =
        response?.data?.data ??
        response?.data ??
        response;

      setConference(data);
    } catch (err) {
      if (err?.status === 404) {
        setError("This conference could not be found.");
      } else {
        setError(
          err?.message ||
            "Unable to load this conference.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadConference();
  }, [loadConference]);

  useEffect(() => {
    let active = true;

    async function loadRegistrationStatus() {
      if (
        authStatus !== "authenticated" ||
        !user?.id
      ) {
        if (active) {
          setRegistered(false);
        }

        return;
      }

      try {
        const response = await registrationsApi.getAll({
          conference_id: Number(id),
          per_page: 100,
        });

        const registrations = unwrapList(response);

        const alreadyRegistered = registrations.some(
          (registration) =>
            String(
              getRegistrationConferenceId(registration),
            ) === String(id) &&
            String(registration?.user_id) ===
              String(user.id) &&
            registration?.status !== "cancelled",
        );

        if (active) {
          setRegistered(alreadyRegistered);
        }
      } catch {
        /*
         * Registration creation still protects against
         * duplicates on the backend, so failure to load
         * this status must not break the conference page.
         */
      }
    }

    loadRegistrationStatus();

    return () => {
      active = false;
    };
  }, [
    authStatus,
    id,
    user?.id,
  ]);

  const proposalClosed = useMemo(() => {
    const status = String(
      conference?.submission_status ??
        conference?.status ??
        "",
    )
      .trim()
      .toLowerCase();

    return [
      "closed",
      "completed",
    ].includes(status);
  }, [conference]);

  async function handleRegister() {
    setRegisterError("");
    setActionMessage("");

    if (authStatus !== "authenticated") {
      navigate("/login", {
        state: {
          from: `/conferences/${id}`,
        },
      });

      return;
    }

    if (registered) {
      navigate("/my-conferences");
      return;
    }

    setRegistering(true);

    try {
      await registrationsApi.create({
        conference_id: Number(id),
      });

      setRegistered(true);

      setActionMessage(
        "Registration successful. This conference has been added to My Conferences.",
      );
    } catch (err) {
      const validationMessage = Object.values(
        err?.errors || {},
      )
        .flat()
        .filter(Boolean)
        .join(" ");

      const message =
        validationMessage ||
        err?.message ||
        "Unable to register. Please try again.";

      if (
        message
          .toLowerCase()
          .includes("already registered")
      ) {
        setRegistered(true);

        setActionMessage(
          "You are already registered for this conference.",
        );

        return;
      }

      setRegisterError(message);
    } finally {
      setRegistering(false);
    }
  }

  function handleSubmitProposal() {
    setActionMessage("");
    setRegisterError("");

    if (authStatus !== "authenticated") {
      navigate("/login", {
        state: {
          from: `/conferences/${id}`,
        },
      });

      return;
    }

    if (!isAuthor) {
      setActionMessage(
        "Only an Author account can submit a proposal. You can still register to attend this conference.",
      );

      return;
    }

    if (proposalClosed) {
      setActionMessage(
        "Proposal submissions are closed for this conference.",
      );

      return;
    }

    navigate(
      `/submit-proposal/${encodeURIComponent(id)}`,
    );
  }

  const venue =
    conference?.venue_name ||
    conference?.venue ||
    conference?.location ||
    "Not specified";

  const city = conference?.city || "";
  const country = conference?.country || "";

  const location = [venue, city, country]
    .filter(Boolean)
    .join(", ");

  const website =
    conference?.website_link ||
    conference?.website ||
    conference?.external_website ||
    "";

  const organiser =
    conference?.organiser?.name ||
    conference?.organiser_name ||
    "CMT";

  const conferenceStatus =
    conference?.submission_status ||
    conference?.status ||
    "";

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />

      <main className="mx-auto w-[min(1200px,calc(100%-40px))] py-8 sm:py-10">
        <button
          type="button"
          onClick={() => navigate("/conferences")}
          className="mb-5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-bold text-[#5c6880] transition hover:text-[#2563eb]"
        >
          <ArrowLeft size={14} />
          Back to conferences
        </button>

        {loading && (
          <div className="grid min-h-[50vh] place-items-center">
            <div className="text-center">
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-[#6655f6]"
              />

              <p className="mt-3 text-xs font-semibold text-[#788398]">
                Loading conference...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-xs font-semibold text-red-700"
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && conference && (
          <>
            <section className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_78%_18%,rgba(121,104,255,.24),transparent_25%),radial-gradient(circle_at_100%_100%,rgba(27,94,255,.2),transparent_36%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] p-6 text-white shadow-[0_18px_55px_rgba(15,28,65,.14)] sm:p-10">
              <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.15)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.08] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#b9b3ff]">
                  <Globe size={11} />
                  Conference
                </span>

                <h1 className="mt-4 max-w-[850px] text-[clamp(26px,4vw,44px)] font-bold leading-tight tracking-[-.045em]">
                  {conference.name ||
                    "Untitled Conference"}
                </h1>

                {conference.code && (
                  <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#b9b3ff]">
                    {conference.code}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />

                    {formatDateRange(
                      conference.start_date ||
                        conference.date,
                      conference.end_date,
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />

                    {location}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} />

                    {organiser}
                  </span>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
              <div className="space-y-5">
                <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
                  <h2 className="m-0 text-[16px] font-bold text-[#1c2a4a]">
                    About this conference
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#5c6880]">
                    {conference.description ||
                      "No conference description has been provided yet."}
                  </p>
                </article>

                <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,28,65,.035)]">
                  <h2 className="m-0 text-[16px] font-bold text-[#1c2a4a]">
                    Conference details
                  </h2>

                  <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-2">
                    <DetailItem
                      label="Dates"
                      value={formatDateRange(
                        conference.start_date ||
                          conference.date,
                        conference.end_date,
                      )}
                    />

                    <DetailItem
                      label="Venue"
                      value={venue}
                    />

                    <DetailItem
                      label="City"
                      value={city || "Not specified"}
                    />

                    <DetailItem
                      label="Country"
                      value={country || "Not specified"}
                    />

                    <DetailItem
                      label="Organiser"
                      value={organiser}
                    />

                    {conference.format && (
                      <DetailItem
                        label="Format"
                        value={String(
                          conference.format,
                        )
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase(),
                          )}
                      />
                    )}

                    {conference.submission_deadline && (
                      <DetailItem
                        label="Submission deadline"
                        value={formatDate(
                          conference.submission_deadline,
                        )}
                      />
                    )}

                    {conferenceStatus && (
                      <DetailItem
                        label="Status"
                        value={
                          STATUS_LABELS[
                            conferenceStatus
                          ] || conferenceStatus
                        }
                      />
                    )}

                    {website && (
                      <DetailItem
                        label="Website"
                        value={
                          <a
                            href={website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-[#2563eb] hover:underline"
                          >
                            Visit conference website
                            <ExternalLink size={11} />
                          </a>
                        }
                      />
                    )}
                  </dl>
                </article>
              </div>

              <aside>
                <article className="rounded-[20px] border border-[#e4e8f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,28,65,.05)] lg:sticky lg:top-[100px]">
                  <h3 className="m-0 text-[14px] font-extrabold text-[#1c2a4a]">
                    Take part in this conference
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-[#7c879c]">
                    Register to attend the conference, or
                    submit a proposal if you are participating
                    as an Author.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={
                        registering ||
                        authStatus === "initializing"
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_28px_rgba(103,87,245,.28)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {registering ? (
                        <>
                          <LoaderCircle
                            size={15}
                            className="animate-spin"
                          />
                          Registering...
                        </>
                      ) : registered ? (
                        <>
                          <CheckCircle2 size={15} />
                          View registration
                        </>
                      ) : authStatus ===
                        "authenticated" ? (
                        <>
                          <Ticket size={15} />
                          Register to attend
                        </>
                      ) : (
                        <>
                          <Ticket size={15} />
                          Log in to register
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitProposal}
                      disabled={
                        authStatus === "initializing" ||
                        (isAuthor &&
                          proposalClosed)
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 text-[12px] font-extrabold text-[#43506a] transition hover:-translate-y-px hover:border-[#8175ef] hover:text-[#4f46c7] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText size={15} />

                      {authStatus !== "authenticated"
                        ? "Log in to submit proposal"
                        : !isAuthor
                          ? "Author account required"
                          : proposalClosed
                            ? "Submissions closed"
                            : "Submit a proposal"}
                    </button>
                  </div>

                  {registerError && (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700"
                    >
                      <AlertCircle
                        size={12}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {registerError}
                      </span>
                    </div>
                  )}

                  {actionMessage && (
                    <div
                      role="status"
                      className="mt-3 rounded-xl border border-[#cfd7f7] bg-[#f5f6ff] px-3 py-2 text-[10px] font-semibold leading-5 text-[#5146c7]"
                    >
                      {actionMessage}
                    </div>
                  )}

                  {registered && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/my-conferences")
                      }
                      className="mt-3 w-full border-0 bg-transparent p-0 text-[10px] font-extrabold text-[#18794e] hover:underline"
                    >
                      Open My Conferences
                    </button>
                  )}
                </article>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-[#edf0f5] bg-[#fafbfe] p-3">
      <dt className="m-0 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#9ba4b5]">
        {label}
      </dt>

      <dd className="m-0 mt-1 text-[12px] font-semibold text-[#1c2a4a]">
        {value}
      </dd>
    </div>
  );
}