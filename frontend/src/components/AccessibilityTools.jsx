import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Accessibility, Pause, Play, Square, Volume2, X } from "lucide-react";

const STORAGE_KEY = "cmt-accessibility-preferences-v1";
const DEFAULTS = { textSize: "100", contrast: false, reduceMotion: false, speechRate: 1 };

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return DEFAULTS;
    return {
      textSize: ["100", "125", "150"].includes(saved.textSize) ? saved.textSize : "100",
      contrast: saved.contrast === true,
      reduceMotion: saved.reduceMotion === true,
      speechRate: [0.8, 1, 1.2].includes(saved.speechRate) ? saved.speechRate : 1,
    };
  } catch {
    return DEFAULTS;
  }
}

function readableText(root) {
  if (!root) return "";
  // Never read input values, typed passwords, hidden dialogs, or marked private data.
  const selector = "h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,th,td";
  const lines = [...root.querySelectorAll(selector)]
    .filter((node) => {
      if (node.closest("[hidden], [aria-hidden='true'], [inert], [data-no-read], [data-private], script, style, nav, aside")) return false;
      if (node.closest("[role='dialog']") && node.closest("[aria-hidden='true']")) return false;
      if (node.closest("li,blockquote,td,th") && node.matches("p")) return false;
      const style = window.getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none") return false;
      return true;
    })
    .map((node) => (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.filter((line, i) => i === 0 || line !== lines[i - 1]).join(". ").slice(0, 14000);
}

function splitSpeech(text) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > 850 && current) {
      chunks.push(current.trim());
      current = "";
    }
    if (sentence.length > 850) {
      for (let i = 0; i < sentence.length; i += 850) chunks.push(sentence.slice(i, i + 850).trim());
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export default function AccessibilityTools() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [speechState, setSpeechState] = useState("idle");
  const [message, setMessage] = useState("");
  const trigger = useRef(null);
  const panel = useRef(null);
  const speechSession = useRef(0);
  const headingIndex = useRef(-1);

  const canSpeak = typeof window !== "undefined" &&
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    document.documentElement.dataset.cmtTextSize = preferences.textSize;
    document.documentElement.dataset.cmtContrast = preferences.contrast ? "high" : "normal";
    document.documentElement.dataset.cmtReduceMotion = preferences.reduceMotion ? "true" : "false";
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* storage disabled */ }
  }, [preferences]);

  useEffect(() => {
    speechSession.current += 1;
    if (canSpeak) window.speechSynthesis.cancel();
    // Stop previous page speech when navigating.
    setSpeechState("idle");
    setOpen(false);
    headingIndex.current = -1;
  }, [pathname, canSpeak]);

  useEffect(() => () => {
    speechSession.current += 1;
    if (canSpeak) window.speechSynthesis.cancel();
  }, [canSpeak]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panel.current?.querySelector("button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const stop = () => {
    speechSession.current += 1;
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeechState("idle");
  };

  const speak = (text) => {
    if (!canSpeak) {
      setMessage("Read Aloud is unavailable in this browser. You can use your device's screen reader instead.");
      return;
    }
    stop();
    if (!text.trim()) {
      setMessage("No readable text was found. Use your screen reader to explore the controls.");
      return;
    }
    const session = speechSession.current;
    const parts = splitSpeech(text);
    if (!parts.length) return;
    let index = 0;
    const next = () => {
      if (speechSession.current !== session) return;
      if (index >= parts.length) {
        setSpeechState("idle");
        setMessage("Reading finished.");
        return;
      }
      const utterance = new SpeechSynthesisUtterance(parts[index++]);
      utterance.lang = document.documentElement.lang || "en-ZA";
      utterance.rate = preferences.speechRate;
      utterance.onend = next;
      utterance.onerror = () => {
        if (speechSession.current === session) {
          setSpeechState("idle");
          setMessage("Reading stopped. Try your device screen reader if speech isn't supported.");
        }
      };
      window.speechSynthesis.speak(utterance);
    };
    setMessage("Reading aloud. Use Pause or Stop whenever you like.");
    setSpeechState("speaking");
    next();
  };

  const goToHeading = () => {
    const root = document.querySelector("main") || document.querySelector("#root");
    const headings = [...(root?.querySelectorAll("h1,h2,h3,h4,h5,h6") || [])].filter((node) => {
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && !node.closest("[hidden], [aria-hidden='true']");
    });
    if (!headings.length) {
      setMessage("No headings found on this page.");
      return;
    }
    headingIndex.current = (headingIndex.current + 1) % headings.length;
    const heading = headings[headingIndex.current];
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView?.({ block: "center", behavior: "auto" });
    setMessage(`Heading ${headingIndex.current + 1} of ${headings.length}: ${heading.textContent.trim()}`);
  };

  const update = (name, value) => setPreferences((current) => ({ ...current, [name]: value }));

  return (
    <>
      <a className="cmt-skip-link" href="#cmt-main-content" onClick={(event) => {
        const main = document.querySelector("main") || document.getElementById("cmt-main-content");
        if (!main) return;
        event.preventDefault();
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
        main.scrollIntoView?.({ block: "start", behavior: "auto" });
      }}>Skip to main content</a>

      <div className="cmt-a11y-widget" data-no-read>
        <button
          type="button"
          ref={trigger}
          className="cmt-a11y-launcher"
          aria-expanded={open}
          aria-controls="cmt-accessibility-panel"
          onClick={() => setOpen((previous) => !previous)}
        >
          <Accessibility size={19} aria-hidden="true" /> Accessibility
        </button>
        {open && (
          <section className="cmt-a11y-panel" id="cmt-accessibility-panel" ref={panel} aria-label="Accessibility settings and reading controls">
            <div className="cmt-a11y-panel-header">
              <h2>Accessibility tools</h2>
              <button type="button" aria-label="Close accessibility tools" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={20} aria-hidden="true" /></button>
            </div>
            <p className="cmt-a11y-description">Supports screen readers and keyboard navigation. Read Aloud is optional.</p>
            <div className="cmt-a11y-buttons">
              <button type="button" onClick={() => speak(readableText(document.querySelector("main")))} disabled={!canSpeak}>
                <Volume2 size={16} aria-hidden="true" /> Read page
              </button>
              <button type="button" onClick={() => speak(window.getSelection()?.toString() || "")} disabled={!canSpeak}>Read selection</button>
              <button type="button" onClick={goToHeading}>Next heading</button>
              <button type="button" onClick={() => {
                if (!canSpeak) return;
                if (speechState === "speaking") { window.speechSynthesis.pause(); setSpeechState("paused"); }
                else if (speechState === "paused") { window.speechSynthesis.resume(); setSpeechState("speaking"); }
              }} disabled={speechState === "idle"}>
                {speechState === "paused" ? <><Play size={16} aria-hidden="true" /> Resume</> : <><Pause size={16} aria-hidden="true" /> Pause</>}
              </button>
              <button type="button" onClick={stop} disabled={speechState === "idle"}><Square size={14} aria-hidden="true" /> Stop</button>
            </div>
            <label className="cmt-a11y-field">Text size
              <select value={preferences.textSize} onChange={(event) => update("textSize", event.target.value)}>
                <option value="100">Default (100%)</option><option value="125">Large (125%)</option><option value="150">Extra large (150%)</option>
              </select>
            </label>
            <label className="cmt-a11y-field">Reading speed
              <select value={String(preferences.speechRate)} onChange={(event) => update("speechRate", Number(event.target.value))} disabled={!canSpeak}>
                <option value="0.8">Slow</option><option value="1">Normal</option><option value="1.2">Fast</option>
              </select>
            </label>
            <label className="cmt-a11y-check"><input type="checkbox" checked={preferences.contrast} onChange={(event) => update("contrast", event.target.checked)} /> Stronger contrast</label>
            <label className="cmt-a11y-check"><input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => update("reduceMotion", event.target.checked)} /> Reduce animations</label>
            <Link to="/accessibility" onClick={() => setOpen(false)}>Accessibility help and screen-reader instructions</Link>
            <p className="cmt-a11y-message" role="status" aria-live="polite">{message}</p>
          </section>
        )}
      </div>
    </>
  );
}
