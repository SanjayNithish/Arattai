import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { loginRequest, registerRequest } from "../api/auth";
import { User } from "../types/chat";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("chat_token"));

  useEffect(() => {
    const storedUser = localStorage.getItem("chat_user");
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    }
  }, []);

  const persist = (nextToken: string, nextUser: User) => {
    localStorage.setItem("chat_token", nextToken);
    localStorage.setItem("chat_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUserState(nextUser);
  };

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    persist(response.access_token, response.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await registerRequest(username, email, password);
    persist(response.access_token, response.user);
  };

  const logout = () => {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUserState(null);
  };

  const setUser = (nextUser: User) => {
    localStorage.setItem("chat_user", JSON.stringify(nextUser));
    setUserState(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setUser }}>
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
