"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "For Schools" },
  { href: "/parents", label: "For Parents" },
  { href: "/partners", label: "Partners" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-foreground">
            Jebbix
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
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
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <Link
            href="/connect"
            className="hidden md:inline-flex items-center px-4 py-1.5 text-[13px] font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px"
          >
            Sign In
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg">
          <div className="px-6 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 text-[13px] font-medium rounded-md transition-colors ${
                  pathname === link.href
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/connect"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-[13px] font-medium text-primary"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
