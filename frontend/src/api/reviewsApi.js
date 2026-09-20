<<<<<<< HEAD
import { http } from './client';

export const reviewsApi = {
  getAll: (params) => http.get('/v1/reviews', { params }),
  pending: (params) => http.get('/v1/reviews/pending', { params }),
  getById: (id) => http.get(`/v1/reviews/${id}`),
  create: (body) => http.post('/v1/reviews', body),
  remove: (id) => http.delete(`/v1/reviews/${id}`),
  submit: (id, body) => http.post(`/v1/reviews/${id}/submit`, body),
  lock: (id) => http.post(`/v1/reviews/${id}/lock`, {}),
};
=======
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
>>>>>>> origin/main
