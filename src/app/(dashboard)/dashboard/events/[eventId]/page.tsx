import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getEventById } from "@/services/event.service";
import { computeEventStats } from "@/lib/analytics/event-stats";
import { DashboardShell, DashboardNav } from "@/components/dashboard/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <DashboardShell>
      <DashboardNav eventId={eventId} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">{format(new Date(event.eventDate), "PPPP", { locale: uk })}</p>
          <Badge className="mt-2">{EVENT_STATUS_LABELS[event.status] ?? event.status}</Badge>
        </div>
        {event.status === "PUBLISHED" && (
          <Link href={`/invite/${event.slug}`} target="_blank">
            <Button variant="outline">Переглянути сторінку</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Відповіді RSVP" value={stats.totalResponses} />
        <StatCard title="Прийдуть" value={stats.totalAttendingPeople} subtitle={`${stats.totalAdultsAttending} дорослих · ${stats.totalChildrenAttending} дітей`} />
        <StatCard title="Запрошено" value={stats.totalInvitedAttendees} />
        <StatCard title="Очікують відповіді" value={stats.pendingGroups} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Статистика відвідуваності</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Прийдуть" value={stats.attendingGroups} />
            <MiniStat label="Відмовились" value={stats.notAttendingGroups} />
            <MiniStat label="Можливо" value={stats.maybeGroups} />
            <MiniStat label="Відсоток" value={`${stats.attendanceRate}%`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Швидкі посилання</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/dashboard/events/${eventId}/design`}><Button className="w-full">Редактор запрошення</Button></Link>
            <Link href={`/dashboard/events/${eventId}/guests`}><Button variant="secondary" className="w-full">Керування гостями</Button></Link>
            <Link href={`/dashboard/events/${eventId}/questions`}><Button variant="secondary" className="w-full">Конструктор опитування</Button></Link>
            <Link href={`/dashboard/events/${eventId}/analytics`}><Button variant="secondary" className="w-full">Аналітика</Button></Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
