import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { Event, GuestGroup, Guest, GuestResponse, Template } from "@prisma/client";
import { ArrowUpRight } from "lucide-react";
import { EventCardActions } from "./event-card-actions";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/i18n/uk";

type EventWithRelations = Event & {
  template: Pick<Template, "id" | "name" | "slug" | "layout"> | null;
  guestGroups: (GuestGroup & { guests: Guest[]; response: GuestResponse | null })[];
};

export function EventCard({ event }: { event: EventWithRelations }) {
  const href = `/dashboard/events/${event.id}`;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-btn-ledge hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Відкрити ${event.title}`}>
        <span className="sr-only">Відкрити подію</span>
      </Link>

      <div className="absolute inset-0 bg-muted dark:bg-card">
        {event.coverImageUrl ? (
          <Image src={event.coverImageUrl} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Немає обкладинки
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
      </div>

      <Badge
        className="absolute left-3 top-3 z-[1] border-white/20 bg-background/90 text-foreground/80 backdrop-blur dark:border-border dark:bg-card/90 dark:text-foreground"
        variant={event.status === "PUBLISHED" ? "success" : "outline"}
      >
        {EVENT_STATUS_LABELS[event.status] ?? event.status}
      </Badge>

      <div className="absolute inset-x-0 bottom-0 z-[1] p-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-[#f8e8d4] group-hover:underline">
              {event.title || "Без назви"}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-[#f8e8d4]/75">
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType} ·{" "}
              {format(new Date(event.eventDate), "d MMM yyyy", { locale: uk })}
            </p>
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            <Link
              href={href}
              className="inline-flex h-8 items-center gap-1 rounded-md border-2 border-btn-ledge bg-btn-face px-4 py-1.5 text-xs font-semibold text-btn-ink shadow-[0_3px_0_0_var(--btn-ledge)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[#f7f7f5] hover:shadow-[0_5px_0_0_var(--btn-ledge)] active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--btn-ledge)]"
            >
              Відкрити
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <EventCardActions
              eventId={event.id}
              slug={event.slug}
              published={event.status === "PUBLISHED"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
