const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

const AUTH_TOKEN_KEY = "cmt_auth_token";

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getApiErrorMessage(error) {
  const validationMessage = Object.values(error?.errors || {})
    .flat()
    .find(Boolean);

  return (
    validationMessage ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Could not connect to the server. Make sure the Laravel backend is running.",
      0
    );
  }

  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "The request could not be completed.",
      response.status,
      payload?.errors || {}
    );
  }

  return payload;
}