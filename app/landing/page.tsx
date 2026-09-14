"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { MovingBorder } from "@/components/ui/moving-border";

const FEATURES = [
  {
    title: "Private by Design",
    desc: "Your documents and conversations stay completely private. Zero data sharing, ever.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: "Deep File Analysis",
    desc: "Analyze PDFs, spreadsheets, audio recordings, images and more — all in one workspace.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    title: "Research & Drafting",
    desc: "Summarize research, draft detailed reports, and extract key insights — instantly.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to the app
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-x-hidden select-none relative">

      {/* ── Global Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <BackgroundBeams />
        <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[700px] bg-peach-500/20 dark:bg-peach-500/12 blur-[160px] rounded-[100%]" />
        <div className="absolute bottom-0 right-[-10%] w-[600px] h-[400px] bg-peach-500/8 blur-[100px] rounded-[100%]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.3] dark:opacity-[0.12] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="landing-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#landing-noise)" />
        </svg>
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Beamthread</span>
        </div>

        <p className="hidden md:block text-[13px] font-medium text-muted-foreground">
          Private AI for work
        </p>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <MovingBorder className="rounded-lg">
            <Link href="/signup" className="inline-flex h-8 items-center rounded-[7px] bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-80">
              Create account
            </Link>
          </MovingBorder>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-24 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-border bg-card/60 text-[12px] font-medium text-muted-foreground mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-peach-500 animate-pulse" />
          Private AI for serious work
        </div>

        {/* Headline */}
        <div className="relative mb-6 isolate">
          <div className="dark:absolute dark:-inset-x-16 dark:-inset-y-8 dark:-z-10 dark:rounded-[50%] dark:bg-background/55 dark:blur-2xl" aria-hidden="true" />
          <h1 className="relative text-[52px] md:text-[72px] font-semibold tracking-tight leading-[1.05] text-foreground max-w-3xl">
            Work smarter.
            <br />
            <span className="text-muted-foreground/60">Stay private.</span>
          </h1>
        </div>

        <p className="text-[16px] text-muted-foreground max-w-[500px] mb-10 leading-relaxed">
          Beamthread is your personal AI workspace. Analyze documents, draft reports,
          and extract insights — completely private, completely yours.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mb-24">
          <MovingBorder>
            <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-80">
              Create your account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </MovingBorder>
          <Link
            href="/login"
            className="inline-flex items-center h-11 px-6 border border-border bg-card/60 text-[14px] font-medium rounded-xl hover:bg-muted/60 transition-colors backdrop-blur-sm"
          >
            Sign in
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="text-left p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-peach-500/10 border border-peach-500/20 flex items-center justify-center mb-4 text-peach-600 dark:text-peach-400 group-hover:bg-peach-500/15 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-[14.5px] font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex items-center justify-center gap-4 px-8 py-5 text-[12px] text-muted-foreground">
        <span>© 2026 Beamthread, Inc.</span>
        <span className="w-px h-3 bg-border" />
        <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
        <span className="w-px h-3 bg-border" />
        <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
      </footer>

    </div>
  );
}
