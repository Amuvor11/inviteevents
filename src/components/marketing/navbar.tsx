"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Invite<span className="text-primary">Events</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Можливості</a>
          <a href="#templates" className="hover:text-foreground">Шаблони</a>
          <a href="#how-it-works" className="hover:text-foreground">Як це працює</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">Увійти</Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Почати</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
