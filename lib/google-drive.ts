import { GoogleAuthProvider, signInWithPopup, updateCurrentUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
let cachedDriveAccess: { userId: string; accessToken: string; expiresAt: number } | null = null;
const DRIVE_SESSION_KEY = "beamthread_drive_access";

function getCachedDriveAccess(userId: string) {
  if (cachedDriveAccess?.userId === userId && cachedDriveAccess.expiresAt > Date.now()) {
    return cachedDriveAccess;
  }

  if (typeof window === "undefined") return null;

  try {
    const stored = JSON.parse(sessionStorage.getItem(DRIVE_SESSION_KEY) || "null") as typeof cachedDriveAccess;
    if (stored?.userId === userId && stored.expiresAt > Date.now()) {
      cachedDriveAccess = stored;
      return stored;
    }
    sessionStorage.removeItem(DRIVE_SESSION_KEY);
  } catch {
    sessionStorage.removeItem(DRIVE_SESSION_KEY);
  }

  return null;
}

function cacheDriveAccess(value: NonNullable<typeof cachedDriveAccess>) {
  cachedDriveAccess = value;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(DRIVE_SESSION_KEY, JSON.stringify(value));
  }
}

export class DriveAuthorizationRequiredError extends Error {
  constructor() {
    super("Google Drive authorization is required.");
    this.name = "DriveAuthorizationRequiredError";
  }
}

export async function withGoogleDriveAccess<T>(
  userId: string,
  operation: (accessToken: string, driveEmail: string | null) => Promise<T>,
  options: { interactive?: boolean } = {}
) {
  const cachedAccess = getCachedDriveAccess(userId);
  if (cachedAccess) {
    return operation(cachedAccess.accessToken, auth.currentUser?.email || null);
  }

  if (!options.interactive) throw new DriveAuthorizationRequiredError();

  const workspaceUser = auth.currentUser;
  const result = await signInWithPopup(auth, createDriveProvider());
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  const switchedAccount = Boolean(workspaceUser && result.user.uid !== workspaceUser.uid);

  if (switchedAccount && workspaceUser) await updateCurrentUser(auth, workspaceUser);
  if (!accessToken) throw new Error("Google did not provide Drive access.");
  cacheDriveAccess({ userId, accessToken, expiresAt: Date.now() + 45 * 60 * 1000 });

  try {
    return await operation(accessToken, result.user.email);
  } finally {
    if (switchedAccount && workspaceUser) await updateCurrentUser(auth, workspaceUser);
  }
}

function createDriveProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_FILE_SCOPE);
  provider.setCustomParameters({ prompt: "select_account consent" });
  return provider;
}

async function createChatsFolder(accessToken: string) {
  const folderResponse = await fetch(DRIVE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "beamthread_chats",
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!folderResponse.ok) {
    const details = await folderResponse.text();
    throw new Error(`Google Drive could not create the Beamthread folder (${folderResponse.status}). ${details}`);
  }

  const folder = (await folderResponse.json()) as { id?: string };
  if (!folder.id) throw new Error("Google Drive returned no folder identifier.");
  return folder.id;
}

export async function connectGoogleDrive(userId: string, existingFolderId?: string) {
  await withGoogleDriveAccess(userId, async (accessToken, driveEmail) => {
    const driveFolderId = existingFolderId || await createChatsFolder(accessToken);
    await setDoc(
      doc(db, "users", userId),
      {
        chatStorageDriveConnected: true,
        chatStorageDriveFolderId: driveFolderId,
        chatStorageDriveEmail: driveEmail,
        chatStorageDriveConnectedAt: serverTimestamp(),
        // Keep the legacy fields readable for existing clients during migration.
        driveFolderId,
        driveAccountEmail: driveEmail,
        driveConnectedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, { interactive: true });
}

export async function connectUploadGoogleDrive(userId: string) {
  const workspaceUser = auth.currentUser;
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/drive.readonly");
  provider.setCustomParameters({ prompt: "select_account consent" });
  const result = await signInWithPopup(auth, provider);

  if (workspaceUser && result.user.uid !== workspaceUser.uid) {
    await updateCurrentUser(auth, workspaceUser);
  }

  await setDoc(
    doc(db, "users", userId),
    {
      uploadDriveConnected: true,
      uploadDriveAccountEmail: result.user.email,
      uploadDriveConnectedAt: serverTimestamp(),
    },
    { merge: true }
  );
}