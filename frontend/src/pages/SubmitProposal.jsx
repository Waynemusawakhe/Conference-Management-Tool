import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, FilePlus2, MapPin } from "lucide-react";
import { submissionsApi } from "../api/submissionsApi";
import { conferencesApi } from "../api/conferencesApi";
import AttendeeHeader from "../components/AttendeeHeader";
import AttendeeSidebar from "../components/AttendeeSidebar";
import { useAuth } from "../context/AuthContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf"];
const ALLOWED_MIME_TYPES = ["application/pdf"];

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function validateFile(file) {
  if (!file) return null;
  const ext = String(file.name).toLowerCase().split(".").pop();
  const typeOk =
    ALLOWED_MIME_TYPES.includes(file.type) ||
    ALLOWED_EXTENSIONS.includes(ext);
  if (!typeOk) {
    return "Only PDF, DOC, or DOCX files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "The file must be 10MB or smaller.";
  }
  return null;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function SubmitProposal() {
  const { conferenceId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const isAttendee = role === "attendee";
  const [conference, setConference] = useState(null);
  const [loadingConference, setLoadingConference] = useState(true);
  const [availableConferences, setAvailableConferences] = useState([]);
  const [loadingConferences, setLoadingConferences] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectionPage, setSelectionPage] = useState(1);
  const [hasMoreConferences, setHasMoreConferences] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    track: "",
    abstract: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ---- Load conference ---- */
  useEffect(() => {
    let cancelled = false;

    if (!conferenceId) {
      setConference(null);
      setLoadingConference(false);
      setLoadingConferences(true);
      setLoadError("");

      conferencesApi
        .getAll({ page: 1, per_page: 12 })
        .then((response) => {
          if (cancelled) return;
          setAvailableConferences(unwrapList(response));
          setSelectionPage(1);
          setHasMoreConferences(
            Number(response?.meta?.last_page ?? 1) > 1
          );
        })
        .catch((err) => {
          if (!cancelled) {
            setLoadError(err?.message || "Couldn't load conferences.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingConferences(false);
        });

      return () => {
        cancelled = true;
      };
    }

    async function loadConference() {
      setLoadingConference(true);
      setLoadError("");
      try {
        const response = await conferencesApi.getById(conferenceId);
        const data = response?.data ?? response;
        const conf = data?.data ?? data ?? null;
        if (!cancelled) setConference(conf);
      } catch (err) {
        if (!cancelled)
          setLoadError(err?.message || "Couldn't load this conference.");
      } finally {
        if (!cancelled) setLoadingConference(false);
      }
    }
    loadConference();
    return () => {
      cancelled = true;
    };
  }, [conferenceId]);

  const loadMoreConferences = async () => {
    const nextPage = selectionPage + 1;
    setLoadingMore(true);
    setLoadError("");

    try {
      const response = await conferencesApi.getAll({
        page: nextPage,
        per_page: 12,
      });
      setAvailableConferences((current) => [
        ...current,
        ...unwrapList(response),
      ]);
      setSelectionPage(nextPage);
      setHasMoreConferences(
        nextPage < Number(response?.meta?.last_page ?? nextPage)
      );
    } catch (err) {
      setLoadError(err?.message || "Couldn't load more conferences.");
    } finally {
      setLoadingMore(false);
    }
  };

  const renderPage = (content) => {
    if (!isAttendee) {
      return <div className="auth-page">{content}</div>;
    }

    return (
      <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
        <AttendeeHeader
          name={user?.name || user?.full_name || "Attendee"}
          menuOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((value) => !value)}
        />
        <div className="mx-auto flex w-[min(1400px,calc(100%-32px))] gap-6 py-6 lg:gap-7">
          <AttendeeSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="min-w-0 flex-1 py-2 sm:py-4">{content}</main>
        </div>
      </div>
    );
  };

  const trackOptions =
    conference?.tracks ?? conference?.topics ?? conference?.track_options ?? [];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ---- File picker ---- */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setError("");
      return;
    }
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    const input = document.getElementById("file");
    if (input) input.value = "";
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.track.trim() || !formData.abstract.trim()) {
      setError("Title, track, and abstract are required.");
      return;
    }
    if (file) {
      const fileError = validateFile(file);
      if (fileError) {
        setError(fileError);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Use FormData so the file is uploaded as multipart/form-data.
      // Axios automatically sets the Content-Type + boundary.
      const payload = new FormData();
      payload.append("conference_id", String(conferenceId));
      payload.append("title", formData.title.trim());
      payload.append("track", formData.track.trim());
      payload.append("abstract", formData.abstract.trim());
      // status is set to "pending" by the backend on creation
      if (file) payload.append("file", file);

      await submissionsApi.create(payload);
      setSubmitted(true);
    } catch (err) {
      const status = err?.status ?? err?.response?.status ?? null;
      let message =
        err?.message ||
        err?.response?.data?.message ||
        "Something went wrong submitting your proposal. Please try again.";

      if (status === 422 && err?.errors) {
        const first = Object.values(err.errors).flat()[0];
        if (first) message = first;
      } else if (status === 401) {
        message = "Your session expired. Please log in again.";
      } else if (status === 413) {
        message = "The file is too large for the server to accept.";
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Submitted state ---- */
  if (submitted) {
    return renderPage(
      <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Proposal Submitted</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your proposal status is now <strong>pending</strong>.{" "}
            {isAttendee
              ? "The conference organisers can now review your proposal."
              : "You can track it any time from My Proposals."}
          </p>
          <Link
            to={isAttendee ? "/attendee-dashboard" : "/author-dashboard"}
            className="btn btn-primary auth-submit"
          >
            {isAttendee ? "Back to attendee dashboard" : "Go to My Proposals"}
          </Link>
        </div>
    );
  }

  if (!conferenceId) {
    if (loadingConferences) {
      return renderPage(
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading conferences...</p>
        </div>
      );
    }

    return renderPage(
      <section className="mx-auto w-full max-w-3xl rounded-[18px] border border-[#e4e8f0] bg-white p-5 shadow-sm sm:p-7">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#6655f6]">
          <FilePlus2 size={15} /> Proposal submission
        </span>
        <h1 className="mb-2 mt-2 text-2xl font-bold text-[#0d1b3d]">
          Choose a conference
        </h1>
        <p className="mb-6 text-xs leading-5 text-[#788398]">
          Select a conference to prepare and submit your proposal.
        </p>

        {loadError && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {loadError}
          </div>
        )}

        {availableConferences.length ? (
          <div className="divide-y divide-[#edf0f5] rounded-xl border border-[#edf0f5]">
            {availableConferences.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-sm font-bold text-[#1c2a4a]">
                    {item.name || item.title || "Untitled conference"}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#8993a6]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} />
                      {item.start_date || "Date TBA"}
                    </span>
                    {(item.city || item.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {[item.city, item.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/submit-proposal/${item.id}`)}
                  className="shrink-0 rounded-lg bg-[#efedff] px-3 py-2 text-[10px] font-extrabold text-[#5548d7] hover:bg-[#e4e1ff]"
                >
                  Select conference
                </button>
              </article>
            ))}
          </div>
        ) : !loadError ? (
          <p className="rounded-xl border border-dashed border-[#dfe4ed] p-8 text-center text-xs text-[#788398]">
            No conferences are available yet.
          </p>
        ) : null}

        {hasMoreConferences && (
          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={loadMoreConferences}
              className="rounded-lg border border-[#dfe4ed] px-4 py-2.5 text-[10px] font-extrabold text-[#5548d7] disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more conferences"}
            </button>
          </div>
        )}
      </section>
    );
  }

  /* ---- Loading ---- */
  if (loadingConference) {
    return renderPage(
      <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading conference details...</p>
        </div>
    );
  }

  /* ---- Load error ---- */
  if (loadError) {
    return renderPage(
      <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Couldn't load conference</h1>
          <p className="auth-error">{loadError}</p>
        </div>
    );
  }

  /* ---- Form ---- */
  return renderPage(
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <h1 className="auth-title">Submit a Proposal</h1>
      <p
        style={{
          textAlign: "center",
          color: "var(--muted)",
          marginTop: "-16px",
          marginBottom: "24px",
          fontSize: "13px",
        }}
      >
        For{" "}
        {conference?.shortTitle ||
          conference?.name ||
          `conference #${conferenceId}`}
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Your paper or talk title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="track">Track</label>
          <select
            id="track"
            name="track"
            value={formData.track}
            onChange={handleChange}
          >
            <option value="">Select a track</option>
            {trackOptions.length ? (
              trackOptions.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No tracks available for this conference
              </option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="abstract">Abstract</label>
          <textarea
            id="abstract"
            name="abstract"
            rows={6}
            value={formData.abstract}
            onChange={handleChange}
            placeholder="Summarize your work..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Attach File (optional)</label>
          <input
            id="file"
            name="file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
          />
          <p
            style={{
              color: "var(--muted)",
              fontSize: "11px",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            PDF, maximum 10MB
          </p>

          {file && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
                padding: "8px 12px",
                border: "1px solid var(--border, #e4e8f0)",
                borderRadius: "10px",
                background: "#fafbff",
                fontSize: "12px",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>{file.name}</strong>
                <span style={{ color: "var(--muted)" }}> · {formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#b13a3a",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Proposal"}
        </button>
      </form>
    </div>
  );
}

export default SubmitProposal;