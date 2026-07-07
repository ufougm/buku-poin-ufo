import { useState, useEffect, useMemo } from "react";

// ─── Session User Type ────────────────────────────────────────────
export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  angkatan?: number;
  divisi?: string;
  isPreRegistered: boolean;
}

const SESSION_KEY = "ukm_session_user";

function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("ukm_mock_user"); // legacy cleanup
}

// Effective role: psdm_pemandu → psdm for routing
function getEffectiveRole(role: string): string {
  if (role === "psdm_pemandu") return "psdm";
  return role;
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(getSessionUser);

  useEffect(() => {
    const handler = () => setUser(getSessionUser());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const effectiveRole = user ? getEffectiveRole(user.role) : null;

  const isAuthenticated = !!user;
  const isPsdm = effectiveRole === "psdm";
  const isMentor = user?.role === "pemandu" || user?.role === "psdm_pemandu";
  const isUser = effectiveRole === "user";

  const role = effectiveRole;

  const logout = () => {
    clearSession();
    setUser(null);
    window.location.href = "#/login";
  };

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isPsdm,
      isMentor,
      isUser,
      role,
      logout,
    }),
    [user, isAuthenticated, isPsdm, isMentor, isUser, role]
  );
}
