import { computeEventStats } from "@/lib/analytics/event-stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { Event, GuestGroup, Guest, GuestResponse, Template } from "@prisma/client";
import { Users } from "lucide-react";
import { EventCardActions } from "./event-card-actions";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/i18n/uk";

type EventWithRelations = Event & {
  template: Pick<Template, "id" | "name" | "slug" | "layout"> | null;
  guestGroups: (GuestGroup & { guests: Guest[]; response: GuestResponse | null })[];
};

export function EventCard({ event }: { event: EventWithRelations }) {
  const stats = computeEventStats(event.guestGroups);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] bg-muted">
        {event.coverImageUrl ? (
          <Image src={event.coverImageUrl} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary text-muted-foreground">
            Немає обкладинки
          </div>
        )}
        <Badge className="absolute left-3 top-3" variant={event.status === "PUBLISHED" ? "success" : "outline"}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType} · {format(new Date(event.eventDate), "PPP", { locale: uk })}
        </p>
        {event.status !== "PUBLISHED" && (
          <p className="text-xs text-amber-700">
            Чернетка — опублікуйте, щоб гості могли відкрити публічне посилання.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Stat label="Запрошено" value={stats.totalInvitedAttendees} />
          <Stat label="Прийдуть" value={stats.totalAttendingPeople} color="text-emerald-600" />
          <Stat label="Відмовились" value={stats.notAttendingGroups} color="text-red-500" />
          <Stat label="Очікують" value={stats.pendingGroups} color="text-amber-600" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stats.totalAdultsAttending} дорослих</span>
          <span>{stats.totalChildrenAttending} дітей</span>
          <span>{stats.maybeGroups} можливо</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/events/${event.id}`}>
            <Button size="sm" variant="secondary">Керувати</Button>
          </Link>
          <EventCardActions
            eventId={event.id}
            slug={event.slug}
            published={event.status === "PUBLISHED"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className={`text-lg font-bold ${color ?? ""}`}>{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
