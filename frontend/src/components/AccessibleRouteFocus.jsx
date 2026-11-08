import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// SPA route changes do not naturally announce a new document to screen readers.
export default function AccessibleRouteFocus() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState("");
  const initial = useRef(true);

  useEffect(() => {
    const firstPage = initial.current;
    initial.current = false;
    let active = true;
    const root = document.getElementById("root");
    let observer;
    const announce = () => {
      if (!active) return false;
      const main = document.querySelector("main");
      if (!main) return false;
      const visible = (element) => {
        for (let node = element; node && node !== main; node = node.parentElement) {
          if (node.hidden || node.getAttribute("aria-hidden") === "true") return false;
          const style = window.getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden") return false;
        }
        return true;
      };
      const heading = [...main.querySelectorAll("h1, h2")].find(visible) || main;
      const title = heading.textContent?.replace(/\s+/g, " ").trim() || "CMT page";
      document.title = `${title} | CMT`;
      setAnnouncement(`${title} page loaded`);
      // Preserve screen-reader announcements, but only move focus when explicitly enabled.
      let focusEnabled = false;
      try {
        const saved = JSON.parse(localStorage.getItem("cmt-accessibility-preferences-v1") || "null");
        focusEnabled = saved?.visualEnabled === true && saved?.routeFocus === true;
      } catch { /* Optional preferences */ }
      if (!firstPage && focusEnabled) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      return true;
    };
    // Wait for lazy-loaded pages to appear. Observe rather than using a fixed delay.
    const timer = window.setTimeout(() => {
      if (announce() || !root) return;
      observer = new MutationObserver(() => {
        if (announce()) observer.disconnect();
      });
      observer.observe(root, { subtree: true, childList: true });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);

  return <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>;
}
