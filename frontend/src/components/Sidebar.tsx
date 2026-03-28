import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { Conversation } from "../types/chat";
import { GroupCreateModal } from "./GroupCreateModal";

type Props = {
  onClose?: () => void;
};

export const Sidebar = ({ onClose }: Props) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    users,
    groups,
    activeConversation,
    setActiveConversation,
    createDirectChat,
    createGroupChat,
    searchGroups,
    joinExistingGroup,
    removeChat,
  } = useChat();
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const searchableUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          item.username.toLowerCase().includes(userSearch.toLowerCase()) &&
          item.id !== user?.id
      ),
    [users, userSearch, user?.id]
  );

  const getLabel = (conversation: Conversation) => {
    if (conversation.type === "group") return conversation.name || "Untitled group";
    return conversation.members.find((member) => member.id !== user?.id)?.username || "Direct chat";
  };

  return (
    <>
    <aside className="flex h-full w-full flex-col overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 text-slate-100 shadow-panel backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Workspace</p>
          <h2 className="text-xl font-semibold text-slate-100">{user?.username}</h2>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button onClick={onClose} className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300 lg:hidden">
              Close
            </button>
          )}
          <button onClick={logout} className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
            Logout
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">Find users</label>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Search size={16} />
            <input
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Search by username"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
          {searchableUsers.slice(0, 8).map((item) => (
            <button
              key={item.id}
              onClick={async () => {
                await createDirectChat(item.id);
                onClose?.();
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-3 text-left hover:bg-white/[0.08]"
            >
              <span className="font-medium text-slate-100">{item.username}</span>
              <span className="text-xs text-slate-400">{item.is_online ? "Online" : "Offline"}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setGroupModalOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-slate-950"
      >
        <Plus size={16} />
        Create group
      </button>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">Search groups</label>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Search size={16} />
            <input
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Find groups by name"
              value={groupSearch}
              onChange={async (event) => {
                const value = event.target.value;
                setGroupSearch(value);
                await searchGroups(value);
              }}
            />
          </div>
        </div>
        <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
          {groups.slice(0, 8).map((group) => (
            <div key={group.id} className="rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-100">{group.name || "Untitled group"}</p>
                  <p className="text-xs text-slate-400">{group.member_count} members</p>
                </div>
                {group.is_member ? (
                  <button
                    onClick={async () => {
                      const existing = conversations.find((item) => item.id === group.id);
                      if (existing) {
                        setActiveConversation(existing);
                        onClose?.();
                        return;
                      }
                      await joinExistingGroup(group.id);
                      onClose?.();
                    }}
                    className="rounded-full bg-cyan-500 px-3 py-2 text-xs font-medium text-slate-950"
                  >
                    Open
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await joinExistingGroup(group.id);
                      onClose?.();
                    }}
                    className="rounded-full bg-orange-500 px-3 py-2 text-xs font-medium text-slate-950"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 border-t border-white/10 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-300">Chats</p>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`rounded-3xl p-4 transition ${
                activeConversation?.id === conversation.id
                  ? "border border-cyan-400/20 bg-cyan-500/10 text-white"
                  : "border border-white/5 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => {
                    setActiveConversation(conversation);
                    onClose?.();
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{getLabel(conversation)}</span>
                    <span className="text-xs opacity-70">{conversation.type}</span>
                  </div>
                  <p className="mt-1 truncate text-sm opacity-70">
                    {conversation.last_message?.content || "No messages yet"}
                  </p>
                </button>
                <button
                  onClick={async (event) => {
                    event.stopPropagation();
                    await removeChat(conversation.id);
                  }}
                  className={`rounded-full p-2 ${
                    activeConversation?.id === conversation.id ? "bg-white/10 text-white" : "bg-slate-900/80 text-slate-400"
                  }`}
                  title="Delete chat from list"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
    <GroupCreateModal
      open={groupModalOpen}
      users={users.filter((item) => item.id !== user?.id)}
      onClose={() => setGroupModalOpen(false)}
      onSubmit={async (payload) => {
        await createGroupChat(payload);
        setGroupModalOpen(false);
        onClose?.();
      }}
    />
    </>
  );
};
