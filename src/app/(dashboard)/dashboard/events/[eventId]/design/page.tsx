"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/shell";
import { DesignEditor } from "@/components/dashboard/design-editor/design-editor";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DesignPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isCreating = searchParams.get("creating") === "1";

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {isCreating ? (
              <Link href="/dashboard">
                <Button size="sm" variant="ghost">
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="font-bold">
                Invite<span className="text-primary">Events</span>
              </Link>
            )}
            {isCreating && (
              <span className="hidden text-sm text-muted-foreground sm:inline">Створення запрошення</span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="px-4 pb-4 pt-4">
        {!isCreating && <DashboardNav eventId={eventId} />}
        <DesignEditor
          eventId={eventId}
          setupMode={isCreating}
          onFinishSetup={() => router.push(`/dashboard/events/${eventId}`)}
        />
      </div>
    </div>
  );
}
