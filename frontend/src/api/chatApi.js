import { conferencesApi } from "./conferencesApi";


const USE_MOCK = import.meta.env.VITE_CMT_CHAT_MODE !== "real";
const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const SUPPORTED_ROLES = new Set(["attendee", "organiser", "reviewer", "admin", "author"]);

function normalizeRole(role) {
  const value = String(role ?? "").toLowerCase().trim();
  const canonical = value === "organizer" ? "organiser" : value === "administrator" ? "admin" : value;
  return SUPPORTED_ROLES.has(canonical) ? canonical : "attendee";
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

async function findConferences(term) {
  try {
    const response = await conferencesApi.getAll({ search: term, per_page: 3 });
    const conferences = unwrapList(response)
      .filter((c) => c && c.id != null && typeof c.name === "string" && c.name.trim())
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || c.acronym || "",
        start_date: c.start_date,
        city: c.city || "",
        country: c.country || "",
      }));
    return { conferences, available: true };
  } catch {
    return { conferences: [], available: false };
  }
}

/* ---------- role-aware mock knowledge ----------
   Each rule: [pattern, reply, suggestions]. First match wins.
   Replies are general guidance, so exact screens may differ in your system. */
const RULES = {
  organiser: [
    [
      /(set up|setup|create|new conference|start a conference)/,
      "Setting up a conference usually goes like this:\n\n- Add the basics: name, dates, venue and format\n- Choose topics and set the **submission deadline**\n- Invite reviewers, then publish when you are ready\n\nWould you like help with the review stage next?",
      ["Assign reviewers", "Track submissions"],
    ],
    [
      /(reviewer|assign)/,
      "Assigning reviewers works best in three steps:\n\n- Invite reviewers whose expertise matches your topics\n- Spread papers evenly so nobody is overloaded\n- Check for **conflicts of interest** before assigning\n\nSet a review deadline that leaves time for decisions.",
      ["Track submissions", "Plan the programme"],
    ],
    [
      /(submission|track|paper|deadline)/,
      "To keep submissions on track, watch the count of submitted versus draft papers as the deadline approaches. A reminder **1 week** and **48 hours** before the deadline usually lifts submissions noticeably.\n\nAfter the deadline, move straight to reviewer assignment.",
      ["Assign reviewers", "Plan the programme"],
    ],
    [
      /(programme|program|schedule|session|agenda)/,
      "A programme is easiest to build once decisions are final:\n\n- Group accepted papers into sessions by topic\n- Leave breaks between sessions\n- Share a draft with presenters before publishing\n\nAttendees can check conference dates and programme details on the conference page.",
      ["Set up a new conference", "Track submissions"],
    ],
    [
      /(registration|attendee|ticket)/,
      "For registrations, set capacity and the registration window when you publish the conference, then monitor sign-ups from your dashboard. Closing registration a few days before the event helps with planning.",
      ["Plan the programme"],
    ],
  ],
  admin: [
    [
      /(user|role|account|permission|access)/,
      "For user management, a clean approach is:\n\n- Give each person the **least access** they need\n- Review organiser and reviewer roles at the start of each conference cycle\n- Deactivate accounts for people who have left instead of deleting them, to keep records intact",
      ["Approve conferences", "University-wide reports"],
    ],
    [
      /(approv|pending|publish)/,
      "When approving a conference, check that the dates, venue, submission deadline and organiser details are complete and sensible. Send it back to the organiser with a note if anything is missing, rather than rejecting it outright.",
      ["Manage users and roles", "University-wide reports"],
    ],
    [
      /(report|analytic|statistic|overview|insight)/,
      "Useful university-wide reports include:\n\n- Conferences by department and status\n- Submission and acceptance numbers\n- Reviewer workload\n- Attendance over time\n\nWhich one would you like to focus on?",
      ["Manage users and roles", "System settings"],
    ],
    [
      /(setting|configur|department|faculty|university)/,
      "System settings are best kept consistent across the university: shared categories, departments and default deadlines mean organisers do not each reinvent them. Review them before each academic year.",
      ["Manage users and roles", "Approve conferences"],
    ],
  ],
  reviewer: [
    [
      /(conflict|interest|recuse)/,
      "If you know an author personally, work at the same institution or have collaborated with them recently, that is a **conflict of interest**. Tell the organiser as early as possible so the paper can be reassigned, and do not submit a review for it.",
      ["My assigned papers", "Review deadlines"],
    ],
    [
      /(criteria|scor|rubric|recommend|rating)/,
      "A strong review usually covers:\n\n- **Originality** and contribution\n- **Technical soundness** of the method and results\n- **Clarity** of writing and structure\n- A clear recommendation with reasons the authors can act on\n\nBe specific and constructive, even when recommending rejection.",
      ["Review deadlines", "My assigned papers"],
    ],
    [
      /(deadline|due|late|extension)/,
      "Review deadlines are set by the organiser for each conference. If you are running behind, tell the organiser early and ask about an extension instead of waiting for the deadline to pass.",
      ["Review criteria and scoring", "My assigned papers"],
    ],
    [
      /(assigned|my papers|paper|review)/,
      "Your assigned papers are listed on your reviewer dashboard. For each one, read it fully, check for conflicts of interest first, then write your review against the conference criteria and submit before the deadline.",
      ["Review criteria and scoring", "Report a conflict of interest"],
    ],
  ],
  author: [
    [
      /(how.*submit|submit.*paper|new submission|upload.*paper)/,
      "Open the relevant conference and look for its submission option. Follow the form's requirements and confirm the uploaded manuscript before submitting. Exact steps depend on the conference.",
      ["Check my submission status", "Submission deadlines"],
    ],
    [
      /(status|my submission|decision)/,
      "Your submission status should be checked in the author workspace. **Preview mode does not access your private submission records**; use the dashboard for the current status.",
      ["Submission deadlines", "How do I submit a paper?"],
    ],
    [
      /(deadline|due|closing)/,
      "Submission deadlines are set separately for each conference. Open the relevant conference or author dashboard to confirm the published deadline. I cannot verify private deadlines in preview mode.",
      ["Find conferences", "Check my submission status"],
    ],
  ],
  attendee: [
    [
      /(regist|ticket|sign up|enrol|enroll)/,
      "To register for a conference:\n\n- Open the conference page and check the dates and venue\n- Use the registration option shown there\n- Keep your confirmation for the event\n\nIf registration is closed, contact the organiser listed on the page.",
      ["Where can I see conference details?", "Find conferences"],
    ],
    [
      /\b(calendar|reminder|export|ics)\b/,
      "Calendar export is not currently a CMT feature. You can check the conference details page for published dates and programme information.",
      ["Find conferences", "How do I register?"],
    ],
    [
      /(programme|program|schedule|session|agenda)/,
      "The programme appears on the conference page once the organiser publishes it. Check back closer to the event, as sessions can change.",
      ["How do I register?", "Where can I see conference details?"],
    ],
    [
      /(where.*(detail|date)|conference detail|event detail)/,
      "Open the conference listing and select the event. Its published details should show key dates, location and available registration information.",
      ["Find conferences", "How do I register?"],
    ],
    [
      /(certificate|proof|attendance)/,
      "Certificates and proof of attendance are issued by the conference organiser. Contact them through the conference page if you need one.",
      ["Find conferences"],
    ],
  ],
};

const ROLE_FALLBACK = {
  organiser: {
    reply:
      "I can help with setting up conferences, assigning reviewers, tracking submissions and planning the programme. What would you like to work on?",
    suggestions: ["Set up a new conference", "Assign reviewers", "Track submissions"],
  },
  admin: {
    reply:
      "I can help with users and roles, conference approvals, university-wide reports and system settings. What do you need?",
    suggestions: ["Manage users and roles", "Approve conferences", "University-wide reports"],
  },
  reviewer: {
    reply:
      "I can guide you through assigned papers, review criteria, deadlines and conflicts of interest. I cannot access private review records in preview mode.",
    suggestions: ["My assigned papers", "Review criteria and scoring", "Review deadlines"],
  },
  author: {
    reply:
      "I can explain paper submissions, submission statuses and deadlines. For your current records, check your author workspace.",
    suggestions: ["How do I submit a paper?", "Check my submission status", "Submission deadlines"],
  },
};

async function mockReply(message, role) {
  const text = String(message).toLowerCase();
  await wait(700 + Math.random() * 800);

  if (/^(hi|hello|hey|howzit|good (morning|afternoon|evening))\b/.test(text)) {
    return {
      reply: "Hello, I am your **CMT assistant**. How can I help you today?",
      suggestions: ROLE_FALLBACK[role]?.suggestions || ["Find conferences", "How do I register?"],
    };
  }

  if (/(thank|cheers|great|awesome)/.test(text)) {
    return {
      reply: "Happy to help. Let me know if you need anything else.",
      suggestions: ROLE_FALLBACK[role]?.suggestions || ["Find conferences"],
    };
  }

  const rules = RULES[role] || RULES.attendee;
  for (const [pattern, reply, suggestions] of rules) {
    if (pattern.test(text)) return { reply, suggestions };
  }

  
  const searching = /(conference|event|find|search|in south africa|upcoming|workshop|symposium)/.test(text);
  if (!searching && ROLE_FALLBACK[role]) return ROLE_FALLBACK[role];

  
  if (!/(conference|event|find|search|in south africa|upcoming|workshop|symposium)/.test(text)) {
    return {
      reply: "I can help you find conferences and explain CMT registration and published event details. Try one of the suggestions below.",
      suggestions: ["Find conferences", "How do I register?"],
    };
  }
  const term = String(message)
    .replace(/\b(find|show|search|me|for|conferences?|events?|about|on|in|the|any|upcoming)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const { conferences, available } = await findConferences(term === "" ? "" : term);

  if (!available) {
    return {
      reply: "I can't load the live conference listing at the moment. Please open the Conferences page to check available events. Other preview guidance still works.",
      suggestions: ["How do I register?", "Where can I see conference details?"],
    };
  }
  if (conferences.length) {
    return {
      reply: `I found **${conferences.length}** conference${conferences.length > 1 ? "s" : ""} that match. Tap one to see the details:`,
      conferences,
      suggestions: ["How do I register?", "Where can I see conference details?"],
    };
  }

  return {
    reply:
      "I could not find a direct match for that yet. Try a research field like **AI**, **medicine** or **engineering**, or a city or country.",
    suggestions: ["Find conferences", "Conferences in South Africa"],
  };
}

async function realReply({ message, history, conversationId, role, pageContext }) {
  // Update this token lookup if your project uses a different auth provider.
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${BASE}/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message, conversation_id: conversationId, role, history,
        // Coarse UI hint only. The server must derive permissions itself.
        context: { page: pageContext },
      }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Your session may have expired, or you do not have access to chat.");
    }
    if (!response.ok) throw new Error("The assistant is unavailable right now. Please try again.");
    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The assistant took too long to respond. Please try again.");
    }
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw new Error("Could not connect to the assistant. Please try again later.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const chatApi = {
  isMockMode: USE_MOCK,
  async sendMessage({ message, history = [], conversationId = null, role = "attendee", pageContext = "dashboard" }) {
    const safeRole = normalizeRole(role);
    const safePage = ["dashboard", "conferences", "submissions", "reviews", "user-management", "reports"]
      .includes(pageContext) ? pageContext : "dashboard";
    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((entry) => ["user", "assistant"].includes(entry?.role) && typeof entry.content === "string")
      .slice(-12)
      .map(({ role: speaker, content }) => ({ role: speaker, content }));
    const result = USE_MOCK
      ? await mockReply(message, safeRole)
      : await realReply({ message, history: safeHistory, conversationId, role: safeRole, pageContext: safePage });

    return {
      reply: typeof result?.reply === "string" && result.reply.trim()
        ? result.reply : "Sorry, I couldn't find an answer to that.",
      conversationId: result?.conversation_id || result?.conversationId || conversationId,
      conferences: Array.isArray(result?.conferences)
        ? result.conferences.filter((c) => c && c.id != null && typeof c.name === "string") : [],
      suggestions: Array.isArray(result?.suggestions)
        ? result.suggestions.filter((item) => typeof item === "string").slice(0, 5) : [],
    };
  },
};
