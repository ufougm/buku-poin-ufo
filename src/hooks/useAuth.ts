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
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate required fields - reject incomplete/corrupted sessions
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.id || typeof parsed.id !== "string") return null;
    if (!parsed.name || typeof parsed.name !== "string") return null;
    if (!parsed.role || typeof parsed.role !== "string") return null;
    // Session expiry: auto-logout after 7 days of inactivity
    const lastActive = localStorage.getItem(SESSION_KEY + "_ts");
    if (lastActive) {
      const daysSince = (Date.now() - Number(lastActive)) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        clearSession();
        return null;
      }
    }
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY + "_ts");
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

  // Update activity timestamp periodically while authenticated
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(SESSION_KEY + "_ts", String(Date.now()));
    const interval = setInterval(() => {
      localStorage.setItem(SESSION_KEY + "_ts", String(Date.now()));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [user]);

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
