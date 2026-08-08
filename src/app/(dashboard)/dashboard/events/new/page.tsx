"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { Loader2 } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const createAndOpenEditor = async () => {
    setError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "WEDDING",
        title: "Нове запрошення",
        eventDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        invitationMessage: "З радістю запрошуємо вас на нашу подію",
        customTheme: { locale: "uk" },
      }),
    });
    const json = await res.json();
    if (json.data?.id) {
      router.replace(`/dashboard/events/${json.data.id}/design?creating=1`);
      return;
    }
    setError(json.error?.message ?? "Не вдалося створити подію");
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createAndOpenEditor();
  }, []);

  return (
    <DashboardShell title="Нове запрошення">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        {!error ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Створення запрошення...</p>
              <p className="text-sm text-muted-foreground">Відкриваємо редактор дизайну</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                started.current = false;
                createAndOpenEditor();
              }}
              className="text-base font-medium text-foreground underline"
            >
              Спробувати ще раз
            </button>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
