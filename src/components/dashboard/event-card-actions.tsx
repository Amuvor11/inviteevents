"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, CopyPlus } from "lucide-react";

export function EventCardActions({
  eventId,
  slug,
  appUrl,
  published = false,
}: {
  eventId: string;
  slug: string;
  appUrl: string;
  published?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const link = `${appUrl}/invite/${slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const duplicate = async () => {
    const res = await fetch(`/api/events/${eventId}/duplicate`, { method: "POST" });
    const json = await res.json();
    if (json.data?.id) router.push(`/dashboard/events/${json.data.id}/design?creating=1`);
  };

  const remove = async () => {
    if (!confirm("Видалити цю подію?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {published && (
        <Button size="sm" variant="outline" onClick={copyLink}>
          <Copy className="h-3 w-3" /> {copied ? "Скопійовано!" : "Копіювати"}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={duplicate} title="Дублювати">
        <CopyPlus className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={remove} disabled={deleting} title="Видалити">
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </>
  );
}
