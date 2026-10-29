import { conferencesApi } from "../api/conferencesApi";

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

export async function getAllConferences() {
  return unwrapList(await conferencesApi.getAll({ per_page: 100 }));
}

export async function getFeaturedConferences(limit = 3) {
  return (await getAllConferences()).slice(0, limit);
}

export async function searchConferences(query = "", filters = {}) {
  const data = await getAllConferences();
  const q = query.trim().toLowerCase();
  const category = (filters.category || "").toLowerCase();
  const country = (filters.country || "").toLowerCase();
  const status = (filters.status || "").toLowerCase();
  const format = (filters.format || "").toLowerCase();

  return data.filter((conference) => {
    const topics = Array.isArray(conference.topics) ? conference.topics : [];
    const haystack = [
      conference.name,
      conference.title,
      conference.shortTitle,
      conference.code,
      conference.acronym,
      conference.category,
      conference.location,
      conference.city,
      conference.country,
      conference.description,
      conference.status,
      conference.submission_status,
      conference.format,
      ...topics,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!q || haystack.includes(q)) &&
      (!category || String(conference.category || "").toLowerCase().includes(category)) &&
      (!country || String(conference.country || "").toLowerCase().includes(country)) &&
      (!status || String(conference.submission_status || conference.status || "").toLowerCase().includes(status)) &&
      (!format || String(conference.format || "").toLowerCase().includes(format))
    );
  });
}

export const reviewerService = {
  getPendingReviews: async () => {
    const response = await fetch("http://127.0.0.1:8000/api/v1/reviewer/pending", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
      },
    });
    const data = await response.json();
    return data.data;
  },

  approveReview: async (id, comments = "") => {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/reviewer/items/${id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ score: 10, comments, recommendation: "accept" }),
    });
    const data = await response.json();
    return data.data;
  },

  rejectReview: async (id, reason = "") => {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/reviewer/items/${id}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ score: 0, comments: reason, recommendation: "reject" }),
    });
    const data = await response.json();
    return data.data;
  },
};
