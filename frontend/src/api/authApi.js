import { http } from "./client";

export const authApi = {
  register: (body) =>
    http.post(
      "/auth/register",
      body
    ),

 
  login: (body) =>
    http.post(
      "/auth/login",
      body
    ),

  setupMfa: () => http.post("/auth/mfa/setup", {}),
  confirmMfa: (code) => http.post("/auth/mfa/confirm", { code }),
  disableMfa: (body) => http.delete("/auth/mfa", { body }),

  logout: (token = null) =>
    http.post(
      "/auth/logout",
      {},
      {
        timeoutMs: 4000,

        headers: token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {},
      }
    ),

  me: () =>
    http.get("/auth/me"),

  forgotPassword: (body) =>
    http.post(
      "/auth/forgot-password",
      body
    ),

  resetPassword: (body) =>
    http.post(
      "/auth/reset-password",
      body
    ),

  updateProfile: (body) =>
    http.patch(
      "/auth/me",
      body
    ),

  changePassword: (body) =>
    http.put(
      "/auth/password",
      body
    ),

  deleteAccount: (
    currentPassword
  ) =>
    http.delete(
      "/auth/me",
      {
        body: {
          current_password:
            currentPassword,
        },
      }
    ),
};
