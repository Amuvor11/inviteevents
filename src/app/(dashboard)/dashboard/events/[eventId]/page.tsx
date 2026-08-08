import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getEventById } from "@/services/event.service";
import { computeEventStats } from "@/lib/analytics/event-stats";
import { DashboardShell, DashboardPageHeader, DashboardStat } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { EVENT_STATUS_LABELS } from "@/lib/i18n/uk";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  const event = await getEventById(eventId, user!.id);
  const stats = computeEventStats(event.guestGroups);

  return (
    <DashboardShell title={event.title}>
      <DashboardPageHeader
        title={event.title}
        description={format(new Date(event.eventDate), "PPPP", { locale: uk })}
        actions={
          <>
            <Badge variant="outline" className="border-border dark:border-border">
              {EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
            {event.status === "PUBLISHED" ? (
              <Link href={`/invite/${event.slug}`} target="_blank">
                <Button size="sm" variant="outline">
                  Переглянути
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStat label="Відповіді RSVP" value={stats.totalResponses} />
        <DashboardStat label="Прийдуть" value={stats.totalAttendingPeople} />
        <DashboardStat label="Запрошено" value={stats.totalInvitedAttendees} />
        <DashboardStat label="Очікують відповіді" value={stats.pendingGroups} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-5 dark:border-border lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium">Статистика відвідуваності</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Прийдуть" value={stats.attendingGroups} />
            <MiniStat label="Відмовились" value={stats.notAttendingGroups} />
            <MiniStat label="Можливо" value={stats.maybeGroups} />
            <MiniStat label="Відсоток" value={`${stats.attendanceRate}%`} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {stats.totalAdultsAttending} дорослих · {stats.totalChildrenAttending} дітей серед тих, хто
            прийде
          </p>
        </div>

        <div className="rounded-lg border border-border p-5 dark:border-border">
          <h3 className="mb-4 text-sm font-medium">Швидкі посилання</h3>
          <div className="space-y-2">
            <Link href={`/dashboard/events/${eventId}/design`}>
              <Button size="sm" className="w-full">
                Редактор запрошення
              </Button>
            </Link>
            <Link href={`/dashboard/events/${eventId}/guests`}>
              <Button size="sm" variant="outline" className="w-full">
                Керування гостями
              </Button>
            </Link>
            <Link href={`/dashboard/events/${eventId}/questions`}>
              <Button size="sm" variant="outline" className="w-full">
                Конструктор опитування
              </Button>
            </Link>
            <Link href={`/dashboard/events/${eventId}/analytics`}>
              <Button size="sm" variant="outline" className="w-full">
                Аналітика
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border/60 px-3 py-2.5 text-center dark:border-border">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
