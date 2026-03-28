import { api } from "./client";
import { User } from "../types/chat";

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export const loginRequest = async (email: string, password: string) => {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
};

export const registerRequest = async (username: string, email: string, password: string) => {
  const { data } = await api.post<AuthResponse>("/auth/register", { username, email, password });
  return data;
};
