import { trpc } from "@/providers/trpc";
import { useCallback, useMemo, useState, useEffect } from "react";

export interface MockUser {
  id: number;
  unionId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "mentor" | "psdm";
  mentorId?: number; // Which mentor profile to use (for mentor role)
}

const MOCK_USER_KEY = "ukm_mock_user";

function getMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

function setMockUser(user: MockUser | null) {
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
  }
}

export function useMockAuth() {
  const [mockUser, setMockUserState] = useState<MockUser | null>(getMockUser);

  useEffect(() => {
    const handler = () => setMockUserState(getMockUser());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const loginMock = useCallback((user: MockUser) => {
    setMockUser(user);
    setMockUserState(user);
  }, []);

  const logoutMock = useCallback(() => {
    setMockUser(null);
    setMockUserState(null);
    window.location.reload();
  }, []);

  return { mockUser, loginMock, logoutMock };
}

// Detect if we're on static deployment (no backend)
function isStaticDeployment(): boolean {
  if (typeof window !== "undefined") {
    return window.location.hostname.includes("kimi.page") || !window.location.port;
  }
  return false;
}

export function useAuth() {
  const utils = trpc.useUtils();
  const staticDeploy = isStaticDeployment();

  const {
    data: serverUser,
    isLoading: serverLoading,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !staticDeploy,
    refetchOnWindowFocus: false,
  });

  const { mockUser, loginMock, logoutMock } = useMockAuth();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const user = staticDeploy ? mockUser : serverUser ?? mockUser;
  const isLoading = staticDeploy ? false : serverLoading;

  const logout = useCallback(() => {
    if (!staticDeploy && serverUser) {
      logoutMutation.mutate();
    }
    logoutMock();
  }, [staticDeploy, serverUser, logoutMutation, logoutMock]);

  const isPsdm = user?.role === "psdm";
  const isMentor = user?.role === "mentor";
  const isUser = user?.role === "user";

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      error: staticDeploy ? null : error,
      logout,
      refresh: () => {},
      loginMock,
      isPsdm,
      isMentor,
      isUser,
      role: user?.role || null,
      isStaticDeployment: staticDeploy,
    }),
    [user, isLoading, error, logout, loginMock, isPsdm, isMentor, isUser, staticDeploy]
  );
}
