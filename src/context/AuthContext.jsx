import { createContext, useContext, useMemo, useState } from "react";
import { loginCompany, signupCompany } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "nudgeai-company-auth";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  async function login({ email, password }) {
    const result = await loginCompany({ email, password });
    const nextUser = {
      companyId: result.tenant.id,
      name: result.tenant.name,
      email: result.tenant.email,
      apiKey: result.api_key,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  async function signup({ name, email, password }) {
    const result = await signupCompany({ name, email, password });
    const nextUser = {
      companyId: result.tenant.id,
      name: result.tenant.name,
      email: result.tenant.email,
      apiKey: result.api_key,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
