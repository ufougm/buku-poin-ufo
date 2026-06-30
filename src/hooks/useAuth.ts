import { useState, useEffect, useMemo } from "react";

export interface MockUser {
  id: number;
  unionId: string;
  name: string;
  email: string;
  role: "user" | "pemandu" | "psdm";
}

function getMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem("ukm_mock_user");
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(getMockUser);

  // Listen for storage changes (in case another tab logs in/out)
  useEffect(() => {
    const handler = () => setUser(getMockUser());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isPsdm = user?.role === "psdm";
  const isMentor = user?.role === "pemandu";
  const isUser = user?.role === "user";

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: false, // never loading - instant read from localStorage
      isPsdm,
      isMentor,
      isUser,
      role: user?.role || null,
      logout: () => {
        localStorage.removeItem("ukm_mock_user");
        window.location.reload();
      },
    }),
    [user, isPsdm, isMentor, isUser]
  );
}
