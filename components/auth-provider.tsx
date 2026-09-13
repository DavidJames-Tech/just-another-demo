"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp, type DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData {
  hasPaidPro?: boolean;
  subscriptionStatus?: "free" | "payment_submitted" | "active";
  subscriptionPlan?: "essential-monthly" | "pro-quarterly";
  paymentSubmittedAt?: unknown;
  subscriptionCheckBackDate?: string;
  subscriptionActivatedAt?: unknown;
  pendingVerification?: boolean;
  chatStorageDriveConnected?: boolean;
  chatStorageDriveFolderId?: string;
  chatStorageDriveEmail?: string;
  chatStorageDriveConnectedAt?: unknown;
  uploadDriveConnected?: boolean;
  uploadDriveAccountEmail?: string;
  uploadDriveConnectedAt?: unknown;
  driveFolderId?: string;
  driveAccountEmail?: string;
  driveConnectedAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeDocRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Always clean up previous Firestore listener first
      unsubscribeDocRef.current?.();
      unsubscribeDocRef.current = null;

      setUser(currentUser);
      setUserData(null);
      setLoading(true);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        let snapshotResolved = false;

        const resolveUserData = async (docSnap: DocumentSnapshot) => {
          if (snapshotResolved) {
            setUserData(docSnap.exists() ? (docSnap.data() as UserData) : null);
            return;
          }
          snapshotResolved = true;

          if (!docSnap.exists()) {
            setUserData(null);
            setLoading(false);
            return;
          }

          const data = docSnap.data() as UserData;
          let resolvedData = data;

          if (!data.subscriptionStatus) {
            resolvedData = { ...data, subscriptionStatus: "free" };
            await setDoc(userRef, { subscriptionStatus: "free" }, { merge: true });
          }
          const legacyFolderId = data.driveFolderId;
          const hasLegacyDriveConnection = Boolean(legacyFolderId) && !data.chatStorageDriveConnected;

          if (hasLegacyDriveConnection) {
            const migratedData: UserData = {
              ...resolvedData,
              chatStorageDriveConnected: true,
              chatStorageDriveFolderId: legacyFolderId,
              chatStorageDriveEmail: data.driveAccountEmail,
              chatStorageDriveConnectedAt: data.driveConnectedAt,
            };
            await setDoc(
              userRef,
              {
                chatStorageDriveConnected: true,
                chatStorageDriveFolderId: legacyFolderId,
                chatStorageDriveEmail: data.driveAccountEmail,
                chatStorageDriveConnectedAt: data.driveConnectedAt || serverTimestamp(),
              },
              { merge: true }
            );
            setUserData(migratedData);
          } else {
            setUserData(resolvedData);
          }
          setLoading(false);
        };

        setDoc(
          userRef,
          {
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        )
          .then(() => {
            unsubscribeDocRef.current = onSnapshot(
              userRef,
              (docSnap) => {
                void resolveUserData(docSnap).catch((error) => {
                  // A legacy-field migration must not block the already-readable profile.
                  console.warn("Firestore UserData migration skipped:", error);
                  setUserData(docSnap.exists() ? (docSnap.data() as UserData) : null);
                  setLoading(false);
                });
              },
              (error) => {
                console.error("Firestore UserData error:", error);
                setUserData(null);
                setLoading(false);
              }
            );
          })
          .catch((error) => {
            console.error("Firestore UserData setup error:", error);
            setUserData(null);
            setLoading(false);
          });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDocRef.current?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
