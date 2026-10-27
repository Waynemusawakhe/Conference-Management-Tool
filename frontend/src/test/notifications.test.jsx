import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationCentre from "../pages/NotificationCentre";
import { notificationsApi } from "../api/notificationsApi";

vi.mock("../components/RoleChrome", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../api/notificationsApi", () => ({
  notificationsApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const unreadNotification = {
  id: "notice-1",
  read_at: null,
  created_at: "2026-10-27T12:00:00Z",
  data: { title: "New proposal", message: "A paper was submitted." },
};

beforeEach(() => {
  vi.clearAllMocks();
  notificationsApi.list.mockResolvedValue({ data: [unreadNotification], unread_count: 1 });
  notificationsApi.unreadCount.mockResolvedValue({ unread_count: 1 });
});

it("marks one notification read only after the backend confirms it", async () => {
  notificationsApi.markRead.mockResolvedValue({
    data: { ...unreadNotification, read_at: "2026-10-27T12:05:00Z" },
  });

  render(<MemoryRouter><NotificationCentre /></MemoryRouter>);
  await screen.findByText("New proposal");
  fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

  await screen.findByText("Read");
  expect(screen.getByText((_, element) => element.tagName === "P" && /0\s*unread notification/.test(element.textContent))).toBeInTheDocument();
  expect(notificationsApi.markRead).toHaveBeenCalledWith("notice-1");
});

it("preserves unread state and reports a mark-read failure", async () => {
  notificationsApi.markRead.mockRejectedValue(new Error("Request failed"));

  render(<MemoryRouter><NotificationCentre /></MemoryRouter>);
  await screen.findByText("New proposal");
  fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed");
  expect(screen.getByText((_, element) => element.tagName === "P" && /1\s*unread notification/.test(element.textContent))).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument();
});

it("marks every listed notification read after mark-all succeeds", async () => {
  notificationsApi.markAllRead.mockResolvedValue({ success: true });

  render(<MemoryRouter><NotificationCentre /></MemoryRouter>);
  await screen.findByText("New proposal");
  fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

  await waitFor(() => expect(notificationsApi.markAllRead).toHaveBeenCalled());
  expect(screen.getByText((_, element) => element.tagName === "P" && /0\s*unread notification/.test(element.textContent))).toBeInTheDocument();
  expect(screen.getByText("Read")).toBeInTheDocument();
});

it("keeps unread state and reports a mark-all failure", async () => {
  notificationsApi.markAllRead.mockRejectedValue(new Error("Server unavailable"));

  render(<MemoryRouter><NotificationCentre /></MemoryRouter>);
  await screen.findByText("New proposal");
  fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
  expect(screen.getByText((_, element) => element.tagName === "P" && /1\s*unread notification/.test(element.textContent))).toBeInTheDocument();
});