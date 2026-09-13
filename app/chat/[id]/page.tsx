"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { SubscribeBanner } from "@/components/subscribe-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { appendChatMessage, ChatMessage, loadChatSession, uploadChatAttachment } from "@/lib/drive-storage";
import { DriveAuthorizationRequiredError } from "@/lib/google-drive";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("Loading chat...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/landing");
      return;
    }

    if (
      !loading &&
      user &&
      userData?.subscriptionStatus === "payment_submitted"
    ) {
      router.replace("/subscribe/success");
      return;
    }

    if (
      !loading &&
      user &&
      (!userData?.chatStorageDriveConnected || !userData.chatStorageDriveFolderId)
    ) {
      router.replace("/connect-drive");
      return;
    }

    async function fetchChat() {
      if (loading || !user) return;
      try {
        const chatStorageFolderId = userData?.chatStorageDriveFolderId;
        if (!chatStorageFolderId) return;
        const chat = await loadChatSession(user.uid, chatStorageFolderId, resolvedParams.id);
        if (!chat) throw new Error("Chat not found");
        setTitle(chat.title);
        setMessages(chat.messages);
      } catch (error) {
        if (error instanceof DriveAuthorizationRequiredError) {
          router.replace(`/connect-drive?reauthorize=1&returnTo=/chat/${resolvedParams.id}`);
          return;
        }
        setTitle("Untitled Chat");
      }
    }
    fetchChat();
  }, [resolvedParams.id, router, user, userData?.subscriptionStatus, userData?.chatStorageDriveConnected, userData?.chatStorageDriveFolderId, loading]);

  const handleSend = async () => {
    if (!query.trim() || !user || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (userData?.subscriptionStatus === "payment_submitted") {
        router.push("/subscribe/success");
        return;
      }
      const chatStorageFolderId = userData?.chatStorageDriveFolderId;
      if (!userData?.chatStorageDriveConnected || !chatStorageFolderId) {
        router.push("/connect-drive");
        return;
      }
      const updatedChat = await appendChatMessage(user.uid, chatStorageFolderId, resolvedParams.id, query.trim());
      setTitle(updatedChat.title);
      setMessages(updatedChat.messages);
      setQuery("");
    } catch (error) {
      console.error("Error saving chat:", error);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const chatStorageFolderId = userData?.chatStorageDriveFolderId;
    if (!file || !user || !userData?.chatStorageDriveConnected || !chatStorageFolderId || isUploading) return;
    try {
      setIsUploading(true);
      await uploadChatAttachment(user.uid, chatStorageFolderId, resolvedParams.id, file);
    } catch (error) {
      console.error("Error uploading attachment:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user || userData?.subscriptionStatus === "payment_submitted" || !userData?.chatStorageDriveConnected || !userData.chatStorageDriveFolderId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-background select-none relative">
      
      {/* ── Global Background: noise + glow ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-peach-500/25 dark:bg-peach-500/15 blur-[120px] rounded-[100%]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.15] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="chat-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#chat-noise)" />
        </svg>
      </div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full">

        {/* Header */}
        <header className="absolute top-6 left-0 right-0 px-8 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex-1 pointer-events-auto flex items-center">
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight opacity-50 truncate max-w-[240px]">
              {title}
            </h2>
          </div>

          <div className="flex-1 flex justify-center">
            <SubscribeBanner />
          </div>

          <div className="flex-1 flex justify-end pointer-events-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* ── Main Chat Interface ── */}
        <main className="flex-1 flex flex-col items-center justify-end px-4 pb-8 h-full pt-24">

          {/* Chat Messages Area */}
          <div className="flex-1 w-full max-w-[720px] flex flex-col gap-6 overflow-y-auto no-scrollbar pt-4 mb-4">
            {messages.map((message, index) => (
              <div className="flex gap-4" key={`${message.createdAt}-${index}`}>
                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center dark:bg-white/8 dark:backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-muted-foreground">{message.role === "user" ? "You" : "AI"}</span>
                </div>
                <div className={`max-w-[calc(100%-3rem)] rounded-2xl border px-4 py-3 pt-1.5 backdrop-blur-xl ${
                  message.role === "user"
                    ? "bg-transparent border-border/60 dark:border-peach-300/15"
                    : "bg-card/30 border-border/50 dark:bg-white/6 dark:border-white/10"
                }`}>
                  <p className="text-[14.5px] text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search Card */}
          <div className="w-full max-w-[720px]">
            <div className="relative bg-card border border-border rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.09)] focus-within:border-ring/60 dark:bg-card/55 dark:backdrop-blur-xl dark:border-white/10">

              <textarea
                rows={1}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a follow-up…"
                className="w-full bg-transparent resize-none outline-none px-5 pt-5 pb-4 text-[15px] placeholder:text-muted-foreground/60 text-foreground min-h-[56px]"
              />

              <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <input id="chat-file-upload" type="file" className="hidden" onChange={handleFileSelected} />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-secondary text-muted-foreground text-[12px] font-medium hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap shrink-0">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5v14"/>
                        </svg>
                        Attach
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => document.getElementById("chat-file-upload")?.click()}>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        {isUploading ? "Uploading..." : "Upload from computer"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/connect-upload-drive")}>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Connect Drive for uploads
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

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

          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground/70 mt-4">
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
