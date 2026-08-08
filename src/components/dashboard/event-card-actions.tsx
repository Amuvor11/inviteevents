"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, CopyPlus, ExternalLink, MoreHorizontal, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const invitePath = published ? `/invite/${slug}` : `/invite/${slug}?preview=1`;

  const getInviteUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${invitePath}`;
  };

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 192;
    const gap = 6;
    const menuHeight = menuRef.current?.offsetHeight ?? (published ? 180 : 220);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + gap && rect.top > spaceBelow;
    const top = openUp ? rect.top - gap - menuHeight : rect.bottom + gap;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    setCoords({ top: Math.max(8, top), left });
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    // Re-measure after menu paints with real height
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, published]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReposition = () => updatePosition();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(getInviteUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.error?.message ?? "Не вдалося опублікувати");
      }
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!confirm("Створити копію цієї події? Оригінал не зміниться.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (json.data?.id) router.push(`/dashboard/events/${json.data.id}/design`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Видалити цю подію?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const menu =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[100] w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
          >
            {!published ? (
              <MenuItem
                icon={Upload}
                label={busy ? "Публікація…" : "Опублікувати"}
                onClick={publish}
                disabled={busy}
              />
            ) : null}
            <Link
              href={invitePath}
              target="_blank"
              role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground/80 transition-colors hover:bg-[#ececeb] dark:text-foreground dark:hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              {published ? "Переглянути" : "Прев’ю"}
            </Link>
            <MenuItem
              icon={Copy}
              label={copied ? "Скопійовано!" : "Копіювати посилання"}
              onClick={copyLink}
            />
            <MenuItem icon={CopyPlus} label="Дублювати" onClick={duplicate} disabled={busy} />
            <div className="my-1 border-t border-border/60 dark:border-border" />
            <MenuItem icon={Trash2} label="Видалити" onClick={remove} disabled={busy} danger />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Дії з подією"
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-8 items-center justify-center rounded-md border-2 border-btn-ledge bg-btn-face px-3 text-btn-ink shadow-[0_3px_0_0_var(--btn-ledge)] transition-[transform,box-shadow,background-color] duration-150",
          "hover:-translate-y-0.5 hover:bg-[#f7f7f5] hover:shadow-[0_5px_0_0_var(--btn-ledge)] active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--btn-ledge)]",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-foreground/80 hover:bg-[#ececeb] dark:text-foreground dark:hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5 opacity-60" />
      {label}
    </button>
  );
}
