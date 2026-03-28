import { FormEvent, useEffect, useState } from "react";
import { LogOut, Menu, Pencil, Settings2, Trash2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { GroupCreateModal } from "./GroupCreateModal";
import { GroupMembersModal } from "./GroupMembersModal";
import { UserProfileModal } from "./UserProfileModal";
import { User } from "../types/chat";

type Props = {
  onOpenSidebar: () => void;
};

export const ChatWindow = ({ onOpenSidebar }: Props) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    loadConversationMessages,
    editMessage,
    deleteOwnMessage,
    leaveCurrentGroup,
    postMessage,
    triggerTyping,
    typingUsers,
    updateGroupChat,
    users,
  } = useChat();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    if (activeConversation) {
      loadConversationMessages(activeConversation.id);
    }
  }, [activeConversation]);

  if (!activeConversation) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-panel backdrop-blur-xl">
        <div className="max-w-md text-center">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <button onClick={onOpenSidebar} className="rounded-full bg-white/5 p-3 text-slate-300">
              <Menu size={18} />
            </button>
          </div>
          <h2 className="text-3xl font-semibold text-slate-100">Choose a conversation</h2>
          <p className="mt-3 text-slate-400">Pick a direct message or create a group to start chatting.</p>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await postMessage(activeConversation.id, text, file);
    setText("");
    setFile(null);
    await triggerTyping(activeConversation.id, false);
  };

  const conversationMessages = messages[activeConversation.id] ?? [];
  const typingLabel = typingUsers[activeConversation.id]?.join(", ");

  const title =
    activeConversation.type === "group"
      ? activeConversation.name || "Group chat"
      : activeConversation.members.find((member) => member.id !== user?.id)?.username || "Direct message";
  const directUser = activeConversation.members.find((member) => member.id !== user?.id) || null;

  return (
    <>
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 shadow-panel backdrop-blur-xl">
      <header className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onOpenSidebar} className="rounded-full bg-white/5 p-3 text-slate-300 lg:hidden">
              <Menu size={18} />
            </button>
            {activeConversation.type === "group" ? (
              activeConversation.avatar_url ? (
                <img src={activeConversation.avatar_url} alt={title} className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg font-semibold text-slate-100">
                  {title.slice(0, 1).toUpperCase()}
                </div>
              )
            ) : directUser?.avatar_url ? (
              <img src={directUser.avatar_url} alt={title} className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg font-semibold text-slate-100">
                {title.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">{title}</h2>
              {activeConversation.type === "group" ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">
                    {activeConversation.description || "No group description"}
                  </p>
                  <button
                    onClick={() => setMembersOpen(true)}
                    className="text-sm font-medium text-cyan-300 underline-offset-4 hover:underline"
                  >
                    {activeConversation.members.length} members
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {directUser?.status_message || `${activeConversation.members.length} members`}
                </p>
              )}
            </div>
          </div>
          {activeConversation.type === "group" && (
            <div className="flex items-center gap-2">
              {activeConversation.created_by === user?.id && (
                <button
                  onClick={() => setEditGroupOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300"
                >
                  <Settings2 size={16} />
                  Edit group
                </button>
              )}
              <button
                onClick={async () => {
                  await leaveCurrentGroup(activeConversation.id);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300"
              >
                <LogOut size={16} />
                Leave group
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="space-y-4">
        {conversationMessages.map((message) => {
          if (message.message_type === "system") {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="rounded-full bg-white/[0.04] px-4 py-2 text-xs text-slate-400 ring-1 ring-white/10">
                  {message.content}
                </div>
              </div>
            );
          }
          const own = message.sender.id === user?.id;
          return (
            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-2xl items-center gap-3 ${own ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={() => setSelectedUser(message.sender)}
                  className="shrink-0 self-center"
                >
                  {message.sender.avatar_url ? (
                    <img src={message.sender.avatar_url} alt={message.sender.username} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-slate-100">
                      {message.sender.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className={`min-w-[220px] max-w-[360px] rounded-[1.75rem] px-4 py-3 ${
                  own ? "bg-cyan-500/15 text-slate-100 ring-1 ring-cyan-400/20" : "bg-white/[0.05] text-slate-100 ring-1 ring-white/10"
                }`}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedUser(message.sender)}
                      className="text-left text-xs opacity-60 underline-offset-2 hover:underline"
                    >
                      {message.sender.username}
                    </button>
                    {own && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditingText(message.content || "");
                          }}
                          className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            await deleteOwnMessage(activeConversation.id, message.id);
                          }}
                          className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                        rows={3}
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await editMessage(activeConversation.id, message.id, editingText);
                            setEditingMessageId(null);
                            setEditingText("");
                          }}
                          className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-slate-950"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingText("");
                          }}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.content && <p className="text-lg leading-snug">{message.content}</p>}
                      {message.image_url && (
                        <img src={message.image_url} alt="upload" className="mt-2 max-h-72 rounded-2xl object-cover" />
                      )}
                    </>
                  )}
                  <p className="mt-2 text-[11px] opacity-60">
                    {new Date(message.created_at).toLocaleTimeString()}
                    {message.edited_at ? " · edited" : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-2 text-sm text-slate-400 sm:px-6">{typingLabel ? `${typingLabel} typing...` : ""}</div>
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
            placeholder="Write a message"
            value={text}
            onChange={async (event) => {
              setText(event.target.value);
              await triggerTyping(activeConversation.id, event.target.value.length > 0);
            }}
          />
          <input className="text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-white/5 file:px-4 file:py-3 file:text-slate-200" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-slate-950">Send</button>
        </div>
      </form>
    </section>
    <GroupMembersModal
      open={membersOpen}
      conversation={activeConversation}
      onClose={() => setMembersOpen(false)}
    />
    <GroupCreateModal
      open={editGroupOpen}
      mode="edit"
      initialConversation={activeConversation?.type === "group" ? activeConversation : null}
      users={users.filter((item) => item.id !== user?.id)}
      onClose={() => setEditGroupOpen(false)}
      onSubmit={async (payload) => {
        if (!activeConversation || activeConversation.type !== "group") return;
        await updateGroupChat(activeConversation.id, payload);
        setEditGroupOpen(false);
      }}
    />
    <UserProfileModal open={Boolean(selectedUser)} user={selectedUser} onClose={() => setSelectedUser(null)} />
    </>
  );
};
