"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, CopyPlus, ExternalLink, Upload } from "lucide-react";

export function EventCardActions({
  eventId,
  slug,
  published = false,
}: {
  eventId: string;
  slug: string;
  published?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const invitePath = published ? `/invite/${slug}` : `/invite/${slug}?preview=1`;

  const getInviteUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${invitePath}`;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(getInviteUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
      if (res.ok) router.refresh();
      else {
        const json = await res.json().catch(() => null);
        alert(json?.error?.message ?? "Не вдалося опублікувати");
      }
    } finally {
      setPublishing(false);
    }
  };

  const duplicate = async () => {
    if (!confirm("Створити копію цієї події? Оригінал не зміниться.")) return;
    const res = await fetch(`/api/events/${eventId}/duplicate`, { method: "POST" });
    const json = await res.json();
    if (json.data?.id) router.push(`/dashboard/events/${json.data.id}/design`);
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
      {!published && (
        <Button size="sm" onClick={publish} disabled={publishing}>
          <Upload className="h-3 w-3" /> {publishing ? "…" : "Опублікувати"}
        </Button>
      )}
      <Link href={invitePath} target="_blank">
        <Button size="sm" variant="outline">
          <ExternalLink className="h-3 w-3" />
          {published ? "Переглянути" : "Прев’ю"}
        </Button>
      </Link>
      <Button size="sm" variant="outline" onClick={copyLink} title={getInviteUrl()}>
        <Copy className="h-3 w-3" />
        {copied ? "Скопійовано!" : "Посилання"}
      </Button>
      <Button size="sm" variant="ghost" onClick={duplicate} title="Створити копію події">
        <CopyPlus className="h-3 w-3" /> Дублювати
      </Button>
      <Button size="sm" variant="ghost" onClick={remove} disabled={deleting} title="Видалити">
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </>
  );
}
