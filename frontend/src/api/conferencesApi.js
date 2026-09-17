import { http } from "./client";

export const conferencesApi = {
  getAll: (params = {}) =>
    http.get("/conferences", { params }),

  getById: (id) =>
    http.get(`/conferences/${encodeURIComponent(id)}`),

  create: (body) =>
    http.post("/conferences", body),

  update: (id, body) =>
    http.put(`/conferences/${encodeURIComponent(id)}`, body),

  remove: (id) =>
    http.delete(`/conferences/${encodeURIComponent(id)}`),

  updateStatus: (id, status) =>
    http.patch(
      `/conferences/${encodeURIComponent(id)}/status`,
      { status }
    ),

  getSubmissions: (id) =>
    http.get(
      `/conferences/${encodeURIComponent(id)}/submissions`
    ),

  getRegistrations: (id) =>
    http.get(
      `/conferences/${encodeURIComponent(id)}/registrations`
    ),

  getSessions: (id) =>
    http.get(
      `/conferences/${encodeURIComponent(id)}/sessions`
    ),
};
