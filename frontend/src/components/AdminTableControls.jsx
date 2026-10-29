import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownAZ, ArrowUpAZ, Columns3, RotateCcw, Check, LayoutGrid, List } from "lucide-react";

const STORAGE_PREFIX = "cmt.admin-table.";

function readPreferences(tableId, columns) {
  const defaults = {
    visible: columns.map((column) => column.key),
    density: "comfortable",
  };
  if (typeof window === "undefined") return defaults;
  try {
    const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}${tableId}`) || "null");
    const validKeys = new Set(columns.map((column) => column.key));
    const visible = Array.isArray(saved?.visible)
      ? saved.visible.filter((key) => validKeys.has(key))
      : defaults.visible;
    return {
      visible: visible.length ? visible : defaults.visible,
      density: saved?.density === "compact" ? "compact" : "comfortable",
    };
  } catch {
    return defaults;
  }
}

function compareValues(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;

  const leftString = String(left);
  const rightString = String(right);
  const datePattern = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/;
  if (datePattern.test(leftString) && datePattern.test(rightString)) {
    const leftTime = Date.parse(leftString);
    const rightTime = Date.parse(rightString);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
  }

  const leftNumber = Number(leftString);
  const rightNumber = Number(rightString);
  if (leftString.trim() && rightString.trim() && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return leftString.localeCompare(rightString, undefined, { numeric: true, sensitivity: "base" });
}

export function useAdminTableControls(tableId, columns) {
  const [preferences, setPreferences] = useState(() => readPreferences(tableId, columns));
  const [sort, setSort] = useState({ key: null, direction: "none" });
  const columnKeys = useMemo(() => columns.map((column) => column.key), [columns]);

  useEffect(() => {
    setPreferences((current) => {
      const visible = current.visible.filter((key) => columnKeys.includes(key));
      return { ...current, visible: visible.length ? visible : columnKeys };
    });
  }, [columnKeys]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(preferences));
    } catch {
      // Table controls still work for this session when storage is unavailable.
    }
  }, [preferences, tableId]);

  const columnVisible = (key) => preferences.visible.includes(key);
  const toggleColumn = (key) => {
    setPreferences((current) => {
      if (current.visible.includes(key) && current.visible.length === 1) return current;
      const visible = current.visible.includes(key)
        ? current.visible.filter((item) => item !== key)
        : [...current.visible, key];
      return { ...current, visible };
    });
  };
  const showAllColumns = () => setPreferences((current) => ({ ...current, visible: columnKeys }));
  const reset = () => {
    setPreferences({ visible: columnKeys, density: "comfortable" });
    setSort({ key: null, direction: "none" });
  };
  const cycleSort = (key) => setSort((current) => {
    if (current.key !== key || current.direction === "none") return { key, direction: "asc" };
    if (current.direction === "asc") return { key, direction: "desc" };
    return { key: null, direction: "none" };
  });
  const sortRows = (rows, accessors) => {
    if (sort.direction === "none" || !sort.key || typeof accessors?.[sort.key] !== "function") return rows;
    const accessor = accessors[sort.key];
    const direction = sort.direction === "asc" ? 1 : -1;
    return rows.map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const result = compareValues(accessor(a.row), accessor(b.row));
        if (result === 0) return a.index - b.index;
        if (accessor(a.row) == null || accessor(b.row) == null) return result;
        return result * direction;
      })
      .map(({ row }) => row);
  };

  return {
    columnVisible,
    toggleColumn,
    showAllColumns,
    reset,
    density: preferences.density,
    setDensity: (density) => setPreferences((current) => ({ ...current, density })),
    sort,
    cycleSort,
    sortRows,
  };
}

export function AdminTableToolbar({ columns, controls, className = "" }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuId = useId();
  const allVisible = columns.every((column) => controls.columnVisible(column.key));
  
  const toggleMenu = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = Math.min(columns.length * 44 + 56, 360) + 20; // Add extra padding for safety
      
      // Calculate top position, ensuring it stays on screen
      let top = rect.bottom + 8;
      if (top + menuHeight > window.innerHeight) {
        top = Math.max(20, rect.top - menuHeight - 8);
      }

      setMenuPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)),
        top,
      });
    }
    setOpen((value) => !value);
  };

  return (
    <div 
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} 
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] bg-[#fafbfe] px-4 py-3 dark:border-[#1e293b] dark:bg-[#0f172a] sm:px-6 ${className}`}
    >
      <div>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={menuId}
          onClick={toggleMenu}
          className={`inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 text-[11px] font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6] ${
            open 
              ? "border-[#6655f6] bg-[#efedff] text-[#5649dc] shadow-[0_0_0_2px_rgba(102,85,246,0.1)]" 
              : "border-[#e2e6ee] bg-white text-[#43506a] shadow-sm hover:border-[#d6dbe8] hover:bg-[#fafbff] dark:border-[#334155] dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#1e293b]"
          }`}
        >
          <Columns3 size={15} className={open ? "text-[#6655f6]" : "text-[#98a1b3]"} /> 
          Columns
        </button>

        {open && createPortal(
          <div 
            id={menuId} 
            role="group" 
            aria-label="Visible table columns" 
            onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }} 
            style={{ left: menuPosition.left, top: menuPosition.top }} 
            className="fixed z-[9999] w-64 origin-top-left animate-[scaleIn_.15s_ease-out] rounded-2xl border border-[#e2e6ee] bg-white p-2 shadow-[0_20px_50px_-12px_rgba(7,19,47,.25)] dark:border-[#334155] dark:bg-[#0f172a]"
          >
            <div className="mb-2 flex gap-1.5 border-b border-[#edf0f5] pb-2.5 dark:border-[#1e293b]">
              <button 
                type="button" 
                disabled={allVisible} 
                onClick={controls.showAllColumns} 
                className="min-h-[36px] flex-1 rounded-lg bg-[#f4f6fb] px-2 text-[10px] font-extrabold text-[#5649dc] transition hover:bg-[#efedff] disabled:opacity-40 dark:bg-[#1e293b] dark:text-[#b8adff] dark:hover:bg-[#2a2354]"
              >
                Show all
              </button>
              <button 
                type="button" 
                onClick={() => { controls.reset(); setOpen(false); }} 
                className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f4f6fb] px-2 text-[10px] font-extrabold text-[#66728b] transition hover:bg-[#e9ecf3] dark:bg-[#1e293b] dark:text-[#cbd5e1] dark:hover:bg-[#334155]"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pb-1 custom-scrollbar">
              {columns.map((column) => {
                const isVisible = controls.columnVisible(column.key);
                return (
                  <label 
                    key={column.key} 
                    className="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[11px] font-semibold text-[#43506a] transition hover:bg-[#f7f8fc] dark:text-[#e2e8f0] dark:hover:bg-[#1e293b]"
                  >
                    <div className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition ${isVisible ? "border-[#6655f6] bg-[#6655f6] text-white" : "border-[#ccd3df] bg-white dark:border-[#475569] dark:bg-[#0f172a]"}`}>
                      {isVisible && <Check size={11} strokeWidth={3} />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isVisible} 
                      onChange={() => controls.toggleColumn(column.key)} 
                      className="sr-only" 
                    />
                    {column.label}
                  </label>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
      </div>

      <div className="inline-flex min-h-[38px] items-center rounded-xl border border-[#e2e6ee] bg-white p-1 shadow-sm dark:border-[#334155] dark:bg-[#0f172a]" role="group" aria-label="Table density">
        <button 
          type="button" 
          aria-pressed={controls.density === "compact"} 
          onClick={() => controls.setDensity("compact")} 
          title="Compact view"
          className={`inline-flex h-[30px] items-center justify-center gap-1.5 rounded-lg px-3 text-[10px] font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6] ${
            controls.density === "compact" 
              ? "bg-[#efedff] text-[#5649dc] shadow-sm dark:bg-[#2a2354] dark:text-[#c4bfff]" 
              : "text-[#66728b] hover:bg-[#f4f6fb] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
          }`}
        >
          <List size={13} className="hidden sm:block" /> Compact
        </button>
        <button 
          type="button" 
          aria-pressed={controls.density === "comfortable"} 
          onClick={() => controls.setDensity("comfortable")} 
          title="Comfortable view"
          className={`inline-flex h-[30px] items-center justify-center gap-1.5 rounded-lg px-3 text-[10px] font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6] ${
            controls.density === "comfortable" 
              ? "bg-[#efedff] text-[#5649dc] shadow-sm dark:bg-[#2a2354] dark:text-[#c4bfff]" 
              : "text-[#66728b] hover:bg-[#f4f6fb] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
          }`}
        >
          <LayoutGrid size={13} className="hidden sm:block" /> Comfortable
        </button>
      </div>
      
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export function SortableTh({ column, controls, className = "" }) {
  const direction = controls.sort.key === column.key ? controls.sort.direction : "none";
  const ariaSort = direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";
  const Icon = direction === "asc" ? ArrowUpAZ : ArrowDownAZ;
  
  return (
    <th aria-sort={ariaSort} className={`whitespace-nowrap ${className}`}>
      <button 
        type="button" 
        onClick={() => controls.cycleSort(column.key)} 
        className="group/sort inline-flex min-h-[40px] items-center gap-1.5 text-left font-[inherit] text-inherit transition hover:text-[#5649dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6655f6] dark:hover:text-[#b8adff]"
      >
        {column.label}
        <Icon 
          size={13} 
          aria-hidden="true" 
          className={`transition-all duration-200 ${
            direction === "none" 
              ? "opacity-30 group-hover/sort:opacity-60" 
              : "opacity-100 text-[#5649dc] dark:text-[#b8adff]"
          }`} 
        />
      </button>
    </th>
  );
}