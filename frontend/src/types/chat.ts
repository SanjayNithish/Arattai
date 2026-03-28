export type User = {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  status_message?: string | null;
  is_online: boolean;
  created_at: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  content?: string | null;
  image_url?: string | null;
  message_type: "user" | "system";
  is_read: boolean;
  created_at: string;
  edited_at?: string | null;
  sender: User;
};

export type Conversation = {
  id: number;
  type: "direct" | "group";
  name?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  created_by: number;
  created_at: string;
  members: User[];
  last_message?: Message | null;
};

export type GroupDiscovery = {
  id: number;
  name?: string | null;
  avatar_url?: string | null;
  created_by: number;
  created_at: string;
  member_count: number;
  is_member: boolean;
};
