import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStore } from "../api/client";
import { AuthContext } from "./authContextInstance";

function unwrapUser(response) {
  return response?.data ?? response?.user ?? response ?? null;
}

function unwrapLogin(response) {
  const data = response?.data ?? response ?? {};

  return {
    token: data?.token ?? data?.access_token,
    user: data?.user ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("initializing");
  const [authError, setAuthError] = useState(null);

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
        throw new Error("The API did not return a current user.");
      }

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
    refreshUser().catch(() => {
      setStatus("unauthenticated");
    });
  }, [refreshUser]);

  const login = useCallback(
    async (credentials) => {
      setAuthError(null);

      const response = await authApi.login(credentials);
      const { token, user: returnedUser } = unwrapLogin(response);

      if (!token) {
        throw {
          status: response?.status ?? null,
          message:
            "Login succeeded but the API response did not include a token.",
          errors: {},
        };
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
    },
    [refreshUser]
  );

  const register = useCallback(async (payload) => {
    setAuthError(null);
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (tokenStore.get()) {
        await authApi.logout();
      }
    } catch (error) {
      // Logout locally even if the API request fails.
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
      isAuthenticated: status === "authenticated",
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
      {children}
    </AuthContext.Provider>
    
    
  );
  
}
export function useAuth() {
  return useContext(AuthContext);
}
