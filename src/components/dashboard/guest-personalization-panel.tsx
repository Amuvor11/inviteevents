"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ALL_SECTIONS } from "@/lib/invite/personalization";
import { SECTION_LABELS } from "@/lib/i18n/uk";
import type { GuestGroupPersonalization } from "@/types/personalization";

interface GuestPersonalizationPanelProps {
  groupId: string;
  eventId: string;
  initial: GuestGroupPersonalization | null;
  onSaved: () => void;
  onClose: () => void;
}

export function GuestPersonalizationPanel({
  groupId,
  eventId,
  initial,
  onSaved,
  onClose,
}: GuestPersonalizationPanelProps) {
  const [form, setForm] = useState<GuestGroupPersonalization>(initial ?? {});
  const [loading, setLoading] = useState(false);

  const toggleHidden = (section: string) => {
    const hidden = form.hiddenSections ?? [];
    setForm({
      ...form,
      hiddenSections: hidden.includes(section as never)
        ? hidden.filter((s) => s !== section)
        : [...hidden, section as never],
    });
  };

  const save = async () => {
    setLoading(true);
    try {
      await fetch(`/api/events/${eventId}/guest-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalization: form }),
      });
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <h4 className="font-semibold">Персоналізація для цього гостя</h4>

      <div>
        <Label>Особливе привітання</Label>
        <Input
          placeholder='наприклад, "Шановні Anna & Ivan"'
          value={form.customGreeting ?? ""}
          onChange={(e) => setForm({ ...form, customGreeting: e.target.value })}
        />
      </div>

      <div>
        <Label>Особисте повідомлення</Label>
        <Textarea
          rows={3}
          placeholder="Унікальне повідомлення, яке побачить лише цей гість..."
          value={form.personalMessage ?? ""}
          onChange={(e) => setForm({ ...form, personalMessage: e.target.value })}
        />
      </div>

      <div>
        <Label>Акцентна примітка</Label>
        <Input
          placeholder='Невелика особиста примітка, напр. "Ми зберегли вам місце за столом 5"'
          value={form.accentNote ?? ""}
          onChange={(e) => setForm({ ...form, accentNote: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Монограма (перевизначення)</Label>
          <Input
            maxLength={3}
            value={form.monogram ?? ""}
            onChange={(e) => setForm({ ...form, monogram: e.target.value })}
          />
        </div>
        <div>
          <Label>Мова</Label>
          <Select
            value={form.locale ?? ""}
            onChange={(e) => setForm({ ...form, locale: (e.target.value || undefined) as "en" | "uk" | undefined })}
          >
            <option value="">За замовчуванням</option>
            <option value="uk">Українська</option>
            <option value="en">English (лише для запрошень гостей)</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>URL особистої обкладинки</Label>
        <Input
          value={form.coverImageUrl ?? ""}
          onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
          placeholder="Cloudinary URL лише для цього гостя"
        />
      </div>

      <div>
        <Label>URL особистого фонового зображення</Label>
        <Input
          value={form.backgroundImageUrl ?? ""}
          onChange={(e) => setForm({ ...form, backgroundImageUrl: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Основний колір (перевизначення)</Label>
          <Input
            type="color"
            value={form.customTheme?.primaryColor ?? "#7c3aed"}
            onChange={(e) =>
              setForm({ ...form, customTheme: { ...form.customTheme, primaryColor: e.target.value } })
            }
            className="h-10"
          />
        </div>
        <div>
          <Label>Акцентний колір (перевизначення)</Label>
          <Input
            type="color"
            value={form.customTheme?.accentColor ?? "#a78bfa"}
            onChange={(e) =>
              setForm({ ...form, customTheme: { ...form.customTheme, accentColor: e.target.value } })
            }
            className="h-10"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Приховати розділи для цього гостя</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_SECTIONS.map((section) => (
            <label key={section} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(form.hiddenSections ?? []).includes(section)}
                onChange={() => toggleHidden(section)}
              />
              {SECTION_LABELS[section] ?? section}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Показувати RSVP</Label>
        <Select
          value={form.showRsvp === false ? "false" : "true"}
          onChange={(e) => setForm({ ...form, showRsvp: e.target.value === "true" })}
        >
          <option value="true">Так</option>
          <option value="false">Ні (лише перегляд запрошення)</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={loading}>Зберегти персоналізацію</Button>
        <Button size="sm" variant="outline" onClick={onClose}>Скасувати</Button>
      </div>
    </div>
  );
}
