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
