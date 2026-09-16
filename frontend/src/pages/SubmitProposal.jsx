import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { submissionsApi } from "../api/submissionsApi";
import { conferencesApi } from "../api/conferencesApi";

function SubmitProposal() {
  const { conferenceId } = useParams();
  const navigate = useNavigate();

  const [conference, setConference] = useState(null);
  const [loadingConference, setLoadingConference] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConference() {
      setLoadingConference(true);
      setLoadError("");
      try {
        const data = await conferencesApi.getById(conferenceId);
        if (!cancelled) setConference(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "Couldn't load this conference.");
        }
      } finally {
        if (!cancelled) setLoadingConference(false);
      }
    }

    loadConference();
    return () => { cancelled = true; };
  }, [conferenceId]);


  const trackOptions = conference?.tracks || conference?.topics || [];

  const [formData, setFormData] = useState({
    title: "",
    track: "",
    abstract: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.track || !formData.abstract) {
      setError("Title, track, and abstract are required.");
      return;
    }

    setSubmitting(true);
    try {
     
        conference_id: conferenceId,
        title: formData.title,
        abstract: formData.abstract,
        track: formData.track, // unconfirmed — not in SubmissionApiTest.php
        file, // unconfirmed — no upload test exists yet
      });
      setSubmitted(true);
    } catch (err) {
      // Confirmed by SubmissionApiTest.php: invalid conference_id, or a
      // missing title/abstract, returns 422 with field-specific messages
      // in err.errors (per client.js's normalized error shape).
      if (err?.errors && Object.keys(err.errors).length > 0) {
        const firstField = Object.keys(err.errors)[0];
        const firstMessage = err.errors[firstField]?.[0] || err.errors[firstField];
        setError(firstMessage || err.message);
      } else {
        setError(
          err?.message ||
          "Something went wrong submitting your proposal. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Proposal Submitted</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your proposal status is now <strong>pending</strong>. You can track
            it any time from My Proposals.
          </p>
          <Link to="/author-dashboard" className="btn btn-primary auth-submit">
            Go to My Proposals
          </Link>
        </div>
      </div>
    );
  }

  if (loadingConference) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading conference details...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "560px" }}>
        <h1 className="auth-title">Submit a Proposal</h1>
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "-16px", marginBottom: "24px", fontSize: "13px" }}>
          For {conference?.shortTitle || conference?.name || `conference #${conferenceId}`}
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
              {trackOptions.length > 0 ? (
                trackOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
              accept=".pdf,.doc,.docx"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Proposal"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitProposal;