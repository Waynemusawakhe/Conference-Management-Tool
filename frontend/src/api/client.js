// [API-AUDIT] Changes versus the previous client.js are marked with "[API-AUDIT]".
// Exports are unchanged (tokenStore, request, http, API_BASE_URL) plus errorKind.

const configuredApiUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

const fallbackApiUrl = import.meta.env.DEV
  ? "http://127.0.0.1:8000/api/v1"
  : "/api/v1";

const API_BASE_URL = (configuredApiUrl || fallbackApiUrl).replace(/\/+$/, "");

const TOKEN_KEY = "cmt_access_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// [API-AUDIT] A 401 from these endpoints means "wrong credentials", not
// "your session expired", so it must not trigger the session-expired flow.
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// [API-AUDIT] One place that classifies a failure, so every page and the
// shared error components agree on what happened.
export function errorKind(status, { timedOut = false, cancelled = false } = {}) {
  if (cancelled) return "cancelled";
  if (timedOut) return "timeout";
  if (status === null || status === undefined) return "network";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "client";
}

const DEFAULT_MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  timeout: "The server took too long to respond. Please try again.",
  cancelled: "Request was cancelled.",
  unauthorized: "Your session has expired. Please log in again.",
  forbidden: "You don't have permission to do that.",
  not_found: "We couldn't find what you were looking for.",
  validation: "Some of the information you entered isn't valid.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  server: "Something went wrong on our side. Please try again shortly.",
  client: "The request could not be completed.",
};

// [API-AUDIT] Error shape is now { status, kind, message, errors, retryable,
// data, cause }. status/message/errors/data/cause are unchanged, so existing
// pages keep working. `kind` and `retryable` are new.
function normalizeError({
  error = null,
  response = null,
  data = null,
  method = "GET",
  timedOut = false,
  cancelled = false,
}) {
  const status = response?.status ?? null;
  const kind = errorKind(status, { timedOut, cancelled });
  const isSafeMethod = method === "GET" || method === "HEAD";

  return {
    status,
    kind,
    message:
      (data && typeof data.message === "string" && data.message) ||
      DEFAULT_MESSAGES[kind],
    errors: data?.errors || {},
    // Retry is only offered for reads. Never auto-retry a POST/PUT/DELETE.
    retryable:
      isSafeMethod &&
      ["network", "timeout", "server", "rate_limited"].includes(kind),
    data,
    cause: error,
  };
}

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);
}

// [API-AUDIT] Used by file downloads (moved here from submissionsApi).
function fileNameFromDisposition(disposition) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const normalMatch = disposition.match(/filename="?([^";]+)"?/i);
  return normalMatch?.[1] || null;
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    signal,
    headers: customHeaders = {},
    // [API-AUDIT] "json" (default) or "blob" for file downloads.
    responseType = "json",
  } = options;

  const apiPath = path.startsWith("/") ? path : `/${path}`;
  const url = buildUrl(apiPath);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const token = tokenStore.get();

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  // [API-AUDIT] File uploads can legitimately take longer than 15s.
  const timeoutMs = options.timeoutMs ?? (isFormData || responseType === "blob" ? 60000 : 15000);

  const headers = {
    // [API-AUDIT] Keep JSON first for downloads so Laravel returns JSON
    // errors (not an HTML redirect) when the token is missing or invalid.
    Accept:
      responseType === "blob"
        ? "application/json, application/octet-stream;q=0.9, */*;q=0.8"
        : "application/json",
    ...customHeaders,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();

  let timedOut = false;

  const parentAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", parentAbort, { once: true });
    }
  }

  const timeoutId =
    timeoutMs > 0
      ? window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });

    // [API-AUDIT] Successful file download: hand back the blob + file name.
    if (response.ok && responseType === "blob") {
      return {
        blob: await response.blob(),
        fileName: fileNameFromDisposition(
          response.headers.get("Content-Disposition")
        ),
      };
    }

    const raw = await response.text();

    let data = null;
    let parsedAsJson = true;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        parsedAsJson = false;
        // [API-AUDIT] Previously the raw body became the error message, so a
        // Laravel HTML error page (with stack trace) could reach the user.
        // Only keep non-JSON text for successful responses.
        data = response.ok ? { message: raw } : null;
      }
    }

    // Automatically clear an expired authentication session.
    // [API-AUDIT] Ignore login/register/reset: a 401 there is not an expiry.
    if (
      response.status === 401 &&
      tokenStore.get() &&
      !PUBLIC_AUTH_PATHS.includes(apiPath)
    ) {
      tokenStore.clear();
      window.dispatchEvent(
        new CustomEvent("cmt:unauthorized", { detail: { path: apiPath } })
      );
    }

    // [API-AUDIT] New: lets the app show "Access denied" without logging out.
    if (response.status === 403) {
      window.dispatchEvent(
        new CustomEvent("cmt:forbidden", { detail: { path: apiPath } })
      );
    }

    if (!response.ok) {
      throw normalizeError({
        response,
        data: parsedAsJson ? data : null,
        method,
      });
    }

    return data;
  } catch (error) {
    // Already normalized above.
    if (error?.status !== undefined) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw normalizeError({
        error,
        method,
        timedOut,
        cancelled: !timedOut,
      });
    }

    throw normalizeError({ error, method });
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    if (signal) {
      signal.removeEventListener("abort", parentAbort);
    }
  }
}

export const http = {
  get: (path, options) => request(path, { ...options, method: "GET" }),

  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),

  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),

  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),

  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };