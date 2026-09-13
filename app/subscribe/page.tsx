import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const BASIC_FEATURES = [
  "5 file uploads per day",
  "Basic document analysis",
  "Standard response speed",
  "Community support",
];

const PRO_FEATURES = [
  "Unlimited file uploads",
  "Advanced document & spreadsheet analysis",
  "Meeting transcription & summarization",
  "Priority response speed",
  "Email & priority support",
  "Early access to new features",
];

const ESSENTIAL_FEATURES = [
  "20 file uploads per month",
  "Standard document analysis",
  "Standard response speed",
  "Email support",
];

function CheckIcon({ dim = false }: { dim?: boolean }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={dim ? "text-muted-foreground/60 shrink-0" : "text-foreground shrink-0"}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function SubscribePage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-muted/30">
      <header className="flex-none flex items-center justify-between px-8 py-5 relative z-10 bg-gradient-to-b from-background via-background/80 to-transparent">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Beamthread</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Headline */}
        <div className="text-center mb-14 space-y-3">
          <h1 className="text-3xl md:text-[38px] font-semibold tracking-tight text-foreground leading-[1.15]">
            Simple, transparent pricing
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-sm mx-auto">
            Choose monthly flexibility or lock in the best value for serious work.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-5 w-full max-w-[1120px]">

          {/* Basic */}
          <div className="flex flex-col rounded-xl bg-card border border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-8">
              <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-3">
                Basic
              </p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-[42px] font-semibold tracking-tight leading-none text-foreground">₦0</span>
                <span className="text-[13.5px] text-muted-foreground mb-1.5">/month</span>
              </div>
              <p className="text-[13.5px] text-muted-foreground">
                For individuals exploring AI-assisted work.
              </p>
            </div>

            <ul className="flex-1 space-y-3.5 mb-8">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[13.5px] text-foreground/70">
                  <CheckIcon dim />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="flex h-10 items-center justify-center rounded-lg border border-border bg-background text-[13.5px] font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Essential monthly */}
          <div className="flex flex-col rounded-xl bg-card border border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-8">
              <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-3">
                Essential
              </p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-[42px] font-semibold tracking-tight leading-none text-foreground">₦35k</span>
                <span className="text-[13.5px] text-muted-foreground mb-1.5">/month</span>
              </div>
              <p className="text-[13.5px] text-muted-foreground">
                A focused monthly plan for lighter workloads.
              </p>
            </div>

            <ul className="flex-1 space-y-3.5 mb-8">
              {ESSENTIAL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[13.5px] text-foreground/70">
                  <CheckIcon dim />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/subscribe/checkout?plan=essential-monthly"
              className="flex h-10 items-center justify-center rounded-lg border border-border bg-background text-[13.5px] font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Choose Essential — ₦35,000/mo
            </Link>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-xl bg-foreground border border-foreground shadow-[0_4px_32px_rgba(0,0,0,0.12)] p-8 relative overflow-hidden">
            {/* Subtle texture on Pro card */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: `24px 24px` }}
            />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11.5px] font-semibold text-background/60 uppercase tracking-[0.12em]">Pro quarterly</p>
                  <p className="text-[11px] text-background/50 mt-1">3 months of full access</p>
                </div>
                <Badge className="bg-background/20 text-background border-0 text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-0.5 hover:bg-background/20">
                  Save 43%
                </Badge>
              </div>

              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-[42px] font-semibold tracking-tight leading-none text-background">₦60k</span>
                <span className="text-[13.5px] text-background/60 mb-1.5">/3 months</span>
              </div>
              <p className="text-[13.5px] text-background/60 mb-8">
                Full access at ₦20,000 per month when paid quarterly.
              </p>

              <ul className="flex-1 space-y-3.5 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[13.5px] text-background/80">
                    <svg
                      width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="text-background shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/subscribe/checkout?plan=pro-quarterly"
                className="flex h-11 items-center justify-center rounded-lg bg-background text-[13.5px] font-semibold text-foreground hover:bg-background/90 active:bg-background/80 transition-colors shadow-sm"
              >
                Choose Pro quarterly — ₦60,000
              </Link>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-12 flex items-center gap-6 flex-wrap justify-center">
          {[
            { icon: "🔒", text: "End-to-end encrypted" },
            { icon: "🚫", text: "Never trains on your data" },
            { icon: "✖", text: "Cancel any time" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
