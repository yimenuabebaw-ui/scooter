import { AdminUser } from "./types";

const tokenKey = "scooter_admin_token";
const adminKey = "scooter_admin_user";
const cookieName = "scooter_admin_token";

export const getStoredToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(tokenKey) ?? "";
};

export const getStoredAdmin = (): AdminUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(adminKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
};

export const persistAuth = (token: string, admin: AdminUser) => {
  window.localStorage.setItem(tokenKey, token);
  window.localStorage.setItem(adminKey, JSON.stringify(admin));
  document.cookie = `${cookieName}=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
};

export const clearAuthStorage = () => {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(adminKey);
  document.cookie = `${cookieName}=; path=/; max-age=0; samesite=lax`;
};
