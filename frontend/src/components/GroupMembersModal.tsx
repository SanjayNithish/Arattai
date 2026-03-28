import { Crown, Users, X } from "lucide-react";

import { Conversation } from "../types/chat";

type Props = {
  open: boolean;
  conversation: Conversation | null;
  onClose: () => void;
};

export const GroupMembersModal = ({ open, conversation, onClose }: Props) => {
  if (!open || !conversation || conversation.type !== "group") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/95 shadow-panel">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-300/70">
              <Users size={14} />
              Members
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-slate-100">{conversation.name || "Group"}</h3>
            <p className="mt-1 text-sm text-slate-400">{conversation.members.length} members</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="space-y-3">
            {conversation.members.map((member) => {
              const isAdmin = member.id === conversation.created_by;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.username} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-slate-100">
                        {member.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-100">{member.username}</p>
                      <p className="text-xs text-slate-400">{member.is_online ? "Online" : "Offline"}</p>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      isAdmin
                        ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                        : "border border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    {isAdmin && <Crown size={12} />}
                    {isAdmin ? "Admin" : "Member"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
