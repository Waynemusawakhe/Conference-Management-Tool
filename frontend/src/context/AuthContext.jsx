import { useCallback, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStore } from "../api/client";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("initializing");

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      const currentUser = response.data ?? response.user ?? response;
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch (error) {
      localStorage.removeItem("token");
      if (tokenStore?.clear) tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
      throw error;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || (tokenStore.get ? tokenStore.get() : null);
    if (token) {
      refreshUser().catch(() => {
        setStatus("unauthenticated");
      });
    } else {
      setStatus("unauthenticated");
    }
  }, [refreshUser]);

  const login = useCallback(
    async (credentials) => {
      const response = await authApi.login(credentials);
      const token = response.token ?? response.access_token ?? response.data?.token;

      if (!token) {
        throw new Error("No token in login response. Check Swagger and update AuthContext.");
      }

      // Explicitly persist token in localStorage
      localStorage.setItem("token", token);
      if (tokenStore?.set) {
        tokenStore.set(token);
      }

      const loggedInUser = response.user ?? response.data?.user;
      if (loggedInUser) {
        setUser(loggedInUser);
        setStatus("authenticated");
        return loggedInUser;
      }

      return await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore network errors
    } finally {
      localStorage.removeItem("token");
      if (tokenStore?.clear) tokenStore.clear();
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
//ntuthuko939