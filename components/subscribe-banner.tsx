"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function SubscribeBanner() {
  const { user, userData, loading } = useAuth();

  // Don't show if loading, not logged in, or already paid
  if (loading || !user || userData?.hasPaidPro) return null;

  return (
    <div className="pointer-events-auto flex items-center justify-center h-8 px-4 rounded-full bg-peach-500/10 border border-peach-500/20 text-peach-600 dark:text-peach-400 text-[12.5px] font-medium shadow-sm backdrop-blur-sm">
      <p className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Workspace is read-only.
        <Link href="/subscribe" className="underline underline-offset-4 font-semibold hover:opacity-80 transition-opacity ml-1">
          Upgrade
        </Link>
      </p>
    </div>
  );
}
