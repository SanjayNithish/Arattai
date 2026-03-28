import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createConversation,
  deleteChat,
  deleteMessage,
  discoverGroups,
  fetchConversations,
  fetchMessages,
  fetchUsers,
  joinGroup,
  leaveGroup,
  sendMessage,
  sendTyping,
  updateConversation,
  updateMessage,
  updateProfile,
} from "../api/chat";
import { getWsUrl, resolveAssetUrl } from "../api/client";
import { uploadImage } from "../api/uploads";
import { useAuth } from "./AuthContext";
import { Conversation, GroupDiscovery, Message, User } from "../types/chat";

type ChatContextValue = {
  conversations: Conversation[];
  users: User[];
  groups: GroupDiscovery[];
  messages: Record<number, Message[]>;
  activeConversation: Conversation | null;
  typingUsers: Record<number, string[]>;
  setActiveConversation: (conversation: Conversation | null) => void;
  loadConversationMessages: (conversationId: number) => Promise<void>;
  createDirectChat: (memberId: number) => Promise<void>;
  createGroupChat: (payload: { name: string; description?: string; memberIds: number[]; avatar?: File | null }) => Promise<void>;
  updateGroupChat: (
    conversationId: number,
    payload: { name: string; description?: string; memberIds: number[]; avatar?: File | null }
  ) => Promise<void>;
  searchGroups: (query: string) => Promise<void>;
  joinExistingGroup: (conversationId: number) => Promise<void>;
  leaveCurrentGroup: (conversationId: number) => Promise<void>;
  removeChat: (conversationId: number) => Promise<void>;
  postMessage: (conversationId: number, content: string, file?: File | null) => Promise<void>;
  editMessage: (conversationId: number, messageId: number, content: string) => Promise<void>;
  deleteOwnMessage: (conversationId: number, messageId: number) => Promise<void>;
  triggerTyping: (conversationId: number, isTyping: boolean) => Promise<void>;
  refreshSidebar: () => Promise<void>;
  saveProfile: (payload: { username?: string; bio?: string; status_message?: string; avatar?: File | null }) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, user, setUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GroupDiscovery[]>([]);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const refreshSidebar = async () => {
    if (!token) return;
    const [conversationItems, userItems, groupItems] = await Promise.all([
      fetchConversations(),
      fetchUsers(),
      discoverGroups(),
    ]);
    setConversations(conversationItems);
    setUsers(userItems);
    setGroups(groupItems);
    setActiveConversation((current) =>
      current ? conversationItems.find((item) => item.id === current.id) ?? current : current
    );
  };

  const loadConversationMessages = async (conversationId: number) => {
    const items = await fetchMessages(conversationId);
    setMessages((current) => ({ ...current, [conversationId]: items }));
  };

  useEffect(() => {
    if (!token) return;
    refreshSidebar();

    const socket = new WebSocket(getWsUrl(token));
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "conversation.created" || payload.type === "conversation.updated") {
        refreshSidebar();
      }
      if (payload.type === "message.created") {
        const message = payload.message as Message;
        setMessages((current) => ({
          ...current,
          [payload.conversationId]: [...(current[payload.conversationId] ?? []), message],
        }));
        refreshSidebar();
      }
      if (payload.type === "message.updated") {
        const message = payload.message as Message;
        setMessages((current) => ({
          ...current,
          [payload.conversationId]: (current[payload.conversationId] ?? []).map((item) =>
            item.id === message.id ? message : item
          ),
        }));
        refreshSidebar();
      }
      if (payload.type === "message.deleted") {
        setMessages((current) => ({
          ...current,
          [payload.conversationId]: (current[payload.conversationId] ?? []).filter(
            (item) => item.id !== payload.messageId
          ),
        }));
        refreshSidebar();
      }
      if (payload.type === "presence") {
        setUsers((current) =>
          current.map((item) => (item.id === payload.userId ? { ...item, is_online: payload.isOnline } : item))
        );
        setConversations((current) =>
          current.map((conversation) => ({
            ...conversation,
            members: conversation.members.map((member) =>
              member.id === payload.userId ? { ...member, is_online: payload.isOnline } : member
            ),
          }))
        );
      }
      if (payload.type === "typing" && user && payload.userId !== user.id) {
        setTypingUsers((current) => {
          const existing = current[payload.conversationId] ?? [];
          const next = payload.isTyping
            ? Array.from(new Set([...existing, payload.username]))
            : existing.filter((item) => item !== payload.username);
          return { ...current, [payload.conversationId]: next };
        });
      }
    };

    socketRef.current = socket;
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token, user]);

  const createDirectChat = async (memberId: number) => {
    const conversation = await createConversation({ type: "direct", member_ids: [memberId] });
    await refreshSidebar();
    setActiveConversation(conversation);
    await loadConversationMessages(conversation.id);
  };

  const createGroupChat = async (payload: {
    name: string;
    description?: string;
    memberIds: number[];
    avatar?: File | null;
  }) => {
    let avatarUrl: string | undefined;
    if (payload.avatar) {
      const uploaded = await uploadImage(payload.avatar);
      avatarUrl = resolveAssetUrl(uploaded.url);
    }
    const conversation = await createConversation({
      type: "group",
      name: payload.name,
      description: payload.description,
      member_ids: payload.memberIds,
      avatar_url: avatarUrl,
    });
    await refreshSidebar();
    setActiveConversation(conversation);
    await loadConversationMessages(conversation.id);
  };

  const updateGroupChat = async (
    conversationId: number,
    payload: {
      name: string;
      description?: string;
      memberIds: number[];
      avatar?: File | null;
    }
  ) => {
    let avatarUrl = conversations.find((item) => item.id === conversationId)?.avatar_url ?? undefined;
    if (payload.avatar) {
      const uploaded = await uploadImage(payload.avatar);
      avatarUrl = resolveAssetUrl(uploaded.url);
    }
    const conversation = await updateConversation(conversationId, {
      name: payload.name,
      description: payload.description,
      member_ids: payload.memberIds,
      avatar_url: avatarUrl,
    });
    setActiveConversation(conversation);
    await refreshSidebar();
    await loadConversationMessages(conversation.id);
  };

  const searchGroups = async (query: string) => {
    const items = await discoverGroups(query);
    setGroups(items);
  };

  const joinExistingGroup = async (conversationId: number) => {
    await joinGroup(conversationId);
    await refreshSidebar();
    const joinedConversation = await fetchConversations().then((items) =>
      items.find((conversation) => conversation.id === conversationId) || null
    );
    if (joinedConversation) {
      setActiveConversation(joinedConversation);
      await loadConversationMessages(conversationId);
    }
  };

  const leaveCurrentGroup = async (conversationId: number) => {
    await leaveGroup(conversationId);
    setMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setActiveConversation((current) => (current?.id === conversationId ? null : current));
    await refreshSidebar();
  };

  const removeChat = async (conversationId: number) => {
    await deleteChat(conversationId);
    setMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setActiveConversation((current) => (current?.id === conversationId ? null : current));
    await refreshSidebar();
  };

  const postMessage = async (conversationId: number, content: string, file?: File | null) => {
    let imageUrl: string | undefined;
    if (file) {
      const uploaded = await uploadImage(file);
      imageUrl = resolveAssetUrl(uploaded.url);
    }
    await sendMessage(conversationId, { content: content || undefined, image_url: imageUrl });
  };

  const editMessage = async (conversationId: number, messageId: number, content: string) => {
    await updateMessage(conversationId, messageId, content);
  };

  const deleteOwnMessage = async (conversationId: number, messageId: number) => {
    await deleteMessage(conversationId, messageId);
  };

  const triggerTyping = async (conversationId: number, isTyping: boolean) => {
    await sendTyping(conversationId, isTyping);
  };

  const saveProfile = async (payload: {
    username?: string;
    bio?: string;
    status_message?: string;
    avatar?: File | null;
  }) => {
    let avatarUrl = user?.avatar_url ?? undefined;
    if (payload.avatar) {
      const uploaded = await uploadImage(payload.avatar);
      avatarUrl = resolveAssetUrl(uploaded.url);
    }
    const updated = await updateProfile({
      username: payload.username,
      bio: payload.bio,
      status_message: payload.status_message,
      avatar_url: avatarUrl,
    });
    setUser(updated);
    await refreshSidebar();
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        users,
        groups,
        messages,
        activeConversation,
        typingUsers,
        setActiveConversation,
        loadConversationMessages,
        createDirectChat,
        createGroupChat,
        updateGroupChat,
        searchGroups,
        joinExistingGroup,
        leaveCurrentGroup,
        removeChat,
        postMessage,
        editMessage,
        deleteOwnMessage,
        triggerTyping,
        refreshSidebar,
        saveProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};
