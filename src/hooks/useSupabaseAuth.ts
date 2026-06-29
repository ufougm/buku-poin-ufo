import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, IS_LIVE, type DbUserProfile } from "@/lib/supabase";
import { useLocalData } from "./useLocalData";

export function useSupabaseAuth() {
  const local = useLocalData();
  const [user, setUser] = useState<DbUserProfile | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    // If no Supabase credentials, skip auth check and go straight to demo
    if (!IS_LIVE) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          console.warn("Supabase auth error:", error.message);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setSessionUser(session.user);
          // Fetch profile
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("auth_id", session.user.id)
              .single();
            if (!cancelled) {
              if (data) setUser(data as DbUserProfile);
              setLoading(false);
            }
          } catch {
            if (!cancelled) setLoading(false);
          }
        } else {
          if (!cancelled) setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to connect to Supabase:", err);
        if (!cancelled) setLoading(false);
      }
    };

    checkSession();

    // Set a safety timeout in case Supabase hangs
    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn("Supabase auth check timed out, falling back to demo mode");
        setLoading(false);
      }
    }, 5000);

    let listener: any;
    try {
      const { data: l } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          setSessionUser(session.user);
        } else {
          setUser(null);
          setSessionUser(null);
        }
      });
      listener = l;
    } catch {
      // ignore listener errors
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      listener?.subscription?.unsubscribe();
    };
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
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) return { error };

      if (data.user) {
        await supabase.from("profiles").upsert({
          auth_id: data.user.id,
          email,
          full_name: fullName,
          role,
        });
      }
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
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err: any) {
      return { error: { message: err.message || "Login failed" } };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!IS_LIVE) {
      local.logoutMock();
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSessionUser(null);
  }, []);

  // Determine effective role (Supabase user > mock user > null)
  const effectiveRole = (user?.role || (local.mockUser as any)?.role || null) as "user" | "mentor" | "psdm" | null;
  const isAuthenticated = !!user || !!local.mockUser;

  return useMemo(
    () => ({
      user,
      sessionUser,
      isAuthenticated,
      isLoading: loading,
      isPsdm: effectiveRole === "psdm",
      isMentor: effectiveRole === "mentor",
      isUser: effectiveRole === "user",
      role: effectiveRole,
      signUp,
      signIn,
      signOut,
      isLive: IS_LIVE,
      isDemo: !IS_LIVE,
    }),
    [user, sessionUser, loading, effectiveRole, isAuthenticated, signUp, signIn, signOut]
  );
}
