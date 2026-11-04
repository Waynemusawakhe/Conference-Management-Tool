import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../context/authContextInstance";
import ReviewerDashboard from "../pages/ReviewerDashboard";
import ScoreSubmission from "../pages/ScoreSubmission";
import { reviewsApi } from "../api/reviewsApi";

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ dark: false, toggleTheme: vi.fn() }),
}));
vi.mock("../components/ReviewerLayout", () => ({
  default: ({ children, focusMode }) => (
    <div data-testid="reviewer-layout" data-focus-mode={String(Boolean(focusMode))}>
      {children}
    </div>
  ),
}));
vi.mock("../api/reviewsApi", () => ({
  reviewsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    submit: vi.fn(),
    lock: vi.fn(),
  },
}));

const authValue = {
  user: { id: 17, name: "Reviewer One", role: "reviewer" },
  role: "reviewer",
  status: "authenticated",
  logout: vi.fn(),
};

const review = {
  id: 41,
  submission_id: 92,
  submitted_at: null,
  score: 3,
  comments: "",
  recommendation: "accept",
  submission: {
    id: 92,
    title: "Climate adaptation research",
    abstract: "A study of community resilience.",
  },
};

function renderPage(page, path = "/reviewer/evaluate/41") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reviewer-dashboard" element={<ReviewerDashboard />} />
          <Route path="/reviewer/evaluate/:id" element={page} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function mockDocument({ contentType = "application/pdf", disposition = "filename=review.pdf", status = 200 } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: {
        get: (name) => {
          if (name.toLowerCase() === "content-type") return contentType;
          if (name.toLowerCase() === "content-disposition") return disposition;
          return null;
        },
      },
      blob: vi.fn().mockResolvedValue(new Blob(["review document"], { type: contentType })),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "URL",
    Object.assign(class TestURL extends URL {}, {
      createObjectURL: vi.fn(() => "blob:review-document"),
      revokeObjectURL: vi.fn(),
    }),
  );
  reviewsApi.getById.mockResolvedValue({ data: review });
  reviewsApi.getAll.mockResolvedValue({ data: [] });
  reviewsApi.submit.mockResolvedValue({ data: {} });
  reviewsApi.lock.mockResolvedValue({ data: {} });
  mockDocument();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("reviewer dashboard", () => {
  it("filters assigned reviews by status and searches submission titles", async () => {
    reviewsApi.getAll.mockResolvedValue({
      data: [
        { ...review, submission: { ...review.submission, title: "Climate adaptation research" } },
        { ...review, id: 43, submission_id: 94, submitted_at: "2026-10-01", submission: { id: 94, title: "Submitted energy study" } },
        { ...review, id: 42, submission_id: 93, locked: true, submitted_at: "2026-10-01", submission: { id: 93, title: "Locked review paper" } },
      ],
    });

    renderPage(<ReviewerDashboard />, "/reviewer-dashboard?filter=locked");

    expect(await screen.findByText("Locked review paper")).toBeInTheDocument();
    expect(screen.queryByText("Climate adaptation research")).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "all" },
    });
    expect(await screen.findByText("Climate adaptation research")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search by title/), {
      target: { value: "energy study" },
    });
    expect(screen.getByText("Submitted energy study")).toBeInTheDocument();
    expect(screen.queryByText("Locked review paper")).not.toBeInTheDocument();
  });

  it("shows a locked review as complete and offers view-only access", async () => {
    reviewsApi.getAll.mockResolvedValue({
      data: [{ ...review, locked: true, submitted_at: "2026-10-01T10:00:00Z" }],
    });

    renderPage(<ReviewerDashboard />, "/reviewer-dashboard");

    expect(await screen.findByText("Completed and locked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /View review/ })).toBeInTheDocument();
  });
});

describe("review scoring workspace", () => {
  it("keeps scoring controls available in Focus Mode beside a PDF preview", async () => {
    renderPage(<ScoreSubmission />);

    expect(await screen.findByTitle("Submission PDF preview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Focus Mode" }));

    expect(screen.getByTestId("reviewer-layout")).toHaveAttribute("data-focus-mode", "true");
    expect(screen.getByRole("button", { name: "Exit Focus Mode" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Jump to scoring" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Score 3 Good" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Review comments" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept/ })).toBeInTheDocument();
  });

  it("offers a named download fallback for Word documents", async () => {
    mockDocument({
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      disposition: "",
    });

    renderPage(<ScoreSubmission />);

    expect(await screen.findByText("Word document ready to download")).toBeInTheDocument();
    const download = screen.getByRole("link", { name: "Download Word document" });
    expect(download).toHaveAttribute("download", "submission-92.docx");
    expect(download).toHaveAttribute("href", "blob:review-document");
  });

  it("opens and exits the fullscreen PDF view when native fullscreen is unavailable", async () => {
    renderPage(<ScoreSubmission />);

    await screen.findByTitle("Submission PDF preview");
    fireEvent.click(screen.getByRole("button", { name: "View document fullscreen" }));

    expect(screen.getByRole("button", { name: "Exit fullscreen document" })).toBeInTheDocument();
    expect(screen.getByTitle("Submission PDF preview")).toHaveClass("h-screen");

    fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen document" }));
    expect(screen.getByRole("button", { name: "View document fullscreen" })).toBeInTheDocument();
  });

  it("explains document access failures and allows retry", async () => {
    mockDocument({ status: 403 });

    renderPage(<ScoreSubmission />);

    expect(await screen.findByText("You don't have permission to view this submission's document.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry document" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("shows locked scores and comments as read-only", async () => {
    reviewsApi.getById.mockResolvedValue({
      data: {
        ...review,
        locked: true,
        submitted_at: "2026-10-01T10:00:00Z",
        score: 5,
        comments: "Strong methodology.",
      },
    });

    renderPage(<ScoreSubmission />);

    expect(await screen.findByText(/Your submitted score, recommendation, and comments are available as read-only/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Review comments" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Score 5 Excellent" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Lock review" })).not.toBeInTheDocument();
  });

  it("submits a pending review after confirmation", async () => {
    renderPage(<ScoreSubmission />);

    await screen.findByRole("button", { name: "Submit review" });
    fireEvent.change(screen.getByRole("textbox", { name: "Review comments" }), {
      target: { value: "The study is clear and well supported." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit review" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Submit this review?")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Submit review" }));

    await waitFor(() => {
      expect(reviewsApi.submit).toHaveBeenCalledWith("41", {
        score: 3,
        comments: "The study is clear and well supported.",
        recommendation: "accept",
      });
    });
    expect(await screen.findByText(/Your review has been submitted/)).toBeInTheDocument();
  });

  it("updates a submitted review, then locks it as read-only", async () => {
    const submitted = {
      ...review,
      submitted_at: "2026-10-01T10:00:00Z",
      comments: "Initial review comments.",
    };
    const locked = { ...submitted, locked: true };
    reviewsApi.getById
      .mockResolvedValueOnce({ data: submitted })
      .mockResolvedValueOnce({ data: submitted })
      .mockResolvedValueOnce({ data: locked });

    renderPage(<ScoreSubmission />);

    const commentsField = await screen.findByRole("textbox", { name: "Review comments" });
    fireEvent.change(commentsField, { target: { value: "Updated review comments." } });
    fireEvent.click(screen.getByRole("button", { name: "Update review" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Update review" }));

    await waitFor(() => {
      expect(reviewsApi.submit).toHaveBeenCalledWith("41", {
        score: 3,
        comments: "Updated review comments.",
        recommendation: "accept",
      });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Lock review" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Lock review" }));

    await waitFor(() => expect(reviewsApi.lock).toHaveBeenCalledWith("41"));
    await waitFor(() => {
      expect(
        screen.getAllByRole("status").some((status) => status.textContent.includes("This review is locked")),
      ).toBe(true);
    });
    expect(screen.getByRole("textbox", { name: "Review comments" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Update review" })).not.toBeInTheDocument();
  });
});
