"use client";

import { useState } from "react";
import { CanvasBlock, ChatAttachment, ChatMessage } from "@/lib/drive-storage";

interface WorkspaceCanvasProps {
  blocks: CanvasBlock[];
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  saving: boolean;
  onChange: (blocks: CanvasBlock[]) => void;
  onSave: () => void;
  onClose: () => void;
}

function blockLabel(type: CanvasBlock["type"]) {
  return { heading: "Heading", text: "Note", checklist: "Action", quote: "Pinned response", file: "File" }[type];
}

export function WorkspaceCanvas({ blocks, messages, attachments, saving, onChange, onSave, onClose }: WorkspaceCanvasProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const addBlock = (type: CanvasBlock["type"], content = "") => {
    const id = crypto.randomUUID();
    const block = type === "checklist"
      ? { id, type, content: content || "New action item", checked: false }
      : type === "file"
        ? { id, type, content: content || "Attached file", fileId: attachments[0]?.id || "" }
        : { id, type, content };
    onChange([...blocks, block as CanvasBlock]);
  };

  const updateBlock = (id: string, patch: Partial<CanvasBlock>) => {
    onChange(blocks.map((block) => block.id === id ? { ...block, ...patch } as CanvasBlock : block));
  };

  const removeBlock = (id: string) => onChange(blocks.filter((block) => block.id !== id));

  const moveBlock = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = blocks.findIndex((block) => block.id === draggedId);
    const to = blocks.findIndex((block) => block.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDraggedId(null);
  };

  const pinLatestResponse = () => {
    const response = [...messages].reverse().find((message) => message.role === "assistant");
    if (!response) return;
    addBlock("quote", response.content);
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[520px] flex-col border-l border-border bg-background/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#120f0d]/95">
      <header className="flex items-center justify-between border-b border-border/70 px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">Canvas</h2>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close canvas">×</button>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border/70 px-5 py-3 dark:border-white/10">
        <button type="button" onClick={() => addBlock("heading", "New section")} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10">+ Heading</button>
        <button type="button" onClick={() => addBlock("text", "")} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10">+ Note</button>
        <button type="button" onClick={() => addBlock("checklist")} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10">+ Action</button>
        {attachments.length > 0 && <button type="button" onClick={() => addBlock("file", attachments[0].name)} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10">+ File</button>}
        <button type="button" onClick={pinLatestResponse} disabled={!messages.some((message) => message.role === "assistant")} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 dark:border-white/10">Pin latest response</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {blocks.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border px-8 text-center dark:border-white/15">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground dark:bg-white/8">✦</div>
            <h3 className="text-[14px] font-semibold text-foreground">Build your working surface</h3>
            <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-muted-foreground">Pin responses, organize findings, and keep action items beside the conversation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div key={block.id} draggable onDragStart={() => setDraggedId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveBlock(block.id)} className="group rounded-xl border border-border/80 bg-card/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{blockLabel(block.type)}</span>
                  <button type="button" onClick={() => removeBlock(block.id)} className="text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" aria-label="Remove block">Remove</button>
                </div>
                {block.type === "heading" ? (
                  <input value={block.content} onChange={(event) => updateBlock(block.id, { content: event.target.value })} className="w-full bg-transparent text-[16px] font-semibold tracking-tight text-foreground outline-none" />
                ) : block.type === "checklist" ? (
                  <label className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground"><input type="checkbox" checked={block.checked} onChange={(event) => updateBlock(block.id, { checked: event.target.checked })} className="mt-1 accent-[var(--peach-500)]" /><input value={block.content} onChange={(event) => updateBlock(block.id, { content: event.target.value })} className="min-w-0 flex-1 bg-transparent outline-none" /></label>
                ) : block.type === "file" ? (
                  <p className="text-[13px] text-foreground">{block.content}</p>
                ) : (
                  <textarea value={block.content} onChange={(event) => updateBlock(block.id, { content: event.target.value })} className="min-h-[76px] w-full resize-y bg-transparent text-[13px] leading-relaxed text-foreground outline-none" placeholder="Write something useful..." />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-border/70 px-5 py-4 dark:border-white/10">
        <button type="button" onClick={onSave} disabled={saving} className="flex h-10 w-full items-center justify-center rounded-lg bg-foreground text-[13px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50">{saving ? "Saving canvas..." : "Save canvas"}</button>
      </footer>
    </aside>
  );
}