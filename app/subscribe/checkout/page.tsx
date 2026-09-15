"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function getCheckBackDate() {
  const date = new Date();
  let workingDays = 0;
  while (workingDays < 3) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) workingDays += 1;
  }
  return date.toISOString().slice(0, 10);
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") === "essential-monthly" ? "essential-monthly" : "pro-quarterly";
  const plan = selectedPlan === "essential-monthly"
    ? {
        name: "Beamthread Essential",
        billing: "Billed monthly",
        price: "₦35,000.00",
        button: "I have paid — ₦35,000",
        features: ["20 file uploads per month", "Standard document analysis", "Standard response speed", "Email support"],
      }
    : {
        name: "Beamthread Pro",
        billing: "3-month plan",
        price: "₦60,000.00",
        button: "I have paid — ₦60,000",
        features: ["Unlimited file uploads", "Advanced document analysis", "Meeting transcriptions", "Priority support", "Early feature access"],
      };

  // If user is not authenticated after loading, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/subscribe/checkout");
    }
  }, [user, loading, router]);

  const handlePaymentSubmitted = async () => {
    if (!user || processing) return;
    setProcessing(true);
    setPaymentError(null);
    try {
      await setDoc(doc(db, "users", user.uid), {
        subscriptionStatus: "payment_submitted",
        subscriptionPlan: selectedPlan,
        paymentSubmittedAt: new Date().toISOString(),
        subscriptionCheckBackDate: getCheckBackDate(),
        pendingVerification: true,
      }, { merge: true });
      router.push("/");
    } catch (error) {
      console.error("Could not submit payment status:", error);
      setPaymentError(
        "Payment status could not be recorded. Publish the latest firestore.rules file in Firebase Console, then try again."
      );
      setProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <svg className="animate-spin w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">

      {/* Minimal nav */}
      <header className="flex-none flex items-center justify-between px-8 py-5 relative z-10 bg-gradient-to-b from-background via-background/80 to-transparent">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Beamthread</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <LockIcon />
            <span>Secure Checkout</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ─── Left: Order summary ─── */}
        <div className="w-full lg:w-[420px] lg:min-h-screen bg-muted/40 border-b lg:border-b-0 lg:border-r border-border/60 flex flex-col px-8 py-12 lg:px-12">

          <div className="flex-1">
            <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-8">
              Order summary
            </p>

            {/* Plan item */}
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-0.5">
                <p className="text-[15px] font-semibold text-foreground">{plan.name}</p>
                <p className="text-[13px] text-muted-foreground">{plan.billing}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-semibold text-foreground">{plan.price}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60 mb-6" />

            {/* Line items */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">{plan.price}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground font-medium">₦0.00</span>
              </div>
            </div>

            <div className="h-px bg-border/60 mb-6" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-semibold text-foreground">Total due today</span>
              <span className="text-[20px] font-semibold text-foreground">{plan.price}</span>
            </div>

            {/* What you get */}
            <div className="mt-10">
              <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-4">
                What&apos;s included
              </p>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Right: Payment form ─── */}
        <div className="flex-1 flex flex-col items-center justify-start px-8 py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-[480px]">

            <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-2">
              Nigeria Payments
            </h1>
            <p className="text-[13.5px] text-muted-foreground mb-8">
              Please transfer the total amount to the account below. A Beamthread support agent is deployed as a regional proxy in Nigeria to help with faster payment verification and workspace setup. Nigerian subscriptions are received and verified through the Beamthread Nigeria Portal.
            </p>

            <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                    Bank Name
                  </p>
                  <p className="text-[15px] font-medium text-foreground">UBA</p>
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                    Account Name
                  </p>
                  <p className="text-[15px] font-medium text-foreground">Beamthread Nigeria Portal: Attah Blessing Ehi</p>
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                    Account Number
                  </p>
                  <p className="text-[24px] font-semibold tracking-tight text-foreground">2067475180</p>
                </div>
              </div>
            </div>

            <p className="mb-8 rounded-xl border border-border bg-muted/30 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Regional verification note:</span> The Nigeria Portal is a Beamthread-authorized proxy for Nigerian subscriptions. Its account receives Nigeria payments so a regional agent can verify transfers and assist with faster plan setup. Your subscription remains associated with your Beamthread account.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); void handlePaymentSubmitted(); }}>
              {paymentError && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
                  {paymentError}
                </p>
              )}
              <Button
                type="submit"
                disabled={processing}
                className="w-full h-12 text-[14.5px] font-semibold shadow-sm transition-all"
              >
                {processing ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Awaiting Verification...
                  </span>
                ) : (
                  plan.button
                )}
              </Button>

              <p className="text-center text-[12px] text-muted-foreground mt-4 leading-relaxed">
                {processing ? (
                  "Your workspace will be automatically upgraded once we verify the transfer. This may take a few moments."
                ) : (
                  "Click the button above only after you have successfully completed the transfer."
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <svg className="animate-spin w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
