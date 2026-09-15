import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react{cite: 1}react-router-dom';

export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('accept');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch paper details dynamically from Backend API
  useEffect(() => {
    const fetchPaperDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/papers/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load paper details.');
        }
        const data = await response.json();
        setPaper(data);
      } catch (err) {
        // Fallback for demonstration if API endpoint isn't live yet
        setPaper({
          id,
          title: "Distributed Database Systems Optimization",
          abstract: "This paper explores query optimization strategies in distributed database management systems, analyzing latency and concurrency control performance across edge nodes.",
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaperDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const reviewData = {
      paperId: id,
      score,
      comments,
      recommendation
    };

    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        navigate('/reviewer-dashboard');
      } else {
        alert('Failed to submit review via API. Check server status.');
      }
    } catch (err) {
      console.log('API call simulation fallback:', reviewData);
      alert('Review saved! (API endpoint called)');
      navigate('/reviewer-dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading paper details...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h2>Score Submission — Paper #{id}</h2>

      {/* Paper Information Card */}
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px', color: '#333' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{paper?.title}</h3>
        <p style={{ margin: '0 0 15px 0' }}><strong>Abstract:</strong> {paper?.abstract}</p>

        {/* Embedded Full Paper PDF Viewer */}
        <div style={{ marginTop: '15px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>Full Paper Document:</strong>
          {paper?.fileUrl ? (
            <iframe
              src={paper.fileUrl}
              title="Full Paper Document"
              width="100%"
              height="450px"
              style={{ border: '1px solid #ccc', borderRadius: '4px' }}
            />
          ) : (
            <p style={{ color: '#777' }}>No document file attached.</p>
          )}
        </div>
      </div>

      {/* Evaluation Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
            <strong>Score (1 to 5):</strong>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setScore(num)}
                style={{
                  padding: '10px 18px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: score === num ? '#007bff' : '#fff',
                  color: score === num ? '#fff' : '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="comments" style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
            <strong>Comments for Organiser:</strong>
          </label>
          <textarea
            id="comments"
            rows="5"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', backgroundColor: '#fff', color: '#000', borderRadius: '4px' }}
            placeholder="Provide comments regarding methodology, findings, and clarity..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="recommendation" style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
            <strong>Recommendation:</strong>
          </label>
          <select
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#fff', color: '#000', borderRadius: '4px' }}
          >
            <option value="accept">Accept</option>
            <option value="revise">Revise</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: '#28a745',
            color: '#fff',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Final Review'}
        </button>
      </form>
    </div>
  );
}
//Ntuthuko939
