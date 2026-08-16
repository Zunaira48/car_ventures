import { useState, useEffect } from "react";
import api from "../api/client";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      setUserLoading(false);
      return;
    }
    let isMounted = true;
    setUserLoading(true);
    api.get("/auth/me")
      .then((res) => {
        if (isMounted) setUser(res.data);
      })
      .catch(() => {
        if (isMounted) {
          // token is invalid/expired - clear it so the app treats the user as logged out
          localStorage.removeItem("access_token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setUserLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    setToken(res.data.access_token);
  };

  const register = async (payload) => {
    await api.post("/auth/register", payload);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}