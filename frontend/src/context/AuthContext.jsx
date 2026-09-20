<<<<<<< HEAD
import { useCallback, useEffect, useState } from "react";
=======
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

>>>>>>> origin/main
import { authApi } from "../api/authApi";
import { tokenStore } from "../api/client";
import { AuthContext } from "./authContextInstance";

<<<<<<< HEAD
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
=======
function unwrapUser(response) {
  const data = response?.data ?? response ?? null;

  if (!data) {
    return null;
  }

  return data?.user ?? data;
}

function unwrapLogin(response) {
  const data = response?.data ?? response ?? {};

  return {
    token:
      data?.token ??
      data?.access_token ??
      data?.data?.token ??
      data?.data?.access_token ??
      null,

    user:
      data?.user ??
      data?.data?.user ??
      null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [status, setStatus] = useState(
    "initializing"
  );

  const [authError, setAuthError] =
    useState(null);

  const refreshUser = useCallback(async () => {
    const token = tokenStore.get();

    if (!token) {
      setUser(null);
      setStatus("unauthenticated");

      return null;
    }

    try {
      const response = await authApi.me();

      const currentUser = unwrapUser(response);

      if (!currentUser) {
        throw new Error(
          "The API did not return a current user."
        );
      }

      setUser(currentUser);
      setStatus("authenticated");

      return currentUser;
    } catch (error) {
      tokenStore.clear();

      setUser(null);
      setStatus("unauthenticated");

>>>>>>> origin/main
      throw error;
    }
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    const token = localStorage.getItem("token") || (tokenStore.get ? tokenStore.get() : null);
    if (token) {
      refreshUser().catch(() => {
        setStatus("unauthenticated");
      });
    } else {
      setStatus("unauthenticated");
    }
=======
    refreshUser().catch(() => {
      setStatus("unauthenticated");
    });
>>>>>>> origin/main
  }, [refreshUser]);

  const login = useCallback(
    async (credentials) => {
<<<<<<< HEAD
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
=======
      setAuthError(null);

      const response = await authApi.login(
        credentials
      );

      const {
        token,
        user: returnedUser,
      } = unwrapLogin(response);

      if (!token) {
        const error = new Error(
          "Login succeeded but the API response did not include a token."
        );

        error.status = response?.status ?? null;
        error.errors = {};

        throw error;
      }

      tokenStore.set(token);

      try {
        if (returnedUser) {
          setUser(returnedUser);
          setStatus("authenticated");

          return returnedUser;
        }

        return await refreshUser();
      } catch (error) {
        tokenStore.clear();

        setUser(null);
        setStatus("unauthenticated");

        throw error;
      }
>>>>>>> origin/main
    },
    [refreshUser]
  );

<<<<<<< HEAD
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
=======
  const register = useCallback(
    async (payload) => {
      setAuthError(null);

      return authApi.register(payload);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStore.get()) {
        await authApi.logout();
      }
    } catch (error) {
      console.error(
        "Server logout failed. Local session will still be cleared.",
        error
      );
    } finally {
      tokenStore.clear();

      setUser(null);
      setStatus("unauthenticated");
      setAuthError(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      authError,

      setAuthError,

      login,
      register,
      logout,
      refreshUser,

      isAuthenticated:
        status === "authenticated",

      role: user?.role ?? null,
    }),
    [
      user,
      status,
      authError,
      login,
      register,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
>>>>>>> origin/main
      {children}
    </AuthContext.Provider>
  );
}
<<<<<<< HEAD
//ntuthuko939
=======

export function useAuth() {
  return useContext(AuthContext);
}
>>>>>>> origin/main
