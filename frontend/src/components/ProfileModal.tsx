import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export const ProfileModal = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const { saveProfile } = useChat();
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [statusMessage, setStatusMessage] = useState(user?.status_message ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
    setStatusMessage(user?.status_message ?? "");
    setAvatar(null);
    setAvatarPreview(user?.avatar_url ?? null);
  }, [user, open]);

  useEffect(() => {
    if (!avatar) return;
    const previewUrl = URL.createObjectURL(avatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatar]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await saveProfile({ username, bio, status_message: statusMessage, avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/95 shadow-panel"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Profile</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-100">Edit your details</h3>
            <p className="mt-1 text-sm text-slate-400">Keep your chat presence up to date.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="mb-5 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.username} className="h-20 w-20 rounded-[1.25rem] object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-2xl font-semibold text-slate-100">
                  {(username || user?.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 rounded-full bg-cyan-500 p-2 text-slate-950 transition hover:bg-cyan-400"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-slate-100">{username || user?.username || "Unnamed user"}</p>
              <p className="truncate text-sm text-slate-400">{user?.email}</p>
              <p className="mt-1 text-sm text-slate-400">{user?.is_online ? "Online" : "Offline"}</p>
              <p className="mt-2 text-xs text-slate-500">Tap the camera icon to change your photo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                value={statusMessage}
                onChange={(event) => setStatusMessage(event.target.value)}
                placeholder="What's your current status?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Bio</label>
              <textarea
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                rows={4}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Write a short bio"
              />
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
        />

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-slate-300"
          >
            Cancel
          </button>
          <button className="rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-slate-950">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
};
