"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { connectGoogleDrive } from "@/lib/google-drive";

export default function ConnectDrivePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReauthorizing = searchParams.get("reauthorize") === "1";
  const returnTo = searchParams.get("returnTo") || "/";
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && userData?.chatStorageDriveConnected && !isReauthorizing) router.replace("/");
  }, [isReauthorizing, loading, router, user, userData?.chatStorageDriveConnected]);

  if (loading) {
    return <PageShell><Spinner /></PageShell>;
  }

  if (!user) {
    return null;
  }

  if (userData?.chatStorageDriveConnected) {
    return <PageShell><Spinner /></PageShell>;
  }

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectGoogleDrive(
        user.uid,
        userData?.chatStorageDriveFolderId || userData?.driveFolderId
      );
      router.replace(isReauthorizing ? returnTo : "/");
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : "Google Drive could not be connected.");
      setConnecting(false);
    }
  };

  return (
    <PageShell>
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Beamthread</span>
        </div>

        <div className="mb-8 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{isReauthorizing ? "Reconnect storage" : "One last step"}</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{isReauthorizing ? "Reconnect your Google Drive" : "Connect your Google Drive"}</h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Your chats, uploaded files, and generated work will be kept in a private <strong className="font-semibold text-foreground">beamthread_chats</strong> folder in your Drive. Beamthread does not keep a cloud copy of that content.
          </p>
        </div>

        <div className="mb-8 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-[13px] text-muted-foreground">
          <p className="font-medium text-foreground">What Beamthread can access</p>
          <p>Only files and folders created by Beamthread, so your existing Drive stays private.</p>
          <p>No Drive password or access token is stored by Beamthread.</p>
        </div>

        {error && <p className="mb-4 text-[13px] text-destructive">{error}</p>}

        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-foreground text-[14px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {connecting ? <Spinner /> : "Connect Google Drive"}
        </button>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 py-12">{children}</main>;
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading" />;
}