"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur dark:border-border dark:bg-background/90">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={isCreating ? "/dashboard" : `/dashboard/events/${eventId}`}>
            <Button size="sm" variant="ghost" className="text-foreground/70 dark:text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground/80 dark:hover:text-foreground">
              InviteEvents
            </Link>
            <span className="text-muted-foreground/50 dark:text-muted-foreground">/</span>
            <span className="font-medium tracking-tight">
              {isCreating ? "Створення запрошення" : "Дизайн"}
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <div className="px-4 pb-4 pt-4">
        <DesignEditor
          eventId={eventId}
          setupMode={isCreating}
          onFinishSetup={() => router.push(`/dashboard/events/${eventId}`)}
        />
      </div>
    </div>
  );
}
