import { createContext, useContext, useMemo, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("tumornet_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated: Boolean(currentUser),
    loading: false,
    login: async (details) => {
      const result = await authService.login(details);
      setCurrentUser(result.user);
      localStorage.setItem("tumornet_user", JSON.stringify(result.user));
      return result;
    },
    register: authService.register,
    updateCurrentUser: (user) => {
      setCurrentUser(user);
      localStorage.setItem("tumornet_user", JSON.stringify(user));
    },
    logout: async () => {
      setCurrentUser(null);
      localStorage.removeItem("tumornet_user");
      return { success: true, message: "Logout successful" };
    },
  }), [currentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
