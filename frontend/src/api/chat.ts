import { api } from "./client";
import { Conversation, GroupDiscovery, Message, User } from "../types/chat";

export const fetchConversations = async () => {
  const { data } = await api.get<Conversation[]>("/conversations");
  return data;
};

export const fetchMessages = async (conversationId: number) => {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get<User[]>("/users");
  return data;
};

export const discoverGroups = async (query = "") => {
  const { data } = await api.get<GroupDiscovery[]>("/conversations/discover/groups", {
    params: query ? { query } : {},
  });
  return data;
};

export const createConversation = async (payload: {
  type: "direct" | "group";
  name?: string;
  description?: string;
  member_ids: number[];
  avatar_url?: string;
}) => {
  const { data } = await api.post<Conversation>("/conversations", payload);
  return data;
};

export const updateConversation = async (
  conversationId: number,
  payload: {
    name?: string;
    description?: string;
    member_ids: number[];
    avatar_url?: string;
  }
) => {
  const { data } = await api.put<Conversation>(`/conversations/${conversationId}`, payload);
  return data;
};

export const sendMessage = async (conversationId: number, payload: { content?: string; image_url?: string }) => {
  const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, {
    conversation_id: conversationId,
    ...payload,
  });
  return data;
};

export const updateMessage = async (conversationId: number, messageId: number, content: string) => {
  const { data } = await api.put<Message>(`/conversations/${conversationId}/messages/${messageId}`, { content });
  return data;
};

export const deleteMessage = async (conversationId: number, messageId: number) => {
  await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
};

export const sendTyping = async (conversationId: number, isTyping: boolean) => {
  await api.post(`/conversations/${conversationId}/typing`, {
    conversation_id: conversationId,
    is_typing: isTyping,
  });
};

export const joinGroup = async (conversationId: number) => {
  await api.post(`/conversations/${conversationId}/join`);
};

export const leaveGroup = async (conversationId: number) => {
  await api.post(`/conversations/${conversationId}/leave`);
};

export const deleteChat = async (conversationId: number) => {
  await api.delete(`/conversations/${conversationId}`);
};

export const updateProfile = async (payload: {
  username?: string;
  bio?: string;
  status_message?: string;
  avatar_url?: string;
}) => {
  const { data } = await api.put<User>("/users/me", payload);
  return data;
};
