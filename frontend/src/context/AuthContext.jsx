import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const api = axios.create({
  baseURL: "http://localhost:3001/api/auth",
  timeout: 10000,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("aniview_token"));
  const [loading, setLoading] = useState(true);

  // Set auth header whenever token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("aniview_token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("aniview_token");
    }
  }, [token]);

  // Fetch profile on mount if token exists
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/profile")
      .then(({ data }) => setUser(data.user))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post("/register", { username, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const { data } = await api.put("/profile", updates);
    setUser(data.user);
    return data.user;
  };

  const addFavorite = async (anime) => {
    const { data } = await api.post("/favorites", {
      animeId: anime.animeId,
      animeTitle: anime.title,
      animeThumbnail: anime.thumbnail || anime.cover,
    });
    setUser(data.user);
  };

  const removeFavorite = async (animeId) => {
    const { data } = await api.delete(`/favorites/${animeId}`);
    setUser(data.user);
  };

  const addWatchHistory = async (anime, episodeNumber) => {
    if (!token) return;
    await api.post("/watch-history", {
      animeId: anime.animeId || anime.id,
      animeTitle: anime.title,
      animeThumbnail: anime.thumbnail || anime.cover,
      episodeNumber,
    });
  };

  const isFavorite = (animeId) => {
    return user?.favorites?.some((f) => f.animeId === animeId) || false;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout, updateProfile,
      addFavorite, removeFavorite, isFavorite, addWatchHistory,
      isAdmin: user?.role === "admin",
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
