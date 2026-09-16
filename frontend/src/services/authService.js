import { apiRequest } from "./api";

const AUTH_TOKEN_KEY = "cmt_auth_token";
const AUTH_USER_KEY = "cmt_auth_user";

export async function register({
  fullName,
  email,
  password,
  confirmPassword,
}) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: fullName.trim(),
      email: email.trim(),
      password,
      password_confirmation: confirmPassword,
      role: "author",
    }),
  });
}

export async function login({ email, password }) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  const session = response?.data;

  if (!session?.token || !session?.user) {
    throw new Error("The server returned an invalid login response.");
  }

  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(session.user)
  );

  return session.user;
}

export async function logout() {
  try {
    if (isAuthenticated()) {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    }
  } finally {
    clearSession();
  }
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function getStoredUser() {
  const value = localStorage.getItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    clearSession();
    return null;
  }
}

export function getDashboardPath(user = getStoredUser()) {
  if (user?.role === "author") {
    return "/author-dashboard";
  }

  return "/";
}