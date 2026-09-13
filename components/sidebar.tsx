"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { SettingsModal } from "@/components/settings-modal";
import { useRouter } from "next/navigation";
import { listChatSessions } from "@/lib/drive-storage";
import { DriveAuthorizationRequiredError } from "@/lib/google-drive";

export function Sidebar() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const chatStorageFolderId = userData?.chatStorageDriveFolderId;
    if (!user || !userData?.chatStorageDriveConnected || !chatStorageFolderId) return;
    listChatSessions(user.uid, chatStorageFolderId)
      .then((driveChats) => {
        if (!cancelled) setChats(driveChats);
      })
      .catch((error) => {
        if (!(error instanceof DriveAuthorizationRequiredError)) {
          console.error("Error loading Drive chat history:", error);
        }
      });
    return () => { cancelled = true; };
  }, [user, userData?.chatStorageDriveConnected, userData?.chatStorageDriveFolderId]);

  if (!user) return null;

  return (
    <>
      <aside className="w-[260px] h-[calc(100vh-32px)] m-4 flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex-shrink-0 z-20 relative dark:bg-card/45 dark:border-white/10">
        
        {/* Top: Logo & New Chat */}
        <div className="p-4 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2.5 mb-6 px-1">
            <div className="relative w-6 h-6 shrink-0">
              <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
            </div>
            <span className="font-semibold text-[14.5px] tracking-tight">Beamthread</span>
          </Link>
          
          <button
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Middle: Chat History */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          <div className="px-2 mb-2 mt-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Recent
            </p>
          </div>
          <div className="space-y-0.5">
            {chats.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-muted-foreground/60 text-center">
                No chats yet.
              </div>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors truncate"
                >
                  {chat.title}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Bottom: User Profile */}
        <div className="p-3 border-t border-border/50 mt-auto">
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {user.photoURL ? (
                <Image src={user.photoURL} alt={user.displayName || "User"} width={32} height={32} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-peach-500 text-white text-[12px] font-bold">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-[13px] font-medium text-foreground truncate">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                signOut(auth);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              title="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        
      </aside>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
