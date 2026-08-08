"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { LayoutGrid, List } from "lucide-react";
import type { Event, GuestGroup, Guest, GuestResponse, Template } from "@prisma/client";
import { EventCard } from "@/components/dashboard/event-card";
import { EventCardActions } from "@/components/dashboard/event-card-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/i18n/uk";

export type DashboardEvent = Event & {
  template: Pick<Template, "id" | "name" | "slug" | "layout"> | null;
  guestGroups: (GuestGroup & { guests: Guest[]; response: GuestResponse | null })[];
};

type ViewMode = "grid" | "list";

const STORAGE_KEY = "dashboard-events-view";

export function EventsView({ events }: { events: DashboardEvent[] }) {
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground dark:text-foreground">
            {view === "grid" ? "Сітка" : "Список"}
          </h3>
          <span className="text-xs text-muted-foreground">{events.length}</span>
        </div>

        <div className="flex h-8 items-center gap-0.5 rounded-md border-2 border-btn-ledge bg-muted p-0.5 shadow-[0_3px_0_0_var(--btn-ledge)]">
          <ViewToggle
            label="Список"
            active={view === "list"}
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5" />
          </ViewToggle>
          <ViewToggle
            label="Сітка"
            active={view === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </ViewToggle>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center dark:border-border">
          <p className="text-sm text-muted-foreground">Ще немає подій. Створіть перше запрошення.</p>
          <Link href="/dashboard/events/new" className="mt-4 inline-block">
            <Button size="sm">
              Створити запрошення
            </Button>
          </Link>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden border-b border-border bg-card px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.6fr)_7rem_7.5rem_8rem_2.5rem] sm:items-center sm:gap-3">
            <span>Назва</span>
            <span>Тип</span>
            <span>Дата</span>
            <span>Статус</span>
            <span className="sr-only">Дії</span>
          </div>
          <ul className="divide-y divide-border/60 dark:divide-border">
            {events.map((event) => (
              <EventListRow key={event.id} event={event} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-full items-center justify-center rounded-sm px-3 transition-all duration-150",
        active
          ? "bg-btn-face text-btn-ink shadow-sm"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EventListRow({ event }: { event: DashboardEvent }) {
  const router = useRouter();
  const href = `/dashboard/events/${event.id}`;

  return (
    <li>
      <div
        role="link"
        tabIndex={0}
        aria-label={`Відкрити ${event.title || "подію"}`}
        onClick={() => router.push(href)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(href);
          }
        }}
        className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-l-2 border-transparent px-4 py-3.5 transition-all duration-150 hover:border-l-primary hover:bg-[#ececeb] sm:grid-cols-[minmax(0,1.6fr)_7rem_7.5rem_8rem_2.5rem]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted dark:bg-card">
            {event.coverImageUrl ? (
              <Image src={event.coverImageUrl} alt="" fill className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-tight group-hover:underline">
              {event.title || "Без назви"}
            </p>
            <p className="truncate text-xs text-muted-foreground sm:hidden">
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType} ·{" "}
              {format(new Date(event.eventDate), "d MMM yyyy", { locale: uk })}
            </p>
          </div>
        </div>

        <p className="hidden truncate text-sm text-muted-foreground sm:block">
          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
        </p>
        <p className="hidden truncate text-sm text-muted-foreground sm:block">
          {format(new Date(event.eventDate), "d MMM yyyy", { locale: uk })}
        </p>

        <div className="hidden items-center gap-1.5 sm:flex">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              event.status === "PUBLISHED" ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          <span className="truncate text-sm text-foreground/70 dark:text-muted-foreground">
            {EVENT_STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>

        <div
          className="flex justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <EventCardActions
            eventId={event.id}
            slug={event.slug}
            published={event.status === "PUBLISHED"}
          />
        </div>
      </div>
    </li>
  );
}
