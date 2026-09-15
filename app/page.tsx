"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { SubscribeBanner } from "@/components/subscribe-banner";
import { createChatSession } from "@/lib/drive-storage";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const QUICK_ACTIONS = [
  { label: "Analyze a document" },
  { label: "Summarize a report" },
  { label: "Analyze a spreadsheet" },
  { label: "Extract information" },
  { label: "Draft a document" },
  { label: "Transcribe a meeting" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const userId = user?.uid;
  const chatStorageConnected = userData?.chatStorageDriveConnected === true;
  const chatStorageFolderId = userData?.chatStorageDriveFolderId;

  // Gate the workspace on both authentication and chat-history storage setup.
  useEffect(() => {
    if (!loading && !userId) {
      router.replace("/landing");
      return;
    }
    if (
      !loading &&
      userId &&
      (!chatStorageConnected || !chatStorageFolderId)
    ) {
      router.replace("/connect-drive");
    }
  }, [userId, chatStorageConnected, chatStorageFolderId, loading, router]);

  const handleSend = async () => {
    if (!query.trim() || !user || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (!chatStorageConnected || !chatStorageFolderId) {
        router.push("/connect-drive");
        return;
      }
      const chatId = await createChatSession(user.uid, chatStorageFolderId, query.trim());
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsSubmitting(false);
    }
  };

  // Show nothing while auth is resolving — prevents flash
  if (
    loading ||
    !user ||
    !userData?.chatStorageDriveConnected ||
    !userData.chatStorageDriveFolderId
  ) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-background select-none relative">

      {/* ── Global Background: noise + glow ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-peach-500/25 dark:bg-peach-500/15 blur-[120px] rounded-[100%]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.15] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="home-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#home-noise)" />
        </svg>
      </div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full">

        {/* ── Dashboard Header ── */}
        <header className="absolute top-6 left-0 right-0 px-8 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            <SubscribeBanner />
          </div>
          <div className="flex-1 flex justify-end pointer-events-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* ── Main Chat Interface ── */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 h-full pt-10">

          {/* Headline */}
          <div className="text-center mb-8 space-y-2.5">
            <h1 className="text-[36px] md:text-[44px] font-semibold tracking-tight leading-[1.1] text-foreground">
              Welcome back, {user.displayName?.split(" ")[0] || "User"}
            </h1>
            <p className="text-[15px] text-muted-foreground font-normal max-w-md mx-auto">
              Pick up where you left off or start a new task.
            </p>
          </div>

          {/* Search Card */}
          <div className="w-full max-w-[720px] mb-5">
            <div className="relative bg-card border border-border rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.09)] focus-within:border-ring/60 dark:bg-card/55 dark:backdrop-blur-xl dark:border-white/10">

              {/* Textarea */}
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Beamthread anything about your work…"
                className="w-full bg-transparent resize-none outline-none px-5 pt-5 pb-4 text-[15px] placeholder:text-muted-foreground/60 text-foreground"
              />

              {/* Footer toolbar */}
              <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1 border-t border-border/50">
                {/* Left — file type pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-secondary text-muted-foreground text-[12px] font-medium hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5v14"/>
                      </svg>
                      Add files
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => router.push("/connect-upload-drive")}>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        Upload from computer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Connect Drive for uploads
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        Connect Dropbox
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Right — send */}
                <button
                  onClick={handleSend}
                  disabled={!query.trim() || isSubmitting}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-foreground text-background hover:opacity-80 disabled:opacity-25 transition-all"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick action chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-[640px] mb-6">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => setQuery(a.label)}
                className="inline-flex items-center h-8 px-4 rounded-full border border-border bg-card text-[12.5px] font-medium text-muted-foreground hover:border-accent hover:bg-secondary hover:text-foreground transition-all"
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Privacy note */}
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground/70">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Private by design · Your work stays yours
          </p>

        </main>
      </div>
    </div>
  );
}
