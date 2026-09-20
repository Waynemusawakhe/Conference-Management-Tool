import { http } from "./client";

export const authApi = {
  register: (body) => http.post("/v1/auth/register", body),
  login: (body) => http.post("/v1/auth/login", body),
  logout: () => http.post("/v1/auth/logout", {}),
  me: () => http.get("/v1/auth/me"),
  forgotPassword: (body) => http.post("/v1/auth/forgot-password", body),
  resetPassword: (body) => http.post("/v1/auth/reset-password", body),
};
//ntuthuko939
