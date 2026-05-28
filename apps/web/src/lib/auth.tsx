import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut as amplifySignOut,
  signUp
} from "aws-amplify/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RuntimeConfig } from "./runtime-config";

export type AppUser = {
  id: string;
  email: string;
  role: "user" | "admin";
};

type AuthContextValue = {
  status: "loading" | "anonymous" | "authenticated";
  user: AppUser | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const localUserKey = "launchkit.localUser";

export function AuthProvider({
  children,
  config
}: {
  children: React.ReactNode;
  config: RuntimeConfig;
}) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<AppUser | null>(null);

  const refreshUser = useCallback(async () => {
    if (config.authMode === "local") {
      const saved = window.localStorage.getItem(localUserKey);
      setUser(saved ? (JSON.parse(saved) as AppUser) : null);
      setStatus(saved ? "authenticated" : "anonymous");
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload ?? {};
      const accessPayload = session.tokens?.accessToken.payload ?? {};
      const groups = normalizeGroups(accessPayload["cognito:groups"]);

      setUser({
        id: currentUser.userId,
        email: String(payload.email ?? currentUser.username),
        role: groups.includes("admin") ? "admin" : "user"
      });
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, [config.authMode]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (config.authMode === "local") {
        const role = email.toLowerCase().includes("admin") ? "admin" : "user";
        const localUser = {
          id: role === "admin" ? "local-admin" : "local-user",
          email,
          role
        } satisfies AppUser;
        window.localStorage.setItem(localUserKey, JSON.stringify(localUser));
        setUser(localUser);
        setStatus("authenticated");
        return;
      }

      await signIn({ username: email, password });
      await refreshUser();
    },
    [config.authMode, refreshUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signInWithEmail,
      signUpWithEmail: async (email, password) => {
        if (config.authMode === "local") {
          await signInWithEmail(email, password);
          return;
        }

        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email
            }
          }
        });
      },
      confirmEmail: async (email, code) => {
        if (config.authMode === "local") {
          return;
        }

        await confirmSignUp({ username: email, confirmationCode: code });
      },
      signOut: async () => {
        if (config.authMode === "local") {
          window.localStorage.removeItem(localUserKey);
        } else {
          await amplifySignOut();
        }

        setUser(null);
        setStatus("anonymous");
      },
      getAccessToken: async () => {
        if (config.authMode === "local") {
          return null;
        }

        const session = await fetchAuthSession();
        return session.tokens?.idToken?.toString() ?? null;
      }
    }),
    [config.authMode, refreshUser, signInWithEmail, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}

function normalizeGroups(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim());
  }

  return [];
}
