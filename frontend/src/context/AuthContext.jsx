"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/api";

const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => { },
  logout: () => { },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user sudah login saat app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          // Fetch fresh user data from backend
          try {
            const freshProfile = await authApi.getProfile();
            if (freshProfile) {
              setUser(freshProfile);
              localStorage.setItem("userData", JSON.stringify(freshProfile));
            } else {
              // Fallback to local storage if API returns nothing (unlikely)
              const userData = localStorage.getItem("userData");
              if (userData) {
                setUser(JSON.parse(userData));
              }
            }
          } catch (apiError) {
            console.error("Failed to fetch fresh profile:", apiError);
            // Fallback to local storage if API fails
            const userData = localStorage.getItem("userData");
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Simpan userData ke localStorage
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
