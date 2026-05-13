import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refreshUser() {
    const { data } = await api.get("/profile/me");
    setUser(data.data);
    return data.data;
  }

  useEffect(() => {
    const token = localStorage.getItem("fraud_token");
    if (!token) return;

    let active = true;
    setLoading(true);
    refreshUser()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("fraud_token");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // ✅ LOGIN
  async function login(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", payload);

      localStorage.setItem("fraud_token", data.token);
      setUser(data.data); // backend returns data.data

      return data.data;
    } finally {
      setLoading(false);
    }
  }

  // ✅ SEND OTP
  async function sendOTP(email) {
    return api.post("/auth/sendotp", { email }); // ⚠️ lowercase sendotp
  }

  // ✅ REGISTER
  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", payload);

      // backend does NOT return token
      return data;
    } finally {
      setLoading(false);
    }
  }

  // ✅ LOGOUT
  function logout() {
    localStorage.removeItem("fraud_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      sendOTP,
      refreshUser,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
