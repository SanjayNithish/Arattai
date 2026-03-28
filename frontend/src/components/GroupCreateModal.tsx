import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Search, Users, X } from "lucide-react";

import { Conversation, User } from "../types/chat";

type Props = {
  open: boolean;
  users: User[];
  mode?: "create" | "edit";
  initialConversation?: Conversation | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    memberIds: number[];
    avatar?: File | null;
  }) => Promise<void>;
};

export const GroupCreateModal = ({
  open,
  users,
  mode = "create",
  initialConversation = null,
  onClose,
  onSubmit,
}: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredUsers = useMemo(
    () => users.filter((user) => user.username.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  useEffect(() => {
    if (!open) return;
    setName(initialConversation?.name ?? "");
    setDescription(initialConversation?.description ?? "");
    setSearch("");
    setSelectedIds(
      initialConversation
        ? initialConversation.members.map((member) => member.id)
        : []
    );
    setAvatar(null);
    setAvatarPreview(initialConversation?.avatar_url ?? null);
    setIsSaving(false);
    setError(null);
  }, [open, initialConversation]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!open) return null;

  const reset = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setName(initialConversation?.name ?? "");
    setDescription(initialConversation?.description ?? "");
    setSearch("");
    setSelectedIds(initialConversation ? initialConversation.members.map((member) => member.id) : []);
    setAvatar(null);
    setAvatarPreview(initialConversation?.avatar_url ?? null);
    setIsSaving(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await onSubmit({ name, description, memberIds: selectedIds, avatar });
      reset();
    } catch (submitError) {
      console.error(submitError);
      setError("Unable to save group changes right now. Please try again.");
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : initialConversation?.avatar_url ?? null);
  };

  const title = mode === "edit" ? "Edit group" : "New group";
  const heading = mode === "edit" ? "Edit group details" : "Create a group chat";
  const actionLabel = mode === "edit" ? "Save changes" : "Create group";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/95 shadow-panel"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">{title}</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-100">{heading}</h3>
          </div>
          <button type="button" onClick={reset} className="rounded-full bg-white/5 p-2 text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-5 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-slate-100"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={name || "Group preview"} className="h-full w-full object-cover" />
              ) : (
                <Camera size={24} />
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-slate-950/80 p-1.5 text-white ring-1 ring-white/10">
                <Camera size={12} />
              </span>
            </button>
            <div>
              <p className="text-lg font-semibold text-slate-100">{name || "Untitled group"}</p>
              <p className="text-sm text-slate-400">Add a photo, description, and members.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Group name</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                placeholder="Team updates"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                placeholder="What is this group about?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">Add users</label>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Search size={16} />
                <input
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  placeholder="Search users by name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
              {filteredUsers.map((user) => {
                const selected = selectedIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      setSelectedIds((current) =>
                        selected ? current.filter((id) => id !== user.id) : [...current, user.id]
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ${
                      selected ? "bg-cyan-500/15 ring-1 ring-cyan-400/20" : "bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-slate-100">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{user.username}</p>
                        <p className="text-xs text-slate-400">{user.is_online ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs ${selected ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}>
                      {selected ? "Added" : "Add"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <Users size={16} />
              {selectedIds.length} member{selectedIds.length === 1 ? "" : "s"} selected
            </div>
            {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={reset} disabled={isSaving} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-slate-300 disabled:cursor-not-allowed disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
