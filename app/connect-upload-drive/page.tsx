"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { connectUploadGoogleDrive } from "@/lib/google-drive";

export default function ConnectUploadDrivePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && userData?.uploadDriveConnected) router.replace("/");
  }, [loading, router, user, userData?.uploadDriveConnected]);

  if (loading || !user || userData?.uploadDriveConnected) {
    return <main className="flex min-h-screen w-full items-center justify-center bg-muted/30"><Spinner /></main>;
  }

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectUploadGoogleDrive(user.uid);
      router.replace("/");
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : "Google Drive could not be connected.");
      setConnecting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Beamthread</span>
        </div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Optional file source</p>
        <h1 className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">Connect a Drive for uploads</h1>
        <p className="mb-8 text-[14px] leading-relaxed text-muted-foreground">
          This connection is separate from chat history storage. It lets you choose existing files from a Google Drive account to attach to your work.
        </p>
        <div className="mb-8 rounded-xl border border-border bg-muted/30 p-4 text-[13px] text-muted-foreground">
          Beamthread will request read-only access to this Drive. Your chat history will continue using the private storage Drive connection.
        </div>
        {error && <p className="mb-4 text-[13px] text-destructive">{error}</p>}
        <button type="button" onClick={handleConnect} disabled={connecting} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-foreground text-[14px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50">
          {connecting ? <Spinner /> : "Connect Drive for uploads"}
        </button>
        <button type="button" onClick={() => router.replace("/")} className="mt-3 h-10 w-full rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground">
          Skip for now
        </button>
      </div>
    </main>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading" />;
}