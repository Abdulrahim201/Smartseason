import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initAuth(); }, []);

  const initAuth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) { setLoading(false); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        await refreshToken();
      } else {
        await fetchUser();
      }
    } catch { logout(); }
    finally { setLoading(false); }
  };

  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) { logout(); return; }
    const res = await api.post("/api/token/refresh/", { refresh });
    localStorage.setItem(ACCESS_TOKEN, res.data.access);
    await fetchUser();
  };

  const fetchUser = async () => {
    const res = await api.get("/api/me/");
    setUser(res.data);
  };

  const login = async (username, password) => {
    const res = await api.post("/api/token/", { username, password });
    localStorage.setItem(ACCESS_TOKEN, res.data.access);
    localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
    await fetchUser();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
