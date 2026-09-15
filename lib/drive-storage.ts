import { withGoogleDriveAccess } from "@/lib/google-drive";

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const CHAT_FILE_PREFIX = "beamthread_chat_";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
}

export type CanvasBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "checklist"; content: string; checked: boolean }
  | { id: string; type: "quote"; content: string; sourceMessageId?: string }
  | { id: string; type: "file"; content: string; fileId: string };

export interface ChatDocument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  mode?: string;
  canvasNotes?: string;
  canvasBlocks?: CanvasBlock[];
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt?: string;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  appProperties?: Record<string, string>;
}

function assertDriveResponse(response: Response, message: string) {
  if (!response.ok) {
    throw new Error(`${message} (${response.status}). ${response.statusText}`);
  }
}

function createChatFileName(chatId: string) {
  return `${CHAT_FILE_PREFIX}${chatId}.json`;
}

async function uploadJson(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: ChatDocument,
  existingFileId?: string
) {
  const metadata = {
    name: fileName,
    mimeType: "application/json",
    ...(existingFileId ? {} : { parents: [folderId] }),
    appProperties: {
      beamthreadChat: "true",
      beamthreadChatId: content.id,
      beamthreadChatTitle: content.title,
    },
  };
  const boundary = `beamthread_${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    JSON.stringify(content),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const endpoint = existingFileId
    ? `${DRIVE_UPLOAD_URL}/${encodeURIComponent(existingFileId)}?uploadType=multipart`
    : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
  const response = await fetch(endpoint, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  assertDriveResponse(response, "Beamthread could not save this chat to Google Drive.");
  return (await response.json()) as DriveFile;
}

async function findChatFile(accessToken: string, folderId: string, chatId: string) {
  const query = encodeURIComponent(
    `'${folderId}' in parents and trashed = false and appProperties has { key = 'beamthreadChatId' and value = '${chatId}' }`
  );
  const response = await fetch(
    `${DRIVE_API_URL}?q=${query}&spaces=drive&fields=files(id,name,modifiedTime,appProperties)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  assertDriveResponse(response, "Beamthread could not find this chat in Google Drive.");
  const data = (await response.json()) as { files?: DriveFile[] };
  return data.files?.[0] || null;
}

async function downloadChat(accessToken: string, fileId: string) {
  const response = await fetch(`${DRIVE_API_URL}/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assertDriveResponse(response, "Beamthread could not open this chat from Google Drive.");
  return (await response.json()) as ChatDocument;
}

export async function createChatSession(userId: string, folderId: string, initialMessage: string) {
  const now = new Date().toISOString();
  const chat: ChatDocument = {
    id: crypto.randomUUID(),
    title: initialMessage.slice(0, 40) + (initialMessage.length > 40 ? "..." : ""),
    createdAt: now,
    updatedAt: now,
    messages: [{ role: "user", content: initialMessage, createdAt: now }],
    attachments: [],
  };
  await withGoogleDriveAccess(
    userId,
    (accessToken) => uploadJson(accessToken, folderId, createChatFileName(chat.id), chat),
    { interactive: true }
  );
  return chat.id;
}

export async function loadChatSession(userId: string, folderId: string, chatId: string) {
  return withGoogleDriveAccess(userId, async (accessToken) => {
    const file = await findChatFile(accessToken, folderId, chatId);
    if (!file) return null;
    return downloadChat(accessToken, file.id);
  });
}

export async function appendChatMessage(
  userId: string,
  folderId: string,
  chatId: string,
  message: string
) {
  return withGoogleDriveAccess(userId, async (accessToken) => {
    const file = await findChatFile(accessToken, folderId, chatId);
    if (!file) throw new Error("This chat no longer exists in Google Drive.");
    const chat = await downloadChat(accessToken, file.id);
    const updatedChat = {
      ...chat,
      updatedAt: new Date().toISOString(),
      messages: [...chat.messages, { role: "user" as const, content: message, createdAt: new Date().toISOString() }],
    };
    await uploadJson(accessToken, folderId, file.name, updatedChat, file.id);
    return updatedChat;
  }, { interactive: true });
}

export async function updateChatWorkspace(
  userId: string,
  folderId: string,
  chatId: string,
  updates: Pick<ChatDocument, "mode" | "canvasNotes" | "canvasBlocks">
) {
  return withGoogleDriveAccess(userId, async (accessToken) => {
    const file = await findChatFile(accessToken, folderId, chatId);
    if (!file) throw new Error("This chat no longer exists in Google Drive.");
    const chat = await downloadChat(accessToken, file.id);
    const updatedChat = { ...chat, ...updates, updatedAt: new Date().toISOString() };
    await uploadJson(accessToken, folderId, file.name, updatedChat, file.id);
    return updatedChat;
  }, { interactive: true });
}

export async function listChatSessions(userId: string, folderId: string) {
  return withGoogleDriveAccess(userId, async (accessToken) => {
    const query = encodeURIComponent(
      `'${folderId}' in parents and trashed = false and appProperties has { key = 'beamthreadChat' and value = 'true' }`
    );
    const response = await fetch(
      `${DRIVE_API_URL}?q=${query}&spaces=drive&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,appProperties)&pageSize=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    assertDriveResponse(response, "Beamthread could not load chat history from Google Drive.");
    const data = (await response.json()) as { files?: DriveFile[] };
    return (data.files || []).map((file) => ({
      id: file.appProperties?.beamthreadChatId || file.id,
      title: file.appProperties?.beamthreadChatTitle || "Untitled chat",
      updatedAt: file.modifiedTime,
    }));
  });
}

export async function uploadChatAttachment(
  userId: string,
  folderId: string,
  chatId: string,
  file: File
) {
  return withGoogleDriveAccess(userId, async (accessToken) => {
    const boundary = `beamthread_${crypto.randomUUID()}`;
    const metadata = JSON.stringify({
      name: `${chatId}_${file.name}`,
      parents: [folderId],
      mimeType: file.type || "application/octet-stream",
      appProperties: { beamthreadChatId: chatId, beamthreadAttachment: "true" },
    });
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
      file,
      `\r\n--${boundary}--\r\n`,
    ]);
    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    assertDriveResponse(response, "Beamthread could not upload this file to Google Drive.");
    const attachment = (await response.json()) as ChatAttachment;
    const chatFile = await findChatFile(accessToken, folderId, chatId);
    if (chatFile) {
      const chat = await downloadChat(accessToken, chatFile.id);
      await uploadJson(
        accessToken,
        folderId,
        chatFile.name,
        {
          ...chat,
          updatedAt: new Date().toISOString(),
          attachments: [...chat.attachments, attachment],
        },
        chatFile.id
      );
    }
    return attachment;
  }, { interactive: true });
}
