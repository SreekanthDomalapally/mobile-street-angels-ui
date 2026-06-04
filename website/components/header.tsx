"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { NAV_LINKS } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-navy/95 backdrop-blur-md shadow-sm border-b border-navy/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="#home" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" priority />
          <span className="font-bold text-lg text-navy dark:text-white">YouHooAlert</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/80 hover:text-coral dark:text-gray-800/90 dark:hover:text-coral transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {mounted && (
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 text-navy/70 hover:bg-navy/5 dark:text-gray-800 dark:hover:bg-white/10"
            >
              <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>
          )}
          <Button href="#download" variant="primary" className="!py-2.5 !px-5 text-sm">
            Download App
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-navy dark:text-white"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-navy/10 bg-white dark:bg-navy px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium py-2"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button href="#download" className="w-full">Download App</Button>
        </div>
      )}
    </header>
  );
}
