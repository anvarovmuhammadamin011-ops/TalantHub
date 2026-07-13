import { createContext, useContext, useState, useEffect } from "react";
import { getToken, setToken, api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api("/auth/me");
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const register = async (userData) => {
    try {
      const { token, user } = await api("/auth/register", { method: "POST", body: userData });
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Xatolik yuz berdi" };
    }
  };

  const login = async (email, password) => {
    try {
      const { token, user } = await api("/auth/login", { method: "POST", body: { email, password } });
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Xatolik yuz berdi" };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (fields) => {
    try {
      const { user } = await api("/auth/me", { method: "PATCH", body: fields });
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Xatolik yuz berdi" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, updateProfile, isLoggedIn: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
