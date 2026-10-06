const configuredApiUrl =
  String(
    import.meta.env.VITE_API_BASE_URL || ""
  ).trim();

const fallbackApiUrl =
  import.meta.env.DEV
    ? "http://127.0.0.1:8000/api/v1"
    : "/api/v1";

const API_BASE_URL = (
  configuredApiUrl ||
  fallbackApiUrl
).replace(/\/+$/, "");

const TOKEN_KEY =
  "cmt_access_token";

export const tokenStore = {
  get: () =>
    localStorage.getItem(TOKEN_KEY),

  set: (token) =>
    localStorage.setItem(
      TOKEN_KEY,
      token
    ),

  clear: () =>
    localStorage.removeItem(
      TOKEN_KEY
    ),
};

function normalizeError(
  error,
  response,
  data,
  messageOverride = null
) {
  return {
    status:
      response?.status ??
      error?.status ??
      null,

    message:
      messageOverride ||
      data?.message ||
      (error?.name ===
      "AbortError"
        ? "Request was cancelled."
        : "Network request failed."),

    errors:
      data?.errors || {},

    data,

    cause: error,
  };
}

function buildUrl(path) {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return new URL(
    `${API_BASE_URL}${normalizedPath}`,
    window.location.origin
  );
}

export async function request(
  path,
  options = {}
) {
  const {
    method = "GET",
    body,
    params,
    signal,
    headers:
      customHeaders = {},
    timeoutMs = 15000,
  } = options;

  const url = buildUrl(path);

  if (params) {
    Object.entries(params)
      .forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            url.searchParams.set(
              key,
              String(value)
            );
          }
        }
      );
  }

  const token =
    tokenStore.get();

  const isFormData =
    typeof FormData !==
      "undefined" &&
    body instanceof FormData;

  const headers = {
    Accept:
      "application/json",
    ...customHeaders,
  };

  if (
    token &&
    !headers.Authorization
  ) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  if (
    body !== undefined &&
    !isFormData
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  const controller =
    new AbortController();

  let timedOut = false;

  const parentAbort = () =>
    controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener(
        "abort",
        parentAbort,
        {
          once: true,
        }
      );
    }
  }

  const timeoutId =
    timeoutMs > 0
      ? window.setTimeout(
          () => {
            timedOut = true;
            controller.abort();
          },
          timeoutMs
        )
      : null;

  try {
    const response =
      await fetch(
        url,
        {
          method,
          headers,

          body:
            body === undefined
              ? undefined
              : isFormData
                ? body
                : JSON.stringify(
                    body
                  ),

          signal:
            controller.signal,
        }
      );

    const raw =
      await response.text();

    let data = null;

    if (raw) {
      try {
        data =
          JSON.parse(raw);
      } catch {
        data = {
          message: raw,
        };
      }
    }

    /*
     * Automatically clear an expired
     * authentication session.
     */
    if (
      response.status === 401 &&
      tokenStore.get()
    ) {
      tokenStore.clear();

      window.dispatchEvent(
        new Event(
          "cmt:unauthorized"
        )
      );
    }

    if (!response.ok) {
      throw normalizeError(
        null,
        response,
        data
      );
    }

    return data;
  } catch (error) {
    if (
      error?.status !==
      undefined
    ) {
      throw error;
    }

    if (
      error?.name ===
      "AbortError"
    ) {
      throw normalizeError(
        error,
        null,
        null,
        timedOut
          ? "The server took too long to respond. Please try again."
          : "Request was cancelled."
      );
    }

    throw normalizeError(
      error
    );
  } finally {
    if (timeoutId) {
      window.clearTimeout(
        timeoutId
      );
    }

    if (signal) {
      signal.removeEventListener(
        "abort",
        parentAbort
      );
    }
  }
}

export const http = {
  get: (
    path,
    options
  ) =>
    request(path, {
      ...options,
      method: "GET",
    }),

  post: (
    path,
    body,
    options
  ) =>
    request(path, {
      ...options,
      method: "POST",
      body,
    }),

  put: (
    path,
    body,
    options
  ) =>
    request(path, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: (
    path,
    body,
    options
  ) =>
    request(path, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: (
    path,
    options
  ) =>
    request(path, {
      ...options,
      method: "DELETE",
    }),
};

export {
  API_BASE_URL,
};