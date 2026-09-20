import { http } from "./client";

export const authApi = {
<<<<<<< HEAD
  register: (body) => http.post("/v1/auth/register", body),
  login: (body) => http.post("/v1/auth/login", body),
  logout: () => http.post("/v1/auth/logout", {}),
  me: () => http.get("/v1/auth/me"),
  forgotPassword: (body) => http.post("/v1/auth/forgot-password", body),
  resetPassword: (body) => http.post("/v1/auth/reset-password", body),
};
//ntuthuko939
=======
  register: (body) => http.post("/auth/register", body),
  login: (body) => http.post("/auth/login", body),
  logout: () => http.post("/auth/logout", {}),
  me: () => http.get("/auth/me"),
  forgotPassword: (body) => http.post("/auth/forgot-password", body),
  resetPassword: (body) => http.post("/auth/reset-password", body),
  updateProfile: (body) => http.patch("/auth/profile", body),
  changePassword: (body) => http.post("/auth/change-password", body),
};
>>>>>>> origin/main
