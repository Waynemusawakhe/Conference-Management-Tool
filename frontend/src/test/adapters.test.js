import { it, expect, vi } from "vitest";
import { registrationsApi } from "../api/registrationsApi";
import { contactMessagesApi } from "../api/contactMessagesApi";
import { sessionsApi } from "../api/sessionsApi";
import { http } from "../api/client";
vi.mock("../api/client", () => ({ http: { get: vi.fn(), post: vi.fn() } }));
it.each([
  [registrationsApi, "/registrations"],
  [contactMessagesApi, "/contact-messages"],
])("forwards list parameters", (api, path) => {
  const params = { page: 2, per_page: 25, status: "new" };
  api.getAll(params);
  expect(http.get).toHaveBeenCalledWith(path, { params });
});
it("sends scheduled_time when creating sessions", () => {
  const payload = {
    conference_id: 21,
    title: "Opening",
    scheduled_time: "2026-12-01T09:00",
  };
  sessionsApi.create(payload);
  expect(http.post).toHaveBeenCalledWith("/sessions", payload);
});
