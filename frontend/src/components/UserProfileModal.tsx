import { X } from "lucide-react";

import { User } from "../types/chat";

type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export const UserProfileModal = ({ open, user, onClose }: Props) => {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/88 p-6 shadow-panel backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-100">User profile</h3>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-300">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="h-20 w-20 rounded-3xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-2xl font-semibold text-slate-300">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-2xl font-semibold text-slate-100">{user.username}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="mt-1 text-sm text-slate-400">{user.is_online ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
            <p className="mt-2 text-sm text-slate-100">{user.status_message || "No status message"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Bio</p>
            <p className="mt-2 text-sm text-slate-100">{user.bio || "No bio added yet"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
