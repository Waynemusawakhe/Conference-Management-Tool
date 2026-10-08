import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContextInstance";
import ConferenceCard from "../components/ConferenceCard";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import SubmitProposal from "../pages/SubmitProposal";
import Conferences from "../pages/Conferences";
import MyConferences from "../pages/MyConferences";
import ScoreSubmission from "../pages/ScoreSubmission";
import Settings from "../pages/Settings";
import Home from "../pages/Home";
import { safeReturnPath } from "../utils/navigation";
import { collectPages } from "../utils/pagination";
import { conferencesApi } from "../api/conferencesApi";
import { registrationsApi } from "../api/registrationsApi";
import { contactMessagesApi } from "../api/contactMessagesApi";
import { submissionsApi } from "../api/submissionsApi";
import { reviewsApi } from "../api/reviewsApi";

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ dark: false, toggleTheme: vi.fn() }),
}));
vi.mock("../components/ReviewerLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../components/Navbar", () => ({ default: () => null }));
vi.mock("../components/RoleChrome", () => ({
  default: ({ children }) => <div data-testid="role-chrome">{children}</div>,
}));
vi.mock("../api/conferencesApi", () => ({
  conferencesApi: { getAll: vi.fn(), getById: vi.fn() },
}));
vi.mock("../api/registrationsApi", () => ({
  registrationsApi: { getAll: vi.fn(), create: vi.fn() },
}));
vi.mock("../api/submissionsApi", () => ({
  submissionsApi: { getAll: vi.fn(), create: vi.fn() },
}));
vi.mock("../api/reviewsApi", () => ({
  reviewsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    submit: vi.fn(),
    lock: vi.fn(),
  },
}));

const conference = {
  id: 21,
  name: "Research Summit",
  submission_status: "open",
  format: "virtual",
};
const auth = (role = "author", extra = {}) => ({
  user: { id: 7, role },
  role,
  status: "authenticated",
  logout: vi.fn(),
  ...extra,
});
const wrapper = (component, value = auth(), entries = ["/"]) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={entries}>{component}</MemoryRouter>
    </AuthContext.Provider>,
  );
function Location() {
  const location = useLocation();
  return (
    <p data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </p>
  );
}
beforeEach(() => {
  conferencesApi.getAll.mockResolvedValue({
    data: [conference],
    meta: { current_page: 1, last_page: 1, total: 1 },
  });
  conferencesApi.getById.mockResolvedValue({ data: conference });
  registrationsApi.getAll.mockResolvedValue({ data: [], last_page: 1 });
  submissionsApi.getAll.mockResolvedValue({ data: [], last_page: 1 });
  reviewsApi.getAll.mockResolvedValue({ data: [], last_page: 1 });
});

describe("role and navigation contracts", () => {
  it.each(["attendee", "reviewer", "organiser", "admin", null])(
    "hides proposals for %s",
    (role) => {
      wrapper(<ConferenceCard conference={conference} />, auth(role));
      expect(
        screen.queryByRole("button", { name: /Submit a proposal/ }),
      ).not.toBeInTheDocument();
    },
  );
  it("shows conference details action and readable API labels for authors", () => {
    wrapper(<ConferenceCard conference={conference} />);

    expect(
      screen.getByRole("button", {
        name: /View conference details/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Online")).toBeInTheDocument();

    expect(
      screen.getByText("Open for submissions"),
    ).toBeInTheDocument();
  });
  it("redirects an organiser away from author/admin edit content", () => {
    wrapper(
      <>
        <ProtectedRoute roles={["author", "admin"]}>
          <p>Edit content</p>
        </ProtectedRoute>
        <Location />
      </>,
      auth("organiser"),
    );
    expect(screen.queryByText("Edit content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/organiser-dashboard",
    );
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil",
    "/login",
    "/register?next=x",
    "/\nevil",
  ])("rejects unsafe return path %s", (path) =>
    expect(safeReturnPath(path)).toBeNull(),
  );
  it("restores the requested route after login", async () => {
    const login = vi.fn().mockResolvedValue({ user: { role: "author" } });
    wrapper(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Location />} />
      </Routes>,
      auth("author", { login }),
      [
        {
          pathname: "/login",
          state: { from: "/my-conferences?tab=submitted#list" },
        },
      ],
    );
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "author@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/my-conferences?tab=submitted#list",
      ),
    );
  });
});

describe("catalogue and relationship contracts", () => {
  it("sends search, status, format and sorting to the API", async () => {
    wrapper(<Conferences />, auth(null, { status: "anonymous" }), [
      "/conferences?search=quantum",
    ]);
    await waitFor(() =>
      expect(conferencesApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "quantum",
          sort: "deadline",
          page: 1,
        }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "open" },
    });
    fireEvent.change(screen.getByLabelText("Format"), {
      target: { value: "virtual" },
    });
    await waitFor(() =>
      expect(conferencesApi.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
          submission_status: "open",
          format: "virtual",
          page: 1,
        }),
      ),
    );
  });
  it("loads relationships beyond the first page and deduplicates conferences", async () => {
    registrationsApi.getAll.mockImplementation(({ page }) =>
      Promise.resolve({
        data:
          page === 1
            ? [
                {
                  id: 1,
                  user_id: 7,
                  conference_id: 21,
                  conference,
                  status: "confirmed",
                },
              ]
            : [
                {
                  id: 2,
                  user_id: 7,
                  conference_id: 22,
                  conference: { id: 22, name: "Second page event" },
                  status: "cancelled",
                },
              ],
        last_page: 2,
      }),
    );
    submissionsApi.getAll.mockResolvedValue({
      data: [
        {
          id: 4,
          author_id: 7,
          conference_id: 21,
          conference,
          status: "pending",
        },
      ],
      last_page: 1,
    });
    wrapper(<MyConferences />);
    await screen.findByText("Second page event");
    expect(screen.getAllByText("Research Summit")).toHaveLength(1);
    expect(
      screen.getByText(/Attending \(Confirmed\).*Submitted \(Pending\)/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("role-chrome")).toBeInTheDocument();
    expect(registrationsApi.getAll).toHaveBeenCalledWith({
      page: 2,
      per_page: 100,
      user_id: 7,
    });
  });
  it("shows only the current organiser's conferences", async () => {
    conferencesApi.getAll.mockResolvedValue({
      data: [
        { ...conference, organiser_id: 7 },
        { id: 22, name: "Other organiser", organiser_id: 8 },
      ],
      meta: { last_page: 1 },
    });
    wrapper(<MyConferences />, auth("organiser"));
    await screen.findByText("Research Summit");
    expect(screen.getByText("Organising")).toBeInTheDocument();
    expect(screen.queryByText("Other organiser")).not.toBeInTheDocument();
  });
  it("resolves conference details for reviewer assignments", async () => {
    reviewsApi.getAll.mockResolvedValue({
      data: [{ id: 4, reviewer_id: 7, submission: { conference_id: 21 } }],
      meta: { last_page: 1 },
    });
    wrapper(<MyConferences />, auth("reviewer"));
    await screen.findByText("Research Summit");
    expect(screen.getByText("Reviewing")).toBeInTheDocument();
    expect(conferencesApi.getById).toHaveBeenCalledWith(21);
  });
  it("shows an API error and supports retry on Home", async () => {
    conferencesApi.getAll.mockRejectedValueOnce(
      new Error("Server unavailable"),
    );
    wrapper(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server unavailable",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("Research Summit");
  });
  it("normalizes nested and direct pagination", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [1], last_page: 2 } })
      .mockResolvedValueOnce({ data: [2], meta: { last_page: 2 } });
    expect(await collectPages(load)).toEqual([1, 2]);
  });
});

describe("proposal uploads", () => {
  it.each([
    ["paper.pdf", "application/pdf"],
    ["paper.doc", "application/msword"],
    [
      "paper.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ])("accepts %s", async (name, type) => {
    wrapper(
      <Routes>
        <Route
          path="/submit-proposal/:conferenceId"
          element={<SubmitProposal />}
        />
      </Routes>,
      auth(),
      ["/submit-proposal/21"],
    );
    const input = await waitFor(() => {
      const el = document.querySelector('input[type="file"]');
      expect(el).not.toBeNull();
      return el;
    });
    fireEvent.change(input, {
      target: { files: [new File(["content"], name, { type })] },
    });
    expect(
      screen.queryByText("Only PDF, DOC, or DOCX files are allowed."),
    ).not.toBeInTheDocument();
    expect(screen.getByText(name)).toBeInTheDocument();
  });
  it("submits a DOCX file with the multipart proposal fields", async () => {
    conferencesApi.getById.mockResolvedValue({
      data: { ...conference, topics: ["AI"] },
    });
    wrapper(
      <Routes>
        <Route
          path="/submit-proposal/:conferenceId"
          element={<SubmitProposal />}
        />
      </Routes>,
      auth(),
      ["/submit-proposal/21"],
    );
    const title = await screen.findByLabelText("Title");
    fireEvent.change(title, { target: { value: "Paper title" } });
    fireEvent.change(screen.getByLabelText("Track"), {
      target: { value: "AI" },
    });
    fireEvent.change(screen.getByLabelText("Abstract"), {
      target: { value: "An abstract for this paper." },
    });
    const file = new File(["content"], "paper.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(screen.getByLabelText("Attach File (optional)"), {
      target: { files: [file] },
    });
    fireEvent.submit(title.closest("form"));
    await screen.findByText("Proposal Submitted");
    const payload = submissionsApi.create.mock.calls[0][0];
    expect(payload.get("conference_id")).toBe("21");
    expect(payload.get("title")).toBe("Paper title");
    expect(payload.get("track")).toBe("AI");
    expect(payload.get("file").name).toBe("paper.docx");
  });
  it("rejects a file larger than 10 MB", async () => {
    wrapper(
      <Routes>
        <Route
          path="/submit-proposal/:conferenceId"
          element={<SubmitProposal />}
        />
      </Routes>,
      auth(),
      ["/submit-proposal/21"],
    );
    const input = await screen.findByLabelText("Attach File (optional)");
    const file = new File(["content"], "paper.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      screen.getByText("The file must be 10MB or smaller."),
    ).toBeInTheDocument();
  });
  it("rejects unsupported files", async () => {
    wrapper(
      <Routes>
        <Route
          path="/submit-proposal/:conferenceId"
          element={<SubmitProposal />}
        />
      </Routes>,
      auth(),
      ["/submit-proposal/21"],
    );
    const input = await waitFor(() => {
      const el = document.querySelector('input[type="file"]');
      expect(el).not.toBeNull();
      return el;
    });
    fireEvent.change(input, {
      target: {
        files: [
          new File(["content"], "script.exe", {
            type: "application/octet-stream",
          }),
        ],
      },
    });
    expect(
      screen.getByText("Only PDF, DOC, or DOCX files are allowed."),
    ).toBeInTheDocument();
  });
});

describe("review lifecycle and account settings", () => {
  it("permits editing submitted reviews on the agreed 1–5 scale until lock", async () => {
    reviewsApi.getById.mockResolvedValue({
      data: {
        id: 8,
        score: 3,
        comments: "Good research",
        recommendation: "accept",
        submitted_at: "2026-10-06",
        locked: false,
        submission: { title: "Review paper" },
      },
    });
    wrapper(
      <Routes>
        <Route path="/reviewer/evaluate/:id" element={<ScoreSubmission />} />
      </Routes>,
      auth("reviewer"),
      ["/reviewer/evaluate/8"],
    );
    const update = await screen.findByRole("button", { name: "Update review" });
    expect(update).toBeDisabled();
    expect(
      screen.getByText("Score — 1 Poor to 5 Excellent"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /5 Excellent/ }));
    expect(update).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lock review" })).toBeEnabled();
  });
  it("disables evaluation controls after locking", async () => {
    reviewsApi.getById.mockResolvedValue({
      data: {
        id: 8,
        score: 3,
        comments: "Good research",
        recommendation: "accept",
        submitted_at: "2026-10-06",
        locked: true,
        submission: { title: "Review paper" },
      },
    });
    wrapper(
      <Routes>
        <Route path="/reviewer/evaluate/:id" element={<ScoreSubmission />} />
      </Routes>,
      auth("reviewer"),
      ["/reviewer/evaluate/8"],
    );
    expect(
      await screen.findByRole("button", { name: /5 Excellent/ }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Update review" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Lock review" }),
    ).not.toBeInTheDocument();
  });
  it("allows account deletion cancellation without entering a password", () => {
    wrapper(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: /Delete my account/ }));
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toBeEnabled();
    fireEvent.click(cancel);
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });
});
