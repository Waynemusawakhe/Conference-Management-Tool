import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowDown,
  Check,
  Copy,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe2,
  MapPin,
  Maximize2,
  Minimize2,
  MessageCircle,
  Mic,
  MicOff,
  RotateCcw,
  Square,
  Search,
  Send,
  ShieldCheck,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { chatApi } from "../api/chatApi";
import { useChatVoice } from "../hooks/useChatVoice";

const STORAGE_PREFIX = "cmt-chat-v5";

const ROLES = {
  attendee: {
    label: "Attendee",
    hint: "Find and join conferences",
    starters: [
      {
        label: "Find conferences",
        icon: Search,
        tint: "bg-[#efedff] text-[#5c50ec]",
      },
      {
        label: "How do I register?",
        icon: FileText,
        tint: "bg-[#e3f0ff] text-[#1b5eff]",
      },
      {
        label: "Where can I see conference details?",
        icon: CalendarClock,
        tint: "bg-[#fff1e0] text-[#a94e00]",
      },
      {
        label: "Conferences in South Africa",
        icon: Globe2,
        tint: "bg-[#dff7ee] text-[#006746]",
      },
    ],
  },
  organiser: {
    label: "Organiser",
    hint: "Run and manage conferences",
    starters: [
      {
        label: "Set up a new conference",
        icon: CalendarDays,
        tint: "bg-[#efedff] text-[#5c50ec]",
      },
      {
        label: "Assign reviewers",
        icon: ClipboardCheck,
        tint: "bg-[#e3f0ff] text-[#1b5eff]",
      },
      {
        label: "Track submissions",
        icon: FileText,
        tint: "bg-[#fff1e0] text-[#a94e00]",
      },
      {
        label: "Plan the programme",
        icon: Users,
        tint: "bg-[#dff7ee] text-[#006746]",
      },
    ],
  },
  reviewer: {
    label: "Reviewer",
    hint: "Review submitted papers",
    starters: [
      {
        label: "My assigned papers",
        icon: FileText,
        tint: "bg-[#e3f0ff] text-[#1b5eff]",
      },
      {
        label: "Review criteria and scoring",
        icon: ClipboardCheck,
        tint: "bg-[#efedff] text-[#5c50ec]",
      },
      {
        label: "Review deadlines",
        icon: CalendarClock,
        tint: "bg-[#fff1e0] text-[#a94e00]",
      },
      {
        label: "Report a conflict of interest",
        icon: ShieldCheck,
        tint: "bg-[#ffe7ec] text-[#d12b4d]",
      },
    ],
  },
  admin: {
    label: "Administrator",
    hint: "Manage the system",
    starters: [
      {
        label: "Manage users and roles",
        icon: Users,
        tint: "bg-[#efedff] text-[#5c50ec]",
      },
      {
        label: "Approve conferences",
        icon: ClipboardCheck,
        tint: "bg-[#dff7ee] text-[#006746]",
      },
      {
        label: "University-wide reports",
        icon: FileText,
        tint: "bg-[#e3f0ff] text-[#1b5eff]",
      },
      {
        label: "System settings",
        icon: ShieldCheck,
        tint: "bg-[#fff1e0] text-[#d9760b]",
      },
    ],
  },
  author: {
    label: "Author",
    hint: "Manage your paper submissions",
    starters: [
      {
        label: "How do I submit a paper?",
        icon: FileText,
        tint: "bg-[#e3f0ff] text-[#1b5eff]",
      },
      {
        label: "Check my submission status",
        icon: ClipboardCheck,
        tint: "bg-[#dff7ee] text-[#006746]",
      },
      {
        label: "Submission deadlines",
        icon: CalendarClock,
        tint: "bg-[#fff1e0] text-[#a94e00]",
      },
      {
        label: "Find conferences",
        icon: Search,
        tint: "bg-[#efedff] text-[#5c50ec]",
      },
    ],
  },
};

function normalizeRole(role) {
  const value = String(role ?? "")
    .trim()
    .toLowerCase();
  const canonical =
    value === "organizer"
      ? "organiser"
      : value === "administrator"
        ? "admin"
        : value;
  // An unrecognised role gets public attendee guidance, NEVER elevated privileges.
  return Object.hasOwn(ROLES, canonical) ? canonical : "attendee";
}

function pageSuggestions(role, pathname) {
  const path = pathname.toLowerCase();
  const candidates = [];
  if (/(submission|manuscript|paper)/.test(path)) {
    if (role === "author")
      candidates.push("Check my submission status", "Submission deadlines");
    if (role === "organiser")
      candidates.push("Track submissions", "Assign reviewers");
    if (role === "reviewer")
      candidates.push("My assigned papers", "Review criteria and scoring");
  } else if (/(review|assignment)/.test(path)) {
    if (role === "reviewer")
      candidates.push("My assigned papers", "Review deadlines");
    if (role === "organiser")
      candidates.push("Assign reviewers", "Track submissions");
  } else if (/(user|account|role)/.test(path) && role === "admin") {
    candidates.push("Manage users and roles", "System settings");
  } else if (/(report|analytic)/.test(path) && role === "admin") {
    candidates.push("University-wide reports");
  } else if (/(conference|event)/.test(path)) {
    if (role === "organiser")
      candidates.push("Set up a new conference", "Plan the programme");
    if (role === "attendee" || role === "author")
      candidates.push("Find conferences");
  }
  const starters = ROLES[role].starters;
  const ordered = [...candidates, ...starters.map((item) => item.label)];
  return [...new Set(ordered)]
    .slice(0, 4)
    .map((label) => starters.find((item) => item.label === label))
    .filter(Boolean);
}

// Share only a coarse UI section with the backend (never raw route IDs).
function getPageContext(pathname) {
  const path = String(pathname || "").toLowerCase();
  if (/(submission|manuscript|paper)/.test(path)) return "submissions";
  if (/(review|assignment)/.test(path)) return "reviews";
  if (/(user|account|role)/.test(path)) return "user-management";
  if (/(report|analytic)/.test(path)) return "reports";
  if (/(conference|event)/.test(path)) return "conferences";
  return "dashboard";
}

function makeWelcome(role) {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi! I'm the **CMT assistant**. You're viewing the **${ROLES[role].label}** experience. I can help you navigate CMT and explain common tasks.`,
    time: Date.now(),
  };
}

// Call this from your existing logout handler to clear all roles for that user.
export function clearChatHistoryForUser(userId) {
  if (userId == null || userId === "") return;
  try {
    const prefix = `${STORAGE_PREFIX}:${encodeURIComponent(String(userId))}:`;
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    /* Optional browser storage. */
  }
}

function storageKey(userId, role) {
  // Anonymous pages do not persist conversations.
  return userId == null || userId === ""
    ? null
    : `${STORAGE_PREFIX}:${encodeURIComponent(String(userId))}:${role}`;
}

function restoreConversation(key, role) {
  if (!key) return { messages: [makeWelcome(role)], conversationId: null };
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      Array.isArray(saved?.messages) &&
      saved.messages.length &&
      saved.messages.every(
        (message) =>
          message &&
          typeof message.content === "string" &&
          ["user", "assistant"].includes(message.role),
      )
    ) {
      return {
        messages: saved.messages.slice(-60),
        conversationId: saved.conversationId || null,
      };
    }
  } catch {
    /* Storage unavailable or corrupt; start fresh. */
  }
  return { messages: [makeWelcome(role)], conversationId: null };
}

// The wrapper's key ensures a pending request from one account cannot render
// in another account's conversation after the authenticated user changes.
export default function ChatBot({ role, userId }) {
  const resolvedRole = normalizeRole(role);
  const identity = `${String(userId ?? "guest")}:${resolvedRole}`;
  return <ChatBotSession key={identity} role={resolvedRole} userId={userId} />;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clock = (t) =>
  new Date(t).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

/* Safe lightweight markdown: **bold**, bullet lines, and line breaks. */

function renderInline(text) {
  // React escapes all text. Only **bold** is recognised, never raw HTML.
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-bold text-[#0d1b3d]">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
}

function RichText({ text }) {
  const lines = text.split("\n");

  const blocks = [];

  let bullets = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6655f6]" />

              <span>{renderInline(b)}</span>
            </li>
          ))}
        </ul>,
      );

      bullets = [];
    }
  };

  lines.forEach((line, i) => {
    if (/^\s*[-•]\s+/.test(line)) bullets.push(line.replace(/^\s*[-•]\s+/, ""));
    else {
      flush();

      if (line.trim()) blocks.push(<p key={i}>{renderInline(line)}</p>);
      else blocks.push(<div key={i} className="h-2" />);
    }
  });

  flush();

  return <div className="space-y-0.5">{blocks}</div>;
}

/* ---------- conference result card ---------- */

function MiniConference({ conference, onOpen }) {
  const parsedDate = conference.start_date
    ? new Date(conference.start_date)
    : null;
  const date =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("en-ZA", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Date to be announced";

  const place = [conference.city, conference.country]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"

      onClick={() => onOpen(conference)}

      className="group flex w-full items-center gap-3 rounded-2xl border border-[#e7e9f1] bg-white p-3 text-left shadow-[0_2px_10px_rgba(15,28,65,.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[#cbc6ff] hover:shadow-[0_14px_30px_rgba(102,85,246,.14)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-[11px] font-extrabold tracking-wide text-white">
        {(conference.code || conference.name || "C").slice(0, 3).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="line-clamp-1 block text-[13px] font-bold text-[#0d1b3d]">
          {conference.name}
        </strong>

        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#778198]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} /> {date}
          </span>

          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {place}
            </span>
          )}
        </span>
      </span>

      <ArrowUpRight
        size={17}

        className="shrink-0 text-[#b3bacb] transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#6655f6]"
      />
    </button>
  );
}

function BotAvatar({ size = 30 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white shadow-[0_6px_16px_rgba(102,85,246,.35)]"

      style={{ width: size, height: size }}
    >
      <Bot size={size * 0.55} strokeWidth={2} />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="cmt-msg-in flex items-end gap-2.5">
      <BotAvatar />

      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#e7e9f1] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(15,28,65,.04)]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}

            className="cmt-dot h-2 w-2 rounded-full bg-[#6655f6]"

            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBotSession({ role, userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const key = storageKey(userId, role);
  const quickStarters = pageSuggestions(role, location.pathname);
  const [initial] = useState(() => restoreConversation(key, role));
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState(initial.messages);
  const [conversationId, setConversationId] = useState(initial.conversationId);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [autoReadReplies, setAutoReadReplies] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copyError, setCopyError] = useState("");
  const appendTranscript = useCallback((transcript) => {
    setInput((current) =>
      [current.trim(), transcript.trim()]
        .filter(Boolean)
        .join(" ")
        .slice(0, 1000),
    );
  }, []);
  const {
    voiceInputSupported,
    speechOutputSupported,
    listening,
    interimTranscript,
    voiceError,
    speakingId,
    toggleListening,
    cancelListening,
    speak,
    stopSpeaking,
  } = useChatVoice({ onTranscript: appendTranscript });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const launchRef = useRef(null);
  const openRef = useRef(false);
  const sendingRef = useRef(false);
  const requestVersionRef = useRef(0);
  const autoReadRef = useRef(false);
  useEffect(() => {
    autoReadRef.current = autoReadReplies;
  }, [autoReadReplies]);

  const closeChat = useCallback(() => {
    cancelListening();
    stopSpeaking();
    setOpen(false);
    launchRef.current?.focus();
  }, [cancelListening, stopSpeaking]);

  const copyMessage = async (message) => {
    setCopyError("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Unsupported");
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
    } catch {
      setCopyError(
        "Copy is unavailable in this browser. Select the text to copy it.",
      );
    }
  };

  const toggleAutoRead = () => {
    if (autoReadReplies) stopSpeaking();
    autoReadRef.current = !autoReadReplies;
    setAutoReadReplies(!autoReadReplies);
  };

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    return () => {
      requestVersionRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!key) return;
    try {
      // A bounded conversation, scoped to the current authenticated identity.
      sessionStorage.setItem(
        key,
        JSON.stringify({ messages: messages.slice(-60), conversationId }),
      );
    } catch {
      /* Optional persistence only. */
    }
  }, [key, messages, conversationId]);

  const onlyWelcome = messages.length === 1 && messages[0].id === "welcome";

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    if (onlyWelcome) {
      const el = scrollRef.current;
      if (el) {
        if (typeof el.scrollTo === "function") el.scrollTo({ top: 0 });
        else el.scrollTop = 0;
      }
    }
    else scrollToBottom();
  }, [messages, sending, open, onlyWelcome, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 140);
  };

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [input, open]);

  const send = async (raw, retryErrorId = null) => {
    const text = String(raw ?? input).trim();
    if (listening) return; // Let the user review finished dictation before sending.
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const version = ++requestVersionRef.current;
    const errorMessage = retryErrorId
      ? messages.find((m) => m.id === retryErrorId)
      : null;
    const baseMessages = errorMessage
      ? messages.filter(
          (m) =>
            m.id !== errorMessage.id && m.id !== errorMessage.userMessageId,
        )
      : messages;
    const userMsg = {
      id: uid(),
      role: "user",
      content: text,
      time: Date.now(),
    };
    // Do NOT add the current user message twice, and do NOT send failed messages.
    const history = baseMessages
      .filter((m) => m.id !== "welcome" && !m.error)
      .slice(-12)
      .map(({ role: speaker, content }) => ({ role: speaker, content }));
    setMessages([...baseMessages, userMsg]);
    setInput("");
    setSuggestions([]);
    try {
      const res = await chatApi.sendMessage({
        message: text,
        history,
        conversationId,
        role,
        pageContext: getPageContext(location.pathname),
      });
      if (requestVersionRef.current !== version) return;
      if (res.conversationId) setConversationId(res.conversationId);
      const replyMessage = {
        id: uid(),
        role: "assistant",
        content: res.reply,
        conferences: res.conferences,
        time: Date.now(),
      };
      setMessages((prev) => [...prev, replyMessage]);
      if (autoReadRef.current && openRef.current)
        speak(replyMessage.content, replyMessage.id);
      setSuggestions(res.suggestions);
      if (!openRef.current) setUnread((count) => count + 1);
    } catch (err) {
      if (requestVersionRef.current !== version) return;
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          error: true,
          content:
            err?.message ||
            "The assistant is unavailable right now. Please try again.",
          retryText: text,
          userMessageId: userMsg.id,
          time: Date.now(),
        },
      ]);
    } finally {
      if (requestVersionRef.current === version) {
        sendingRef.current = false;
        setSending(false);
      }
    }
  };

  const reset = () => {
    cancelListening();
    stopSpeaking();
    setCopiedId(null);
    setCopyError("");
    requestVersionRef.current += 1; // Ignore a response still in flight.
    sendingRef.current = false;
    setSending(false);
    setMessages([makeWelcome(role)]);
    setConversationId(null);
    setSuggestions([]);
    setInput("");
    setUnread(0);
    if (key) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* optional storage */
      }
    }
  };

  const openConference = (conference) => {
    if (conference?.id == null) return;
    closeChat();
    navigate(`/conferences/${encodeURIComponent(String(conference.id))}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{`

        @keyframes cmt-launcher-appear { 0% { opacity:0; transform:translateY(14px) scale(.82); } 70% { transform:translateY(-3px) scale(1.04); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes cmt-panel-in { from { opacity:0; transform: translateY(22px) scale(.95); } to { opacity:1; transform:none; } }

        @keyframes cmt-msg-in   { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }

        @keyframes cmt-dot      { 0%,80%,100% { transform: translateY(0); opacity:.35; } 40% { transform: translateY(-5px); opacity:1; } }

        @keyframes cmt-ring     { 0% { transform: scale(1); opacity:.5; } 100% { transform: scale(1.7); opacity:0; } }

        @keyframes cmt-drift    { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(26px,-18px) scale(1.18); } 100% { transform: translate(0,0) scale(1); } }

        .cmt-panel-in { animation: cmt-panel-in .4s cubic-bezier(.2,.9,.3,1.05) both; }

        .cmt-msg-in   { animation: cmt-msg-in .35s ease-out both; }

        .cmt-dot      { animation: cmt-dot 1.1s infinite ease-in-out; }

        .cmt-ring     { animation: cmt-ring 2.6s infinite ease-out; }

        .cmt-drift-a  { animation: cmt-drift 14s infinite ease-in-out; }

        .cmt-drift-b  { animation: cmt-drift 18s infinite ease-in-out reverse; }

        .cmt-scroll::-webkit-scrollbar { width: 6px; height: 6px; }

        .cmt-scroll::-webkit-scrollbar-thumb { background: #d6dbe8; border-radius: 99px; }

        @media (prefers-reduced-motion: reduce) {

          .cmt-panel-in,.cmt-msg-in,.cmt-dot,.cmt-ring,.cmt-drift-a,.cmt-drift-b { animation: none !important; }

        }

      `}</style>

      {/* ---------- launcher ---------- */}

      <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-3 max-[560px]:bottom-4 max-[560px]:right-4">
        <button
          type="button"
          ref={launchRef}
          aria-label={open ? "Hide chat assistant" : "Open chat assistant"}

          aria-expanded={open}

          onClick={() => (open ? closeChat() : setOpen(true))}

          className="group relative grid motion-safe:animate-[cmt-launcher-appear_.65s_ease-out_both] h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,#0a1740,#15165a)] text-white shadow-[0_6px_18px_rgba(15,28,65,.24)] outline-none ring-2 ring-white/20 transition duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#b9b3ff]/70 active:scale-95"
        >

          <span className="absolute inset-[5px] rounded-full bg-gradient-to-br from-[#6655f6] to-[#7869ff] opacity-90" />

          <span className="relative transition duration-300">
            {open ? (
              <X size={20} strokeWidth={2.4} />
            ) : (
              <MessageCircle size={21} strokeWidth={2.2} />
            )}
          </span>

          {unread > 0 && !open && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#ff4d6d] px-1 text-[10px] font-extrabold">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* ---------- panel ---------- */}

      {open && (
        <section
          role="dialog"

          aria-label="CMT chat assistant"

          className={`cmt-panel-in cmt-chat-panel fixed z-[95] flex origin-bottom-right flex-col overflow-hidden border border-[#e1e5f0] bg-[#f7f9fc] text-[#0d1b3d] shadow-[0_40px_100px_rgba(7,19,47,.35)] transition-[width,height] duration-300

            max-[560px]:inset-0 max-[560px]:rounded-none

            min-[561px]:bottom-[96px] min-[561px]:right-5 min-[561px]:rounded-[26px]

            ${
              expanded
                ? "min-[561px]:h-[calc(100vh-120px)] min-[561px]:w-[min(620px,calc(100vw-40px))]"
                : "min-[561px]:h-[min(640px,calc(100vh-120px))] min-[561px]:w-[400px]"
            }`}
        >
          {/* compact header */}

          <header className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="cmt-drift-a absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#6655f6]/45 blur-[60px]" />

              <div className="cmt-drift-b absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-[#1b5eff]/35 blur-[60px]" />

              <div className="absolute inset-0 opacity-[.2] [background-image:radial-gradient(rgba(255,255,255,.2)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
            </div>

            <div className="relative flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10">
                <Bot size={20} strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-[14.5px] font-extrabold leading-tight tracking-[-.02em]">
                  CMT Assistant
                </h2>

                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c5bcff]" />{" "}
                  {chatApi.isMockMode
                    ? "Preview mode · sample guidance"
                    : "CMT ASSISTANCE· replies may vary"}
                </p>
              </div>

              <div className="flex items-center gap-0.5">
                {speechOutputSupported && (
                  <HeaderBtn
                    label={
                      autoReadReplies
                        ? "Turn off spoken replies"
                        : "Read future replies aloud"
                    }
                    onClick={toggleAutoRead}
                    className={autoReadReplies ? "bg-white/20 text-white" : ""}
                  >
                    {autoReadReplies ? (
                      <Volume2 size={17} />
                    ) : (
                      <VolumeX size={17} />
                    )}
                  </HeaderBtn>
                )}
                <HeaderBtn label="New conversation" onClick={reset}>
                  <RotateCcw size={16} />
                </HeaderBtn>

                <HeaderBtn
                  label={expanded ? "Make smaller" : "Make larger"}

                  onClick={() => setExpanded((v) => !v)}

                  className="max-[560px]:hidden"
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </HeaderBtn>

                <HeaderBtn label="Close chat" onClick={closeChat}>
                  <X size={18} />
                </HeaderBtn>
              </div>
            </div>
          </header>

          {/* messages */}

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}

              onScroll={onScroll}

              className="cmt-scroll h-full space-y-4 overflow-y-auto px-4 py-4"

              role="log"
              aria-label="CMT conversation history"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((m) =>
                m.role === "user" ? (
                  <div
                    key={m.id}
                    className="cmt-msg-in flex flex-col items-end"
                  >
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-[#6655f6] to-[#7869ff] px-4 py-3 text-[13.5px] leading-6 text-white shadow-[0_10px_24px_rgba(102,85,246,.3)]">
                      {m.content}
                    </div>

                    <span className="mt-1 text-[10px] text-[#9aa3b8]">
                      {clock(m.time)}
                    </span>
                  </div>
                ) : (
                  <div key={m.id} className="cmt-msg-in flex items-end gap-2.5">
                    <BotAvatar />

                    <div className="min-w-0 max-w-[88%]">
                      <div
                        className={`rounded-2xl rounded-bl-md border px-4 py-3 text-[13.5px] leading-6 shadow-[0_2px_10px_rgba(15,28,65,.04)] ${
                          m.error
                            ? "border-[#ffc9d3] bg-[#fff1f4] text-[#b4233f]"
                            : "border-[#e7e9f1] bg-white text-[#3b4663]"
                        }`}
                      >
                        <RichText text={m.content} />
                        {!m.error && m.id !== "welcome" && (
                          <div className="mt-2.5 flex items-center gap-1 border-t border-[#e7e9f1] pt-2">
                            <button
                              type="button"
                              title="Copy reply"
                              aria-label={
                                copiedId === m.id
                                  ? "Reply copied"
                                  : "Copy reply"
                              }
                              onClick={() => copyMessage(m)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#778198] transition hover:bg-[#f2f0ff] hover:text-[#5c50ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6655f6]"
                            >
                              {copiedId === m.id ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}
                              {copiedId === m.id ? "Copied" : "Copy"}
                            </button>
                            {speechOutputSupported && (
                              <button
                                type="button"
                                title={
                                  speakingId === m.id
                                    ? "Stop reading"
                                    : "Read reply aloud"
                                }
                                aria-label={
                                  speakingId === m.id
                                    ? "Stop reading reply"
                                    : "Read reply aloud"
                                }
                                onClick={() => speak(m.content, m.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#778198] transition hover:bg-[#f2f0ff] hover:text-[#5c50ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6655f6]"
                              >
                                {speakingId === m.id ? (
                                  <VolumeX size={13} />
                                ) : (
                                  <Volume2 size={13} />
                                )}
                                {speakingId === m.id ? "Stop" : "Listen"}
                              </button>
                            )}
                          </div>
                        )}

                        {m.error && m.retryText && (
                          <button
                            type="button"

                            onClick={() => send(m.retryText, m.id)}

                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-2"
                          >
                            <RotateCcw size={12} /> Try again
                          </button>
                        )}
                      </div>

                      {m.conferences?.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          {m.conferences.map((c) => (
                            <MiniConference
                              key={c.id}
                              conference={c}
                              onOpen={openConference}
                            />
                          ))}
                        </div>
                      )}

                      <span className="mt-1 block text-[10px] text-[#9aa3b8]">
                        {clock(m.time)}
                      </span>
                    </div>
                  </div>
                ),
              )}

              {/* starter topics: compact 2x2 grid, always fully visible */}

              {onlyWelcome && !sending && (
                <div className="cmt-msg-in pl-[40px]">
                  <div className="mb-3 rounded-xl border border-[#e5e0ff] bg-[#f0edff] px-3 py-2 text-[11px] font-medium text-[#5544ca]">
                    {ROLES[role].label} workspace · {ROLES[role].hint}
                  </div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#9aa3b8]">
                    Suggested questions for this page
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {quickStarters.map((s) => {
                      const Icon = s.icon;

                      return (
                        <button
                          key={s.label}

                          type="button"

                          onClick={() => send(s.label)}

                          className="cmt-chat-starter-card group flex flex-col items-start gap-2.5 rounded-2xl border border-[#e7e9f1] bg-white p-3 text-left shadow-[0_2px_10px_rgba(15,28,65,.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[#cbc6ff] hover:shadow-[0_14px_30px_rgba(102,85,246,.14)] active:scale-[.98]"
                        >
                          <span
                            className={`cmt-chat-starter-icon grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}
                          >
                            <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                          </span>

                          <span className="text-[12.5px] font-bold leading-snug text-[#0d1b3d]">
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sending && <TypingIndicator />}
            </div>

            {showJump && (
              <button
                type="button"

                onClick={() => scrollToBottom()}

                aria-label="Jump to latest message"

                className="cmt-msg-in absolute bottom-3 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-[#e1e5f0] bg-white text-[#5c50ec] shadow-[0_8px_22px_rgba(15,28,65,.18)] transition hover:-translate-y-0.5"
              >
                <ArrowDown size={17} />
              </button>
            )}
          </div>

          {/* follow-up suggestions */}

          {suggestions.length > 0 && !sending && (
            <div className="cmt-scroll flex shrink-0 gap-2 overflow-x-auto px-4 pb-2.5 pt-1">
              {suggestions.map((s) => (
                <button
                  key={s}

                  type="button"

                  onClick={() => send(s)}

                  className="shrink-0 rounded-full border border-[#cbc6ff] bg-white px-3.5 py-1.5 text-[11.5px] font-bold text-[#5c50ec] shadow-[0_2px_8px_rgba(102,85,246,.08)] transition hover:bg-[#efedff]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* composer */}

          <footer className="shrink-0 border-t border-[#e7e9f1] bg-white px-3.5 pb-2.5 pt-3">
            {listening && (
              <div
                role="status"
                aria-live="polite"
                className="mb-2 flex items-center gap-2 rounded-xl border border-[#f7ccdb] bg-[#fff0f5] px-3 py-2 text-xs font-semibold text-[#a32050]"
              >
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#e83d73]" />
                <span className="min-w-0 flex-1 truncate">
                  {interimTranscript ||
                    "Listening… speak your question, then tap Stop"}
                </span>
              </div>
            )}
            {(voiceError || copyError) && (
              <p role="status" className="mb-2 text-[11px] text-[#b4233f]">
                {voiceError || copyError}
              </p>
            )}

            <div className="flex items-end gap-2 rounded-[20px] border border-[#dfe3ee] bg-[#f7f9fc] p-1.5 pl-4 transition focus-within:border-[#6655f6] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(102,85,246,.12)]">
              <textarea
                ref={inputRef}

                rows={1}

                value={input}

                onChange={(e) => setInput(e.target.value)}

                onKeyDown={onKeyDown}

                maxLength={1000}

                placeholder={
                  listening
                    ? "Listening to your question..."
                    : "Ask about conferences, deadlines..."
                }

                aria-label="Message"

                className="max-h-[110px] min-h-[38px] flex-1 resize-none bg-transparent py-2.5 text-[13.5px] leading-5 text-[#0d1b3d] outline-none placeholder:text-[#9aa3b8]"
              />

              <button
                type="button"
                onClick={toggleListening}
                disabled={!voiceInputSupported || sending}
                title={
                  voiceInputSupported
                    ? listening
                      ? "Stop listening"
                      : "Speak your question"
                    : "Voice input isn't supported in this browser"
                }
                aria-label={
                  listening ? "Stop listening" : "Speak your question"
                }
                aria-pressed={listening}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6655f6] ${
                  listening
                    ? "border-[#ffb6cd] bg-[#ffe4ec] text-[#c91d55] shadow-[0_0_0_4px_rgba(232,61,115,.12)]"
                    : "border-[#e0d9ff] bg-white text-[#6655f6] hover:bg-[#f0edff]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {listening ? (
                  <Square size={16} fill="currentColor" />
                ) : voiceInputSupported ? (
                  <Mic size={18} />
                ) : (
                  <MicOff size={18} />
                )}
              </button>

              <button
                type="button"

                onClick={() => send()}

                disabled={!input.trim() || sending || listening}

                aria-label="Send message"

                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6655f6] to-[#7869ff] text-white shadow-[0_8px_20px_rgba(102,85,246,.35)] transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_12px_26px_rgba(102,85,246,.5)] disabled:cursor-not-allowed disabled:bg-[#d9dcec] disabled:bg-none disabled:text-[#43506a] disabled:shadow-none"
              >
                <Send size={17} strokeWidth={2.3} className="-ml-px mt-px" />
              </button>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-[#9aa3b8]">
              Enter to send · Shift+Enter for a new line ·{" "}
              {chatApi.isMockMode ? "Preview guidance" : "AI can make mistakes"}
              {voiceInputSupported &&
                " · Review voice transcription before sending"}
            </p>
            {voiceInputSupported && (
              <p className="mt-1 text-center text-[9px] text-[#9aa3b8]">
                Your browser may use an online service to recognise speech.
              </p>
            )}
          </footer>
        </section>
      )}
    </>
  );
}

function HeaderBtn({ children, label, onClick, className = "" }) {
  return (
    <button
      type="button"

      aria-label={label}

      title={label}

      onClick={onClick}

      className={`grid h-9 w-9 place-items-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}
