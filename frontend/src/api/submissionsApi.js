<<<<<<< HEAD
import { http } from './client';

export const submissionsApi = {
  getAll: () => http.get('/v1/submissions'),
  getById: (id) => http.get(`/v1/submissions/${id}`),
  create: (body) => http.post('/v1/submissions', body),
  update: (id, body) => http.put(`/v1/submissions/${id}`, body),
  remove: (id) => http.delete(`/v1/submissions/${id}`),
  withdraw: (id) => http.post(`/v1/submissions/${id}/withdraw`, {}),
  updateStatus: (id, body) => http.patch(`/v1/submissions/${id}/status`, body),
};
=======
import { http } from "./client";

export const submissionsApi = {
  getAll: (params = {}) =>
    http.get("/submissions", { params }),

  getById: (id) =>
    http.get(`/submissions/${encodeURIComponent(id)}`),

  create: (body) =>
    http.post("/submissions", body),

  update: (id, body) => {
    if (
      typeof FormData !== "undefined" &&
      body instanceof FormData
    ) {
      body.append("_method", "PUT");

      return http.post(
        `/submissions/${encodeURIComponent(id)}`,
        body
      );
    }

    return http.put(
      `/submissions/${encodeURIComponent(id)}`,
      body
    );
  },

  remove: (id) =>
    http.delete(`/submissions/${encodeURIComponent(id)}`),

  withdraw: (id) =>
    http.post(
      `/submissions/${encodeURIComponent(id)}/withdraw`,
      {}
    ),

  updateStatus: (id, status) =>
    http.patch(
      `/submissions/${encodeURIComponent(id)}/status`,
      { status }
    ),
};
>>>>>>> origin/main
