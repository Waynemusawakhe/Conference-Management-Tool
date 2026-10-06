import { http } from "./client";

export const registrationsApi = {
  getAll: (params = {}) =>
    http.get("/registrations", {
      params,
    }),

  getById: (id) =>
    http.get(
      `/registrations/${encodeURIComponent(id)}`
    ),

  create: (body) =>
    http.post(
      "/registrations",
      body
    ),

  update: (id, body) =>
    http.put(
      `/registrations/${encodeURIComponent(id)}`,
      body
    ),

  remove: (id) =>
    http.delete(
      `/registrations/${encodeURIComponent(id)}`
    ),
};