import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Navbar from "../components/Navbar";
import NotFound from "../pages/NotFound";
import Contact from "../pages/Contact";

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ dark: false, toggleTheme: vi.fn() }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ status: "unauthenticated" }),
}));

afterEach(cleanup);

describe("public navigation and not-found experience", () => {
  it("provides a main landmark on the contact page", () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <Contact />
      </MemoryRouter>,
    );

    expect(screen.getByRole("main")).toHaveAttribute("id", "cmt-main-content");
    expect(screen.getByRole("heading", { name: "Contact Us" })).toBeInTheDocument();
  });

  it("marks the current public destination in the desktop navigation", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Conferences" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("closes the mobile menu with Escape", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus();
  });

  it("renders a real 404 with home and helpful public destinations", () => {
    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /isn’t on the programme/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    const helpfulPages = screen.getByRole("navigation", { name: "Helpful pages" });
    expect(within(helpfulPages).getByRole("link", { name: "Conferences" })).toHaveAttribute(
      "href",
      "/conferences",
    );
    expect(within(helpfulPages).getByRole("link", { name: "Help & FAQ" })).toHaveAttribute(
      "href",
      "/help-faq",
    );
    expect(within(helpfulPages).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
