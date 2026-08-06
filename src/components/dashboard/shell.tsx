"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-bold">
            Invite<span className="text-primary">Events</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard/events/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Нове запрошення
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}

export function DashboardNav({ eventId }: { eventId?: string }) {
  const pathname = usePathname();
  const links = eventId
    ? [
        { href: `/dashboard/events/${eventId}`, label: "Огляд", icon: LayoutDashboard },
        { href: `/dashboard/events/${eventId}/design`, label: "Дизайн", icon: Calendar },
        { href: `/dashboard/events/${eventId}/guests`, label: "Гості", icon: Calendar },
        { href: `/dashboard/events/${eventId}/questions`, label: "Опитування", icon: Calendar },
        { href: `/dashboard/events/${eventId}/analytics`, label: "Аналітика", icon: Calendar },
        { href: `/dashboard/events/${eventId}/edit`, label: "Налаштування", icon: Calendar },
      ]
    : [];

  if (!eventId) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
