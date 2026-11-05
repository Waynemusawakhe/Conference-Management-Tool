import { http } from "./client";

export const adminNotificationsApi = {
  listTemplates: (params = {}) =>
    http.get("/admin/notifications/templates", { params }),

  createTemplate: (payload) =>
    http.post("/admin/notifications/templates", payload),

  updateTemplate: (id, payload) =>
    http.put(`/admin/notifications/templates/${encodeURIComponent(id)}`, payload),

  deleteTemplate: (id) =>
    http.delete(`/admin/notifications/templates/${encodeURIComponent(id)}`),

  listHistory: (params = {}) =>
    http.get("/admin/notifications/history", { params }),

  send: (payload) =>
    http.post("/admin/notifications/send", payload),
};