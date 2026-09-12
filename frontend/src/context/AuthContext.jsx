import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("initializing");

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();

      // CHANGE THIS LINE after checking Swagger:
      // If /auth/me returns { data: {...user} }, use response.data
      // If it returns { user: {...} }, use response.user
      // If it returns the user directly, use response
      const currentUser = response.data ?? response.user ?? response;

      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch (error) {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
      throw error;
    }
  }, []);

  useEffect(() => {
    // No token in memory on first load, so user starts unauthenticated.
    // (In-memory tokens do not survive a page refresh.)
    setStatus("unauthenticated");
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await authApi.login(credentials);

      // CHANGE THIS LINE after checking Swagger:
      // If login returns { token: "..." }, keep response.token
      // If it returns { access_token: "..." }, use response.access_token
      // If it returns { data: { token: "..." } }, use response.data.token
      const token = response.token ?? response.access_token ?? response.data?.token;

      if (!token) {
        throw new Error("No token in login response. Check Swagger and update AuthContext.");
      }

      tokenStore.set(token);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore network errors, still clear local state.
    } finally {
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}