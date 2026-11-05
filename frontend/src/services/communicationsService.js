import { http } from "../api/client";

// Frontend service boundary for the communications REST endpoints.
// Align these endpoint contracts with the backend when those routes are ready.
export const communicationsService = {
  getTemplates: (params = {}) => http.get("/communications/templates", { params }),
  createTemplate: (payload) => http.post("/communications/templates", payload),
  updateTemplate: (id, payload) => http.put(`/communications/templates/${encodeURIComponent(id)}`, payload),
  deleteTemplate: (id) => http.delete(`/communications/templates/${encodeURIComponent(id)}`),
  getUsers: (params = {}) => http.get("/communications/users", { params }),
  getHistory: (params = {}) => http.get("/communications/messages", { params }),
  sendMessage: (payload) => http.post("/communications/messages", payload),
  sendTestMessage: (payload) => http.post("/communications/messages/test", payload),
  scheduleMessage: (payload) => http.post("/communications/messages/schedule", payload),
  saveDraft: (payload) => http.post("/communications/messages/drafts", payload),
};
