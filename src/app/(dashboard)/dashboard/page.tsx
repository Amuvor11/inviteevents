import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listUserEvents, getDashboardStats } from "@/services/event.service";
import { DashboardShell } from "@/components/dashboard/shell";
import { EventCard } from "@/components/dashboard/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [events, stats] = await Promise.all([
    listUserEvents(user!.id),
    getDashboardStats(user!.id),
  ]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Панель керування</h1>
        <p className="text-muted-foreground">З поверненням, {user!.displayName ?? user!.email}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Усього подій", value: stats.totalEvents },
          { label: "Усього гостей", value: stats.totalGuests },
          { label: "Відповіді RSVP", value: stats.totalResponses },
          { label: "Відвідуваність", value: `${stats.attendanceRate}%` },
          { label: "Найближчі", value: stats.upcomingEvents },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ваші події</h2>
        <Link href="/dashboard/events/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Нове запрошення</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-muted-foreground">Ще немає подій. Створіть перше запрошення!</p>
            <Link href="/dashboard/events/new" className="mt-4 inline-block">
              <Button>Створити запрошення</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
