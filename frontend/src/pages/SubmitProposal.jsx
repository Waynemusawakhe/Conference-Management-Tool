// src/pages/SubmitProposal.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { submissionsApi } from "../api/submissionsApi";
import { conferencesApi } from "../api/conferencesApi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  const [conference, setConference] = useState(null);
  const [loadingConference, setLoadingConference] = useState(true);
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
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Proposal Submitted</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your proposal status is now <strong>pending</strong>. You can track
            it any time from My Proposals.
          </p>
          <Link
            to="/author-dashboard"
            className="btn btn-primary auth-submit"
          >
            Go to My Proposals
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Loading ---- */
  if (loadingConference) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading conference details...</p>
        </div>
      </div>
    );
  }

  /* ---- Load error ---- */
  if (loadError) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Couldn't load conference</h1>
          <p className="auth-error">{loadError}</p>
        </div>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="auth-page">
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
                trackOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
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

          {/* ---- File picker ---- */}
          <div className="form-group">
            <label htmlFor="file">Attach File (optional)</label>
            <input
              id="file"
              name="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <p
              style={{
                color: "var(--muted)",
                fontSize: "11px",
                marginTop: "6px",
                marginBottom: 0,
              }}
            >
              PDF, DOC, or DOCX · maximum 10MB
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
    </div>
  );
}

export default SubmitProposal;