import React, { useState, useEffect } from 'react';
import { reviewerService } from '../services/conferenceService';

export default function ReviewerDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewerService.getPendingReviews()
      .then(data => setItems(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading reviewer queue...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Reviewer Dashboard</h1>
      {items.length === 0 ? (
        <p>No pending items to review.</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>{item.title || item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}//LINDOKUHLE418