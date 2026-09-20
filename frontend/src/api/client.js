<<<<<<< HEAD
import axios from 'axios';

let accessToken = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token) => { accessToken = token; },
  clear: () => { accessToken = null; },
};

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        status: null,
        message: 'Network request failed.',
        errors: {},
        cause: error,
      });
    }

    const { status, data } = error.response;
    return Promise.reject({
      status,
      message: data?.message || `Request failed (${status}).`,
      errors: data?.errors || {},
      data,
    });
  }
);

export async function request(method, url, options = {}) {
  const { body, params, signal, ...config } = options;
  const response = await apiClient.request({
    method,
    url,
    params,
    signal,
    data: body,
    ...config,
  });
  return response.data;
}

export const http = {
  get: (url, options) => request('GET', url, options),
  post: (url, body, options) => request('POST', url, { ...options, body }),
  put: (url, body, options) => request('PUT', url, { ...options, body }),
  patch: (url, body, options) => request('PATCH', url, { ...options, body }),
  delete: (url, options) => request('DELETE', url, options),
};
//ntuthuko939
=======
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

const TOKEN_KEY = "cmt_access_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function normalizeError(error, response, data) {
  return {
    status: response?.status ?? error?.status ?? null,
    message:
      data?.message ||
      (error?.name === "AbortError"
        ? "Request was cancelled."
        : "Network request failed."),
    errors: data?.errors || {},
    data,
    cause: error,
  };
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    signal,
    headers: customHeaders = {},
  } = options;

  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );

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

  const headers = {
    Accept: "application/json",
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do NOT set Content-Type manually for FormData.
  // The browser must add the multipart boundary.
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

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
      signal,
    });

    const raw = await response.text();

    let data = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    if (!response.ok) {
      throw normalizeError(null, response, data);
    }

    return data;
  } catch (error) {
    if (error?.status !== undefined) {
      throw error;
    }

    throw normalizeError(error);
  }
}

export const http = {
  get: (path, options) =>
    request(path, {
      ...options,
      method: "GET",
    }),

  post: (path, body, options) =>
    request(path, {
      ...options,
      method: "POST",
      body,
    }),

  put: (path, body, options) =>
    request(path, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: (path, body, options) =>
    request(path, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: (path, options) =>
    request(path, {
      ...options,
      method: "DELETE",
    }),
};

export { API_BASE_URL };
>>>>>>> origin/main
