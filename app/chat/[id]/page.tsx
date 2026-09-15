"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { SubscribeBanner } from "@/components/subscribe-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { appendChatMessage, CanvasBlock, ChatAttachment, ChatMessage, loadChatSession, updateChatWorkspace, uploadChatAttachment } from "@/lib/drive-storage";
import { DriveAuthorizationRequiredError } from "@/lib/google-drive";
import { WorkspaceCanvas } from "@/components/workspace-canvas";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const CHAT_MODES = [
  { id: "analyze", label: "Analyze", prompt: "Analyze this carefully and highlight the most important findings.", icon: "focus" },
  { id: "summarize", label: "Summarize", prompt: "Summarize this into clear, concise points.", icon: "summary" },
  { id: "draft", label: "Draft", prompt: "Draft a polished version suitable for professional use.", icon: "draft" },
  { id: "extract", label: "Extract", prompt: "Extract the key facts, dates, risks, and action items.", icon: "extract" },
  { id: "research", label: "Research", prompt: "Research this topic and organize the answer with useful context.", icon: "research" },
] as const;

const PROFESSIONAL_KITS = [
  { label: "Engineering review", prompt: "Review this for requirements, edge cases, risks, dependencies, and implementation actions.", icon: "engineering" },
  { label: "Clinical brief", prompt: "Turn this into a concise clinical brief with observations, uncertainties, and follow-up questions.", icon: "clinical" },
  { label: "Design review", prompt: "Review this design for constraints, materials, decisions, omissions, and coordination issues.", icon: "design" },
  { label: "Policy brief", prompt: "Prepare a decision-ready policy brief with context, stakeholders, risks, and recommendations.", icon: "policy" },
  { label: "Research synthesis", prompt: "Synthesize the evidence, separate facts from assumptions, and identify open questions.", icon: "research" },
] as const;

function ChatIcon({ name, size = 14 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    focus: <><circle cx="12" cy="12" r="7"/><path d="M12 5V3M12 21v-2M5 12H3m18 0h-2"/></>,
    summary: <><path d="M5 5h14M5 10h10M5 15h14M5 20h8"/></>,
    draft: <><path d="m4 17 3 3 13-13-3-3L4 17Z"/><path d="m14 6 3 3"/></>,
    extract: <><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5M8 17h7"/></>,
    research: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    engineering: <><path d="m14.7 6.3 3 3M4 20l4.5-1 9.8-9.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/></>,
    clinical: <><path d="M12 21s8-4 8-10V5l-8-3-8 3v6c0 6 8 10 8 10Z"/><path d="M9 12h6M12 9v6"/></>,
    design: <><path d="M4 20 8 4l12 12-16 4Z"/><path d="m8 4 4 12"/></>,
    policy: <><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
    microphone: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("Loading chat...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState("analyze");
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/landing");
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
        setAttachments(chat.attachments || []);
        setMode(chat.mode || "analyze");
        setCanvasBlocks(chat.canvasBlocks || (chat.canvasNotes ? [{ id: crypto.randomUUID(), type: "text", content: chat.canvasNotes }] : []));
      } catch (error) {
        if (error instanceof DriveAuthorizationRequiredError) {
          router.replace(`/connect-drive?reauthorize=1&returnTo=/chat/${resolvedParams.id}`);
          return;
        }
        setTitle("Untitled Chat");
      }
    }
    fetchChat();
  }, [resolvedParams.id, router, user, userData?.chatStorageDriveConnected, userData?.chatStorageDriveFolderId, loading]);

  const handleSend = async () => {
    if (!query.trim() || !user || isSubmitting) return;
    try {
      setIsSubmitting(true);
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
      const attachment = await uploadChatAttachment(user.uid, chatStorageFolderId, resolvedParams.id, file);
      setAttachments((current) => [...current, attachment]);
    } catch (error) {
      console.error("Error uploading attachment:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceNote = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) return;
    const chatStorageFolderId = userData?.chatStorageDriveFolderId;
    if (!user || !userData?.chatStorageDriveConnected || !chatStorageFolderId) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error("Microphone permission was not granted:", error);
      return;
    }
    const recorder = new MediaRecorder(stream);
    recordingChunksRef.current = [];
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordingChunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      const voiceNote = new File(recordingChunksRef.current, `voice-note-${Date.now()}.webm`, { type: recorder.mimeType || "audio/webm" });
      try {
        setIsUploading(true);
        const attachment = await uploadChatAttachment(user.uid, chatStorageFolderId, resolvedParams.id, voiceNote);
        setAttachments((current) => [...current, attachment]);
      } catch (error) {
        console.error("Error uploading voice note:", error);
      } finally {
        setIsUploading(false);
      }
    };
    recorder.start();
    setIsRecording(true);
  };

  const handleModeChange = async (nextMode: string) => {
    setMode(nextMode);
    if (!user || !userData?.chatStorageDriveFolderId) return;
    try {
      await updateChatWorkspace(user.uid, userData.chatStorageDriveFolderId, resolvedParams.id, { mode: nextMode, canvasBlocks });
    } catch (error) {
      console.error("Error saving chat mode:", error);
    }
  };

  const handleSaveCanvas = async () => {
    if (!user || !userData?.chatStorageDriveFolderId) return;
    try {
      setIsSavingCanvas(true);
      await updateChatWorkspace(user.uid, userData.chatStorageDriveFolderId, resolvedParams.id, { mode, canvasBlocks });
    } catch (error) {
      console.error("Error saving workspace canvas:", error);
    } finally {
      setIsSavingCanvas(false);
    }
  };

  const selectedMode = CHAT_MODES.find((chatMode) => chatMode.id === mode) || CHAT_MODES[0];

  if (loading || !user || !userData?.chatStorageDriveConnected || !userData.chatStorageDriveFolderId) {
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCanvasOpen((open) => !open)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-card/40 px-3 text-[12px] font-medium text-muted-foreground backdrop-blur-xl transition-colors hover:bg-card/70 hover:text-foreground dark:border-white/10 dark:bg-white/5" aria-pressed={canvasOpen}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h5M8 16h8"/></svg>
                Canvas
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* ── Main Chat Interface ── */}
        <main className={`flex-1 flex flex-col items-center justify-end px-4 pb-8 h-full pt-24 transition-[padding] duration-300 ${canvasOpen ? "lg:pr-[540px]" : ""}`}>

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

              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/50 px-4 py-2.5 no-scrollbar">
                {CHAT_MODES.map((chatMode) => (
                  <button key={chatMode.id} type="button" onClick={() => void handleModeChange(chatMode.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${mode === chatMode.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} aria-pressed={mode === chatMode.id}><ChatIcon name={chatMode.icon} />{chatMode.label}</button>
                ))}
              </div>
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto px-4 pt-3 no-scrollbar">
                  {attachments.map((attachment) => (
                    <span key={attachment.id} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                      {attachment.name}
                      <span className="text-foreground/50">in context</span>
                    </span>
                  ))}
                </div>
              )}
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
                placeholder={`${CHAT_MODES.find((chatMode) => chatMode.id === mode)?.label || "Ask"} something about your work…`}
                className="w-full bg-transparent resize-none outline-none px-5 pt-5 pb-4 text-[15px] placeholder:text-muted-foreground/60 text-foreground min-h-[56px]"
              />

              <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2.5 no-scrollbar">
                {PROFESSIONAL_KITS.map((kit) => (
                  <button key={kit.label} type="button" onClick={() => setQuery(kit.prompt)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/70 bg-background/30 px-2.5 py-1.5 text-[10.5px] text-muted-foreground transition-colors hover:border-ring/60 hover:bg-muted hover:text-foreground dark:border-white/10"><ChatIcon name={kit.icon} size={13} />{kit.label}</button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <input id="chat-file-upload" type="file" className="hidden" onChange={handleFileSelected} />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-secondary text-muted-foreground text-[12px] font-medium hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap shrink-0">
                        <ChatIcon name="extract" size={13} />
                        Attach files
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => document.getElementById("chat-file-upload")?.click()}>
                        <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        {isUploading ? "Uploading..." : "Upload from computer"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleVoiceNote()}>
                        <ChatIcon name="microphone" size={14} />
                        {isRecording ? "Stop voice note" : "Record voice note"}
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
                  <button type="button" onClick={() => void handleVoiceNote()} className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${isRecording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"}`} aria-pressed={isRecording}>
                    <ChatIcon name="microphone" size={13} />
                    {isRecording ? "Stop" : "Voice note"}
                  </button>
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
      {canvasOpen && (
        <WorkspaceCanvas
          blocks={canvasBlocks}
          messages={messages}
          attachments={attachments}
          saving={isSavingCanvas}
          onChange={setCanvasBlocks}
          onSave={() => void handleSaveCanvas()}
          onClose={() => setCanvasOpen(false)}
        />
      )}
    </div>
  );
}
