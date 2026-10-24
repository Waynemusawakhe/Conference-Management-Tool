import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAdminTableControls } from "../components/AdminTableControls";

const columns = [
  { key: "name", label: "Name" },
  { key: "count", label: "Count" },
  { key: "created", label: "Created" },
];

describe("useAdminTableControls", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists visible columns and density per table", () => {
    const { result, unmount } = renderHook(() => useAdminTableControls("test-table", columns));
    act(() => {
      result.current.toggleColumn("count");
      result.current.setDensity("compact");
    });
    expect(result.current.columnVisible("count")).toBe(false);
    unmount();

    const restored = renderHook(() => useAdminTableControls("test-table", columns));
    expect(restored.result.current.columnVisible("count")).toBe(false);
    expect(restored.result.current.density).toBe("compact");
  });

  it("keeps at least one column visible and resets preferences", () => {
    const { result } = renderHook(() => useAdminTableControls("test-table", columns));
    act(() => {
      result.current.toggleColumn("name");
      result.current.toggleColumn("count");
    });
    expect(result.current.columnVisible("created")).toBe(true);
    act(() => result.current.toggleColumn("created"));
    expect(result.current.columnVisible("created")).toBe(true);

    act(() => result.current.reset());
    expect(columns.every(({ key }) => result.current.columnVisible(key))).toBe(true);
    expect(result.current.density).toBe("comfortable");
    expect(result.current.sort.direction).toBe("none");
  });

  it("sorts text, numeric strings, dates, and keeps null values last", () => {
    const { result } = renderHook(() => useAdminTableControls("test-table", columns));
    const rows = [
      { name: "User 10", count: "10", created: "2025-02-01", missing: null },
      { name: "User 2", count: "2", created: "2024-12-01", missing: "value" },
      { name: "User 1", count: null, created: "2026-01-01", missing: "other" },
    ];

    act(() => result.current.cycleSort("name"));
    expect(result.current.sortRows(rows, { name: (row) => row.name }).map((row) => row.name))
      .toEqual(["User 1", "User 2", "User 10"]);

    act(() => result.current.cycleSort("count"));
    expect(result.current.sortRows(rows, { count: (row) => row.count }).map((row) => row.count))
      .toEqual(["2", "10", null]);

    act(() => result.current.cycleSort("created"));
    expect(result.current.sortRows(rows, { created: (row) => row.created }).map((row) => row.created))
      .toEqual(["2024-12-01", "2025-02-01", "2026-01-01"]);
  });
});
