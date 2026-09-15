import { http } from "./client";

export const reviewsApi = {
  getAll: (params = {}) =>
    http.get("/reviews", { params }),

  pending: (params = {}) =>
    http.get("/reviews/pending", { params }),

  getById: (id) =>
    http.get(`/reviews/${encodeURIComponent(id)}`),

  assign: (body) =>
    http.post("/reviews", body),

  create: (body) =>
    http.post("/reviews", body),

  submit: (id, body) =>
    http.post(`/reviews/${encodeURIComponent(id)}/submit`, body),

  lock: (id) =>
    http.post(`/reviews/${encodeURIComponent(id)}/lock`, {}),

  remove: (id) =>
    http.delete(`/reviews/${encodeURIComponent(id)}`),
};