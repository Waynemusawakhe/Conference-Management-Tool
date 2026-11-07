import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccessibilityTools from "../components/AccessibilityTools";
import StatusIndicator from "../components/StatusIndicator";

function mountTools() {
  return render(<MemoryRouter><AccessibilityTools /><main><h1>Conferences</h1></main></MemoryRouter>);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  const root = document.documentElement;
  delete root.dataset.cmtDisplayMode;
  delete root.dataset.cmtTextSize;
  delete root.dataset.cmtEmphasizeLinks;
  delete root.dataset.cmtReadingSpacing;
  delete root.dataset.cmtReduceMotion;
});

describe("CMT colour accessibility settings", () => {
  it("keeps a small launcher available after the panel closes", () => {
    mountTools();
    const launch = screen.getByRole("button", { name: "Open accessibility settings" });
    expect(launch).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(launch);
    expect(screen.getByRole("region", { name: "Accessibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close accessibility settings" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close accessibility panel" }));
    expect(screen.getByRole("button", { name: "Open accessibility settings" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Accessibility" })).not.toBeInTheDocument();
  });

  it("offers accessible colour modes and remembers the choice", () => {
    const { unmount } = mountTools();
    fireEvent.click(screen.getByRole("button", { name: "Open accessibility settings" }));
    fireEvent.click(screen.getByRole("radio", { name: /Colour-blind-friendly/i }));
    expect(document.documentElement.dataset.cmtDisplayMode).toBe("color-safe");
    expect(screen.getByRole("radio", { name: /Colour-blind-friendly/i })).toBeChecked();
    unmount();
    mountTools();
    fireEvent.click(screen.getByRole("button", { name: "Open accessibility settings" }));
    expect(screen.getByRole("radio", { name: /Colour-blind-friendly/i })).toBeChecked();
  });

  it("supports extra text size, link emphasis and reset", () => {
    mountTools();
    fireEvent.click(screen.getByRole("button", { name: "Open accessibility settings" }));
    fireEvent.change(screen.getByLabelText("Text size"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Underline links and buttons" }));
    expect(document.documentElement.dataset.cmtTextSize).toBe("150");
    expect(document.documentElement.dataset.cmtEmphasizeLinks).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Reset settings" }));
    expect(document.documentElement.dataset.cmtTextSize).toBe("100");
    expect(document.documentElement.dataset.cmtDisplayMode).toBe("default");
    expect(screen.getByRole("checkbox", { name: "Underline links and buttons" })).not.toBeChecked();
  });
});

describe("semantic status indicators", () => {
  it.each([
    ["accepted", "Accepted", "success"],
    ["rejected", "Rejected", "danger"],
    ["pending", "Pending", "warning"],
    ["open", "Open for submissions", "success"],
    ["closed", "Closed", "neutral"],
  ])("shows a textual and icon-backed %s state", (status, label, tone) => {
    const { container } = render(<StatusIndicator status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector(`[data-cmt-status="${status}"]`)).toHaveAttribute("data-cmt-tone", tone);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
