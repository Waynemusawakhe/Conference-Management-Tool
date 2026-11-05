import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/authContextInstance";
import Conferences from "../pages/Conferences";
import AuthorDashboard from "../pages/AuthorDashboard";
import RoleChrome from "../components/RoleChrome";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { submissionsApi } from "../api/submissionsApi";

vi.mock("../components/Navbar", () => ({ default: () => null }));
vi.mock("../components/NotificationBell", () => ({ default: () => null }));
vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ dark: false, toggleTheme: vi.fn() }),
}));
vi.mock("../api/conferencesApi", () => ({ conferencesApi: { getAll: vi.fn() } }));
vi.mock("../api/registrationsApi", () => ({ registrationsApi: { getAll: vi.fn() } }));
vi.mock("../api/submissionsApi", () => ({ submissionsApi: { getAll: vi.fn(), remove: vi.fn(), withdraw: vi.fn() } }));

const mount = (node, path = "/") => render(
  <AuthContext.Provider value={{ user: { id: 7, name: "Author", role: "author" }, role: "author", status: "authenticated", logout: vi.fn() }}>
    <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
  </AuthContext.Provider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  conferencesApi.getAll.mockResolvedValue({ data: [], meta: { last_page: 1, total: 0 } });
  registrationsApi.getAll.mockResolvedValue({ data: [], last_page: 1 });
  submissionsApi.getAll.mockResolvedValue({ data: [] });
});

describe("catalogue server search results", () => {
  it.each([
    { field: "topics", match: { topics: ["quantum"] } },
    { field: "description", match: { description: "quantum research" } },
    { field: "venue", match: { venue_name: "Quantum Centre" } },
    { field: "country", match: { country: "Quantum Islands" } },
  ])("keeps a conference matching only its $field", async ({ match }) => {
    conferencesApi.getAll.mockResolvedValue({
      data: [{ id: 21, name: "Research Summit", category: "Science", start_date: "2099-06-01", end_date: "2099-06-02", submission_status: "open", ...match }],
      meta: { last_page: 1, total: 1 },
    });
    mount(<Conferences />, "/conferences?search=quantum");
    await waitFor(() => expect(conferencesApi.getAll).toHaveBeenCalledWith(expect.objectContaining({ search: "quantum" })));
    expect(await screen.findByRole("heading", { name: "Research Summit" })).toBeInTheDocument();
  });

  it("names the catalogue controls for keyboard and assistive technology users", () => {
    mount(<Conferences />);
    for (const name of ["Category", "Status", "Format", "Sort by"]) {
      expect(screen.getByRole("combobox", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("textbox", { name: "Search conferences" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grid view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List view" })).toBeInTheDocument();
  });
});

describe("author submission permissions", () => {
  it.each(["pending", "under_review", "accepted", "rejected", "revision_requested", "withdrawn"])(
    "matches backend mutation permissions for %s submissions on desktop and mobile", async (status) => {
      submissionsApi.getAll.mockResolvedValue({ data: [{ id: 1, title: "Example proposal", status }] });
      mount(<AuthorDashboard />);
      await screen.findAllByText("Example proposal");
      const row = screen.getByRole("row", { name: /Example proposal/ });
      const mobile = screen.getAllByText("Example proposal").find((node) => node.closest("article"))?.closest("article");
      expect(mobile).toBeTruthy();
      for (const action of ["Edit", "Delete", "Withdraw"]) {
        if (status === "pending") {
          expect(within(row).getByTitle(action)).toBeInTheDocument();
          expect(within(mobile).getByRole("button", { name: action })).toBeInTheDocument();
        } else {
          expect(within(row).queryByTitle(action)).not.toBeInTheDocument();
          expect(within(mobile).queryByRole("button", { name: action })).not.toBeInTheDocument();
        }
      }
      if (status !== "withdrawn") {
        fireEvent.click(within(row).getByTitle("View"));
        if (status === "pending") {
          expect(screen.getByRole("button", { name: "Edit proposal" })).toBeInTheDocument();
        } else {
          expect(screen.queryByRole("button", { name: "Edit proposal" })).not.toBeInTheDocument();
        }
      }
    },
  );
});

it("does not send authors to an unimplemented feedback page", () => {
  mount(<RoleChrome><p>Author page</p></RoleChrome>, "/profile");
  expect(screen.queryByRole("link", { name: "Feedback" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse conferences" })).toHaveAttribute("href", "/author/conferences");
});
