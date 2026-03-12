"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isDemoMode, disableDemoMode } from "@/lib/demo-mode";

export function DemoBanner() {
  const [demo, setDemo] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setDemo(isDemoMode());
  }, [pathname]);

  if (!demo || pathname === "/") return null;

  function handleExit() {
    disableDemoMode();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <p className="text-[12px] font-medium text-amber-800">
            Demo mode — showing sample data
          </p>
        </div>
        <button
          onClick={handleExit}
          className="text-[12px] font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
