import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listUserEvents } from "@/services/event.service";
import { DashboardShell } from "@/components/dashboard/shell";
import { EventsView } from "@/components/dashboard/events-view";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const events = await listUserEvents(user!.id);

  return (
    <DashboardShell title="Огляд" description={`З поверненням, ${user!.displayName ?? user!.email}`}>
      <EventsView events={events} />
    </DashboardShell>
  );
}
