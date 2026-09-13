"use client";

import { useAuth } from "@/components/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, userData } = useAuth();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border bg-card p-0 overflow-hidden shadow-lg">
        
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-[18px] font-semibold tracking-tight text-foreground">
            Settings
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Manage your account and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* Profile Section */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-widest">
              Profile
            </h4>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName || "User"} width={48} height={48} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-peach-500 text-white text-[16px] font-bold">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-foreground truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-[13px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-widest">
              Plan
            </h4>
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14.5px] font-medium text-foreground">
                    {userData?.hasPaidPro ? "Beamthread Pro" : "Free Tier"}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {userData?.hasPaidPro ? "Active subscription" : "Read-only access"}
                  </p>
                </div>
                {userData?.hasPaidPro ? (
                  <div className="h-6 px-2 flex items-center justify-center rounded-full bg-peach-500/10 text-peach-600 dark:text-peach-400 text-[11px] font-bold tracking-wide uppercase border border-peach-500/20">
                    Pro
                  </div>
                ) : (
                  <Link
                    href="/subscribe"
                    onClick={() => onOpenChange(false)}
                    className="h-8 px-3 inline-flex items-center justify-center rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-widest">
              Appearance
            </h4>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
              <div>
                <p className="text-[14.5px] font-medium text-foreground">Theme</p>
                <p className="text-[12.5px] text-muted-foreground">Toggle light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
