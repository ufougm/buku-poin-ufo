import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, type DbUserProfile } from "@/lib/supabase";
import { useLocalData } from "./useLocalData";

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL;

export function useSupabaseAuth() {
  const local = useLocalData();
  const [user, setUser] = useState<DbUserProfile | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    if (IS_DEMO) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setSessionUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", authId)
      .single();
    if (data) setUser(data as DbUserProfile);
    setLoading(false);
  };

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: "user" | "mentor" | "psdm" = "user") => {
    if (IS_DEMO) {
      local.loginMock({
        id: Math.floor(Math.random() * 9000) + 1000,
        unionId: `demo_${Date.now()}`,
        name: fullName,
        email,
        role,
      });
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error };

    // Create profile
    if (data.user) {
      await supabase.from("profiles").upsert({
        auth_id: data.user.id,
        email,
        full_name: fullName,
        role,
      });
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_DEMO) {
      local.loginMock({
        id: Math.floor(Math.random() * 9000) + 1000,
        unionId: `demo_${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: "user",
      });
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (IS_DEMO) {
      local.logoutMock();
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSessionUser(null);
  }, []);

  return useMemo(
    () => ({
      user,
      sessionUser,
      isAuthenticated: !!user || !!local.mockUser,
      isLoading: loading,
      isPsdm: (user?.role || (local.mockUser as any)?.role) === "psdm",
      isMentor: (user?.role || (local.mockUser as any)?.role) === "mentor",
      isUser: (user?.role || (local.mockUser as any)?.role) === "user",
      role: (user?.role || (local.mockUser as any)?.role || null) as "user" | "mentor" | "psdm" | null,
      signUp,
      signIn,
      signOut,
      isDemo: IS_DEMO,
    }),
    [user, sessionUser, loading, local.mockUser, signUp, signIn, signOut]
  );
}
