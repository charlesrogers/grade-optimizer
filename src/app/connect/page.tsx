"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ConnectForm } from "@/components/connect-form";
import { enableDemoMode } from "@/lib/demo-mode";
import { Suspense } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  const messages: Record<string, string> = {
    oauth_failed: "Canvas login failed. Please try again or use an access token.",
    oauth_denied: "Canvas authorization was denied. You can still connect with an access token.",
  };

  return (
    <div className="w-full max-w-md mb-4">
      <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 text-[13px] text-destructive">
        {messages[error] || "Something went wrong. Please try again."}
      </div>
    </div>
  );
}

function ConnectContent() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleTryDemo() {
    enableDemoMode();
    router.push("/family");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      {/* Mini nav */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-foreground">
            Jebbix
          </span>
        </Link>
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="text-center mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-[13px] font-medium mb-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Connected to Canvas LMS
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Know what matters most
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Get a prioritized to-do list ranked by grade impact.
          Focus on the assignments that move your GPA the most.
        </p>
      </div>

      <Suspense>
        <OAuthErrorBanner />
      </Suspense>

      <ConnectForm />

      <button
        onClick={handleTryDemo}
        className="mt-6 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
      >
        Try with sample data
      </button>

      <p className="mt-6 text-xs text-muted-foreground/60 max-w-sm text-center leading-relaxed">
        Your data stays in your browser. We never store your credentials or grades on our servers.
      </p>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense>
      <ConnectContent />
    </Suspense>
  );
}
