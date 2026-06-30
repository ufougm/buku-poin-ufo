import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, IS_LIVE, type DbUserProfile } from "@/lib/supabase";
import { useLocalData } from "./useLocalData";

export function useSupabaseAuth() {
  const local = useLocalData();
  const [user, setUser] = useState<DbUserProfile | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!IS_LIVE) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && loading) setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (cancelled) return;
      if (error || !session?.user) { setLoading(false); return; }
      setSessionUser(session.user);
      supabase.from("profiles").select("*").eq("auth_id", session.user.id).single()
        .then(({ data }) => { if (!cancelled) { if (data) setUser(data as DbUserProfile); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }).catch(() => { if (!cancelled) setLoading(false); });

    let listener: any;
    try {
      const { data: l } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) setSessionUser(session.user);
        else { setUser(null); setSessionUser(null); }
      });
      listener = l;
    } catch { /* ignore */ }

    return () => { cancelled = true; clearTimeout(timeout); listener?.subscription?.unsubscribe(); };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: "user" | "mentor" | "psdm" = "user") => {
    if (!IS_LIVE) {
      local.loginMock({
        id: Math.floor(Math.random() * 9000) + 1000,
        unionId: `demo_${Date.now()}`,
        name: fullName,
        email,
        role,
      });
      // Force navigation after login
      setTimeout(() => window.location.reload(), 100);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) return { error };
      if (data.user) {
        await supabase.from("profiles").upsert({ auth_id: data.user.id, email, full_name: fullName, role });
      }
      window.location.reload();
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || "Registration failed" } };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!IS_LIVE) {
      local.loginMock({
        id: Math.floor(Math.random() * 9000) + 1000,
        unionId: `demo_${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: "user",
      });
      // Force navigation after login
      setTimeout(() => window.location.reload(), 100);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) window.location.reload();
      return { error };
    } catch (err: any) {
      return { error: { message: err.message || "Login failed" } };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!IS_LIVE) { local.logoutMock(); return; }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setUser(null); setSessionUser(null);
    window.location.reload();
  }, []);

  const effectiveRole = (user?.role || (local.mockUser as any)?.role || null) as "user" | "pemandu" | "psdm" | null;
  const isAuthenticated = !!user || !!local.mockUser;

  return useMemo(() => ({
    user,
    sessionUser,
    isAuthenticated,
    isLoading: loading,
    isPsdm: effectiveRole === "psdm",
    isMentor: effectiveRole === "pemandu",
    isUser: effectiveRole === "user",
    role: effectiveRole,
    signUp,
    signIn,
    signOut,
    isLive: IS_LIVE,
    isDemo: !IS_LIVE,
  }), [user, sessionUser, loading, effectiveRole, isAuthenticated, signUp, signIn, signOut]);
}
