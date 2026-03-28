import { useState } from "react";
import { Menu, UserCircle2 } from "lucide-react";

import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";
import { ProfileModal } from "../components/ProfileModal";

export const ChatPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <main className="h-screen overflow-hidden px-3 py-3 lg:px-6 lg:py-6">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <header className="flex shrink-0 items-center justify-between rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-4 shadow-panel backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-full bg-white/5 p-3 text-slate-300 lg:hidden">
              <Menu size={18} />
            </button>
            <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">Arattai</h1>
          </div>
          <button onClick={() => setProfileOpen(true)} className="rounded-full bg-white/5 p-3 text-slate-300">
            <UserCircle2 size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[340px,minmax(0,1fr)]">
          <div className="hidden min-h-0 lg:block">
          <Sidebar />
        </div>
          <div className="min-h-0">
            <ChatWindow onOpenSidebar={() => setSidebarOpen(true)} />
          </div>
        </div>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm lg:hidden">
          <div className="h-full max-w-md">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </main>
  );
};
