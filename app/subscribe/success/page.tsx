"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function formatCheckBackDate(value?: string) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  if (!value) {
    let workingDays = 0;
    while (workingDays < 3) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) workingDays += 1;
    }
  }
  return new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function PaymentSuccessPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && (!userData?.subscriptionStatus || userData.subscriptionStatus === "free")) {
      router.replace("/subscribe/checkout");
    }
  }, [loading, router, user, userData?.subscriptionStatus]);

  if (loading || !user || !userData?.subscriptionStatus || userData.subscriptionStatus === "free") {
    return <main className="flex min-h-screen items-center justify-center bg-background"><span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" /></main>;
  }

  const checkBackDate = formatCheckBackDate(userData.subscriptionCheckBackDate);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <header className="flex-none flex items-center justify-between px-8 py-5 relative z-10 bg-gradient-to-b from-background via-background/80 to-transparent">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Beamthread</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Animated checkmark */}
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-8 shadow-lg">
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-background"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="max-w-sm space-y-3 mb-10">
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
            Your plan is being configured
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Because Beamthread is private and user-controlled, activation is completed carefully rather than immediately. We verify your payment, confirm the selected plan, and configure your workspace without taking control of your stored work.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Please check back by <strong className="font-semibold text-foreground">{checkBackDate}</strong>. This gives us three working days to complete the review and configuration.
          </p>
        </div>

        <p className="mt-10 text-[12.5px] text-muted-foreground">
          An email will be sent to you when your account becomes active.
        </p>
      </main>
    </div>
  );
}
