"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const SESSION_KEY = "skillscatalyst_user_session";

export type UserRole = "student" | "faculty";

export interface UserSession {
  email?: string;
  user_id: string;
  name?: string;
  role: UserRole;
  loggedInAt: string;
  roll_number?: string;
  department?: string;
  college?: string;
  attendance?: number;
  leetcode_solved?: number;
  gfg_solved?: number;
  codechef_solved?: number;
  hackerrank_score?: number;
  codeforces_solved?: number;
  github_repos?: number;
  github_commits?: number;
  coding_score?: number;
  target_role?: string;
  user_data?: Record<string, any>;
}

interface AuthContextValue {
  session: UserSession | null;
  isLoading: boolean;
  unverifiedEmail: string | null;
  login: (email: string, userId: string, name?: string, role?: UserRole, extraData?: Record<string, any>) => void;
  logout: () => void;
  clearUnverifiedEmail: () => void;
  setUnverifiedEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  unverifiedEmail: null,
  login: () => {},
  logout: () => {},
  clearUnverifiedEmail: () => {},
  setUnverifiedEmail: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unverifiedEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed: UserSession = JSON.parse(raw);
        if (parsed?.user_id) {
          setSession(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
    setIsLoading(false);
  }, []);

  // Route guard
  useEffect(() => {
    if (isLoading) return;
    const isLoginPage = pathname === "/login";
    if (!session && !isLoginPage) {
      router.replace("/login");
    } else if (session && isLoginPage) {
      router.replace("/dashboard");
    }
  }, [session, isLoading, pathname, router]);

  const login = useCallback(
    (email: string, userId: string, name?: string, role: UserRole = "student", extraData?: Record<string, any>) => {
      const newSession: UserSession = {
        email,
        user_id: userId,
        name: name || email.split("@")[0],
        role,
        loggedInAt: new Date().toISOString(),
        roll_number: extraData?.roll_number || userId,
        department: extraData?.department,
        college: extraData?.college || "TKR College of Engineering & Technology",
        attendance: extraData?.attendance,
        leetcode_solved: extraData?.leetcode_solved,
        gfg_solved: extraData?.gfg_solved,
        codechef_solved: extraData?.codechef_solved,
        hackerrank_score: extraData?.hackerrank_score,
        codeforces_solved: extraData?.codeforces_solved,
        github_repos: extraData?.github_repos,
        github_commits: extraData?.github_commits,
        coding_score: extraData?.coding_score,
        target_role: extraData?.target_role || "Software Engineer",
        user_data: extraData
      };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      } catch {}
      setSession(newSession);
      router.replace("/dashboard");
    },
    [router]
  );

  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    setSession(null);
    try {
      queryClient.clear();
      localStorage.removeItem(SESSION_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("skillscatalyst_") || key.startsWith("sc_"))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    router.replace("/login");
  }, [router, queryClient]);

  const clearUnverifiedEmail = useCallback(() => {}, []);
  const setUnverifiedEmail = useCallback((_email: string | null) => {}, []);

  // On /login page: always render children immediately
  if (pathname === "/login") {
    return (
      <AuthContext.Provider
        value={{ session, isLoading, unverifiedEmail, login, logout, clearUnverifiedEmail, setUnverifiedEmail }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  // Protected pages: show loading screen while checking session
  if (isLoading || !session) {
    return (
      <AuthContext.Provider
        value={{ session, isLoading, unverifiedEmail, login, logout, clearUnverifiedEmail, setUnverifiedEmail }}
      >
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060a15] text-white">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
            LOADING SKILLSCATALYST...
          </p>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{ session, isLoading, unverifiedEmail, login, logout, clearUnverifiedEmail, setUnverifiedEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
