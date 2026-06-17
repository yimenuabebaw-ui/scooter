"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  PropsWithChildren,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { clearAuthStorage, getStoredAdmin, getStoredToken, persistAuth } from "@/lib/auth-storage";
import { AdminUser } from "@/lib/types";

type AuthContextValue = {
  admin: AdminUser | null;
  token: string;
  isReady: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: (redirectTo?: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState("");
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedAdmin = getStoredAdmin();
    setToken(storedToken);
    setAdmin(storedAdmin);
    setIsReady(true);
  }, []);

  const logout = (redirectTo = "/login") => {
    clearAuthStorage();
    setToken("");
    setAdmin(null);
    startTransition(() => {
      router.replace(redirectTo);
      router.refresh();
    });
  };

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;

      if (pathname?.startsWith("/dashboard")) {
        toast.error(customEvent.detail?.message ?? "Your session expired");
        logout("/login");
      }
    };

    window.addEventListener("scooter-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("scooter-unauthorized", handleUnauthorized);
  }, [pathname]);

  const login = async (loginValue: string, password: string) => {
    const response = await apiRequest<{ token: string; admin: AdminUser }>("/auth/login", {
      method: "POST",
      body: {
        login: loginValue,
        password
      }
    });

    persistAuth(response.token, response.admin);
    setToken(response.token);
    setAdmin(response.admin);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isReady,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
