import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ScoreSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form State
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('accept');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dummy paper data (replace with API call later)
  const submission = {
    id: id,
    title: "Distributed Database Systems Optimization",
    abstract: "This paper explores query optimization strategies in distributed database management systems, analyzing latency and concurrency control performance across edge nodes.",
    fileUrl: "#"
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Logic to post score to backend goes here
    console.log({
      submissionId: id,
      score,
      comments,
      recommendation
    });

    setIsSubmitted(true);
    alert('Review submitted successfully!');
    navigate('/reviewer-dashboard');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Score Submission — #{id}</h2>

      {/* Read-Only Details */}
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#333' }}>
        <h3>{submission.title}</h3>
        <p><strong>Abstract:</strong> {submission.abstract}</p>
        <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0066cc' }}>
          📄 View Full Paper (PDF)
        </a>
      </div>

      {/* Reviewer Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label><strong>Score (1 to 5):</strong></label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setScore(num)}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: score === num ? '#007bff' : '#e0e0e0',
                  color: score === num ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="comments"><strong>Comments for Organiser:</strong></label>
          <textarea
            id="comments"
            rows="5"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
            style={{ width: '100%', marginTop: '5px', padding: '10px' }}
            placeholder="Provide feedback on the methodology, structure, and original contribution..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="recommendation"><strong>Recommendation:</strong></label>
          <select
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            style={{ width: '100%', marginTop: '5px', padding: '10px' }}
          >
            <option value="accept">Accept</option>
            <option value="revise">Revise</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitted}
          style={{
            backgroundColor: '#28a745',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Submit Final Review
        </button>
      </form>
    </div>
  );
}

