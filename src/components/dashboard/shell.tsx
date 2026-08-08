"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils/cn";

function useEventIdFromPath() {
  const pathname = usePathname();
  const match = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  if (!match?.[1] || match[1] === "new") return undefined;
  return match[1];
}

function NavLink({
  href,
  label,
  icon: Icon,
  iconClass,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconClass?: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-all duration-150",
        active
          ? "bg-[#e4e4e2] text-[#1f1f1f] dark:bg-background dark:text-foreground"
          : "text-[#2a2a2a] hover:bg-[#e4e4e2] hover:pl-4 dark:text-foreground dark:hover:bg-background",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110",
          iconClass ?? "text-muted-foreground",
        )}
        strokeWidth={2}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarContent({
  eventId,
  onNavigate,
}: {
  eventId?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const eventLinks = useMemo(
    () =>
      eventId
        ? [
            {
              href: `/dashboard/events/${eventId}`,
              label: "Огляд",
              icon: LayoutDashboard,
              iconClass: "text-[#f06632]",
              exact: true,
            },
            {
              href: `/dashboard/events/${eventId}/design`,
              label: "Дизайн",
              icon: Palette,
              iconClass: "text-[#8b5cf6]",
              exact: false,
            },
            {
              href: `/dashboard/events/${eventId}/guests`,
              label: "Гості",
              icon: Users,
              iconClass: "text-[#3b82f6]",
              exact: false,
            },
            {
              href: `/dashboard/events/${eventId}/questions`,
              label: "Опитування",
              icon: ClipboardList,
              iconClass: "text-[#10b981]",
              exact: false,
            },
            {
              href: `/dashboard/events/${eventId}/analytics`,
              label: "Аналітика",
              icon: BarChart3,
              iconClass: "text-[#06b6d4]",
              exact: false,
            },
            {
              href: `/dashboard/events/${eventId}/edit`,
              label: "Налаштування",
              icon: Settings,
              iconClass: "text-[#64748b]",
              exact: false,
            },
          ]
        : [],
    [eventId],
  );

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Акаунт";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-3 dark:border-border">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-foreground dark:text-foreground"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
            IE
          </span>
          <span className="truncate">InviteEvents</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <NavLink
            href="/dashboard"
            label="Огляд"
            icon={LayoutDashboard}
            iconClass="text-[#f06632]"
            active={pathname === "/dashboard"}
            onClick={onNavigate}
          />
          <NavLink
            href="/dashboard/events/new"
            label="Нове запрошення"
            icon={Plus}
            iconClass="text-[#22c55e]"
            active={pathname === "/dashboard/events/new"}
            onClick={onNavigate}
          />
        </div>

        {eventId ? (
          <div className="space-y-1">
            <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Подія
            </p>
            {eventLinks.map(({ href, label, icon, iconClass, exact }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                iconClass={iconClass}
                active={exact ? pathname === href : pathname.startsWith(href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </nav>

      <div className="space-y-2 border-t border-border p-3 dark:border-border">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground/80 dark:bg-muted dark:text-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground dark:text-foreground">{displayName}</p>
            {user?.email ? (
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#2a2a2a] transition-all duration-150 hover:bg-[#e4e4e2] hover:pl-4 dark:text-foreground dark:hover:bg-background"
        >
          <LogOut className="h-5 w-5 text-[#64748b] transition-transform duration-150 group-hover:scale-110" strokeWidth={2} />
          Вийти
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const eventId = useEventIdFromPath();
  const pathname = usePathname();

  const defaultTitle =
    title ??
    (pathname === "/dashboard"
      ? "Огляд"
      : pathname.includes("/design")
        ? "Дизайн"
        : pathname.includes("/guests")
          ? "Гості"
          : pathname.includes("/questions")
            ? "Опитування"
            : pathname.includes("/analytics")
              ? "Аналітика"
              : pathname.includes("/edit")
                ? "Налаштування"
                : eventId
                  ? "Подія"
                  : "Дашборд");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-muted md:block">
        <SidebarContent eventId={eventId} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрити меню"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-muted shadow-xl">
            <div className="absolute right-2 top-2">
              <Button size="sm" variant="ghost" onClick={() => setMobileOpen(false)} aria-label="Закрити">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent eventId={eventId} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur dark:border-border dark:bg-background/90">
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Меню"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="hidden text-muted-foreground hover:text-foreground/80 dark:hover:text-foreground sm:inline"
              >
                InviteEvents
              </Link>
              <span className="hidden text-muted-foreground/50 dark:text-muted-foreground sm:inline">/</span>
              <h1 className="truncate font-medium tracking-tight">{defaultTitle}</h1>
            </div>
            {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Link href="/dashboard/events/new" className="hidden sm:block">
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                Нове
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Event links live in the sidebar; kept for call-site compatibility. */
export function DashboardNav(_props: { eventId?: string }) {
  return null;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5 dark:border-border">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DashboardStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 dark:border-border dark:bg-background">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
