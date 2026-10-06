import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  authApi,
} from "../api/authApi";

import {
  tokenStore,
} from "../api/client";

import {
  AuthContext,
} from "./authContextInstance";

function normalizeRole(role) {
  return typeof role ===
    "string"
    ? role
        .trim()
        .toLowerCase()
    : role ?? null;
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    role:
      normalizeRole(
        user.role
      ),
  };
}

function unwrapUser(response) {
  return normalizeUser(
    response?.data ??
      response?.user ??
      response ??
      null
  );
}

function unwrapLogin(response) {
  const data =
    response?.data ??
    response ??
    {};

  return {
    token:
      data?.token ??
      data?.access_token,

    user:
      normalizeUser(
        data?.user ??
          null
      ),
  };
}

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    status,
    setStatus,
  ] = useState(
    "initializing"
  );

  const [
    authError,
    setAuthError,
  ] = useState(null);

  const clearLocalSession =
    useCallback(() => {
      tokenStore.clear();

      setUser(null);

      setStatus(
        "unauthenticated"
      );

      setAuthError(null);
    }, []);

  const refreshUser =
    useCallback(
      async () => {
        const token =
          tokenStore.get();

        if (!token) {
          clearLocalSession();
          return null;
        }

        try {
          const response =
            await authApi.me();

          const currentUser =
            unwrapUser(
              response
            );

          if (!currentUser) {
            throw new Error(
              "The API did not return a current user."
            );
          }

          setUser(
            currentUser
          );

          setStatus(
            "authenticated"
          );

          return currentUser;
        } catch (error) {
          clearLocalSession();

          throw error;
        }
      },
      [
        clearLocalSession,
      ]
    );

  useEffect(() => {
    refreshUser().catch(
      () => {
        setStatus(
          "unauthenticated"
        );
      }
    );
  }, [refreshUser]);

  /*
   * Any API call returning 401
   * automatically signs the user
   * out locally.
   */
  useEffect(() => {
    const handleUnauthorized =
      () => {
        clearLocalSession();
      };

    window.addEventListener(
      "cmt:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "cmt:unauthorized",
        handleUnauthorized
      );
    };
  }, [clearLocalSession]);

  const login =
    useCallback(
      async (
        credentials
      ) => {
        setAuthError(null);

        const response =
          await authApi.login(
            credentials
          );

        const {
          token,
          user:
            returnedUser,
        } =
          unwrapLogin(
            response
          );

        if (!token) {
          throw {
            status:
              response?.status ??
              null,

            message:
              "Login succeeded but the API response did not include a token.",

            errors: {},
          };
        }

        tokenStore.set(
          token
        );

        try {
          if (
            returnedUser
          ) {
            setUser(
              returnedUser
            );

            setStatus(
              "authenticated"
            );

            return returnedUser;
          }

          return await refreshUser();
        } catch (error) {
          clearLocalSession();

          throw error;
        }
      },
      [
        refreshUser,
        clearLocalSession,
      ]
    );

  const register =
    useCallback(
      async (payload) => {
        setAuthError(null);

        return authApi.register(
          payload
        );
      },
      []
    );

  /*
   * IMPORTANT:
   *
   * Local logout happens immediately.
   * We do NOT make the user wait for
   * the API before changing screens.
   *
   * Server token revocation continues
   * in the background.
   */
  const logout =
    useCallback(() => {
      const token =
        tokenStore.get();

      clearLocalSession();

      if (token) {
        void authApi
          .logout(token)
          .catch(() => {
            /*
             * Local logout already
             * succeeded.
             */
          });
      }
    }, [
      clearLocalSession,
    ]);

  const value =
    useMemo(
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
          status ===
          "authenticated",

        role:
          user?.role ??
          null,
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
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}