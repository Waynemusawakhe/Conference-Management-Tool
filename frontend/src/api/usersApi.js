import { http } from "./client";

export const usersApi = {
  getAll: (params = {}) =>
    http.get("/users", { params }),

  getById: (id) =>
    http.get(`/users/${encodeURIComponent(id)}`),

  getReviewers: () =>
    http.get("/users/reviewers"),
  
  updateRole: (id, role) =>
    http.patch(`/users/${encodeURIComponent(id)}/role`, { role }),

};
