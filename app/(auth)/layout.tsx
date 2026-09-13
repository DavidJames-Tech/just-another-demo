import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-muted/30">
      <header className="flex-none flex items-center justify-between px-8 py-5 relative z-10 bg-gradient-to-b from-background via-background/80 to-transparent">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 shrink-0">
            <Image src="/beam-thread-logo.png" alt="Beamthread" fill sizes="28px" className="object-contain dark:invert" priority />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Beamthread</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        {children}
      </main>

      <footer className="flex-none flex items-center justify-center px-8 py-5">
        <p className="text-[12px] text-muted-foreground">
          © 2026 Beamthread, Inc. ·{" "}
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          {" "}·{" "}
          <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
