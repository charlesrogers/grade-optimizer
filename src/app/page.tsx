"use client";

import { useRouter } from "next/navigation";
import { ConnectForm } from "@/components/connect-form";
import { enableDemoMode } from "@/lib/demo-mode";

export default function Home() {
  const router = useRouter();

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
