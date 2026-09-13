"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/connect-drive");
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-card border border-border rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border/60">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-1">
            Create your workspace
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Create your account, then choose the plan that fits your work.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-10 flex flex-col items-center">
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-[14px] font-medium text-foreground hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Connecting...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Sign up with Google
              </>
            )}
          </button>
          
          <p className="text-[11.5px] text-center text-muted-foreground leading-relaxed mt-6">
            By signing up, you agree to our{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 text-center">
          <p className="text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-foreground hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
