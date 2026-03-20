"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { isDemoMode, enableDemoMode, disableDemoMode } from "@/lib/demo-mode";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [demo, setDemo] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDemo(isDemoMode());
    try {
      const stored = sessionStorage.getItem("observees");
      if (stored) {
        const parsed = JSON.parse(stored);
        setIsParent(Array.isArray(parsed) && parsed.length > 0);
      }
    } catch {
      // no observees
    }
  }, []);

  if (["/", "/connect", "/parents", "/partners"].includes(pathname)) return null;

  const links = isParent
    ? [
        { href: "/family", label: "Family" },
        { href: "/dashboard", label: "By Student" },
        { href: "/history", label: "History" },
        { href: "/engagement", label: "Engagement" },
        { href: "/workload", label: "Coming Up" },
        { href: "/tonight", label: "Study Plan" },
      ]
    : [
        { href: "/dashboard", label: "Today" },
        { href: "/history", label: "History" },
        { href: "/engagement", label: "Engagement" },
        { href: "/workload", label: "Coming Up" },
        { href: "/optimizer", label: "All Assignments" },
        { href: "/tonight", label: "Study Plan" },
      ];

  async function handleLogout() {
    setLoggingOut(true);
    disableDemoMode();
    sessionStorage.removeItem("observees");
    await fetch("/api/canvas/logout", { method: "POST" });
    router.push("/connect");
  }

  function handleDemoToggle() {
    if (demo) {
      disableDemoMode();
      router.push("/connect");
      router.refresh();
    } else {
      enableDemoMode();
      router.push("/family");
      router.refresh();
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14">
        <Link href={isParent ? "/family" : "/dashboard"} className="flex items-center gap-2 mr-8">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-foreground">
            Jebbix
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                pathname === link.href
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            role="switch"
            aria-checked={demo}
            onClick={handleDemoToggle}
            className="flex items-center gap-2 group"
          >
            <span className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Demo
            </span>
            <span
              className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200 ${
                demo ? "bg-amber-400" : "bg-gray-200 dark:bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-[18px] w-[18px] rounded-full bg-white dark:bg-neutral-200 shadow-sm transition-transform duration-200 ${
                  demo ? "translate-x-[20px]" : "translate-x-[2px]"
                }`}
              />
            </span>
          </button>
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
          >
            {loggingOut ? "Disconnecting..." : "Disconnect"}
          </button>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <span className="text-[11px] font-semibold text-white">CR</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
