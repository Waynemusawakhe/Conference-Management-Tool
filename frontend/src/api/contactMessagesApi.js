import { http } from "./client";

export const contactMessagesApi = {
  getAll: (params = {}) =>
    http.get(
      "/contact-messages",
      {
        params,
      }
    ),

  getById: (id) =>
    http.get(
      `/contact-messages/${encodeURIComponent(id)}`
    ),

  create: (body) =>
    http.post(
      "/contact-messages",
      body
    ),

  remove: (id) =>
    http.delete(
      `/contact-messages/${encodeURIComponent(id)}`
    ),

  updateStatus: (
    id,
    status
  ) =>
    http.patch(
      `/contact-messages/${encodeURIComponent(id)}/status`,
      {
        status,
      }
    ),
};