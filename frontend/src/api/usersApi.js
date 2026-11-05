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

  update: (id, body) =>
    http.patch(`/users/${encodeURIComponent(id)}`, body),

  sendPasswordResetEmail: (id) =>
    http.post(`/users/${encodeURIComponent(id)}/reset-password`),

  updateAccountStatus: (id, accountStatus, reason = "") =>
    http.patch(
      `/users/${encodeURIComponent(id)}/account-status`,
      {
        account_status: accountStatus,
        reason: reason || null,
      }
    ),

  archive: (id) =>
    http.delete(`/users/${encodeURIComponent(id)}`),
};