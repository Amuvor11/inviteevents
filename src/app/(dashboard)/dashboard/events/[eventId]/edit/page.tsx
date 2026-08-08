"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_SECTIONS } from "@/lib/invite/personalization";
import { SECTION_LABELS, EVENT_STATUS_LABELS, TEMPLATE_LABELS } from "@/lib/i18n/uk";
import type { InviteSection } from "@/types/personalization";

type EditForm = Record<string, unknown> & {
  themePrimaryColor?: string;
  themeBackgroundColor?: string;
  themeAccentColor?: string;
  themeTextColor?: string;
  themeMonogram?: string;
  themeLocale?: string;
  themeCountdownStyle?: string;
  themeShowCalendar?: string;
  themeGlassOpacity?: string;
  themeBackgroundOverlay?: string;
};

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [hiddenSections, setHiddenSections] = useState<InviteSection[]>([]);
  const { register, handleSubmit, reset } = useForm<EditForm>();

  useEffect(() => {
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then((j) => {
      if (j.data) {
        setEvent(j.data);
        const theme = (j.data.customTheme ?? {}) as Record<string, unknown>;
        setHiddenSections((theme.hiddenSections as InviteSection[]) ?? []);
        reset({
          ...j.data,
          eventDate: j.data.eventDate ? new Date(j.data.eventDate).toISOString().slice(0, 16) : "",
          backgroundImageUrl: j.data.design?.backgroundImageUrl ?? "",
          themePrimaryColor: theme.primaryColor ?? "",
          themeBackgroundColor: theme.backgroundColor ?? "",
          themeAccentColor: theme.accentColor ?? "",
          themeTextColor: theme.textColor ?? "",
          themeMonogram: theme.monogram ?? "",
          themeLocale: theme.locale ?? "",
          themeCountdownStyle: theme.countdownStyle ?? "",
          themeShowCalendar: theme.showCalendar === true ? "true" : theme.showCalendar === false ? "false" : "",
          themeGlassOpacity: theme.glassOpacity?.toString() ?? "",
          themeBackgroundOverlay: theme.backgroundOverlay?.toString() ?? "",
        });
      }
    });
  }, [eventId, reset]);

  const onSubmit = async (data: EditForm) => {
    setLoading(true);
    try {
      const customTheme: Record<string, unknown> = {};
      if (data.themePrimaryColor) customTheme.primaryColor = data.themePrimaryColor;
      if (data.themeBackgroundColor) customTheme.backgroundColor = data.themeBackgroundColor;
      if (data.themeAccentColor) customTheme.accentColor = data.themeAccentColor;
      if (data.themeTextColor) customTheme.textColor = data.themeTextColor;
      if (data.themeMonogram) customTheme.monogram = data.themeMonogram;
      if (data.themeLocale) customTheme.locale = data.themeLocale;
      if (data.themeCountdownStyle) customTheme.countdownStyle = data.themeCountdownStyle;
      if (data.themeShowCalendar === "true") customTheme.showCalendar = true;
      if (data.themeShowCalendar === "false") customTheme.showCalendar = false;
      if (data.themeGlassOpacity) customTheme.glassOpacity = parseFloat(data.themeGlassOpacity);
      if (data.themeBackgroundOverlay) customTheme.backgroundOverlay = parseFloat(data.themeBackgroundOverlay);
      if (hiddenSections.length) customTheme.hiddenSections = hiddenSections;

      const {
        themePrimaryColor,
        themeBackgroundColor,
        themeAccentColor,
        themeTextColor,
        themeMonogram,
        themeLocale,
        themeCountdownStyle,
        themeShowCalendar,
        themeGlassOpacity,
        themeBackgroundOverlay,
        ...rest
      } = data;

      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          customTheme: Object.keys(customTheme).length > 0 ? customTheme : undefined,
          eventDate: data.eventDate ? new Date(data.eventDate as string).toISOString() : undefined,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
    router.refresh();
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then((j) => setEvent(j.data));
  };

  const toggleRsvp = async () => {
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpClosed: !(event as { rsvpClosed?: boolean })?.rsvpClosed }),
    });
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then((j) => setEvent(j.data));
  };

  if (!event) return <DashboardShell title="Налаштування"><p className="text-sm text-muted-foreground">Завантаження...</p></DashboardShell>;

  const rawTemplateName = (event as { template?: { name?: string } }).template?.name ?? "Classic";
  const templateName = TEMPLATE_LABELS[rawTemplateName] ?? rawTemplateName;

  return (
    <DashboardShell title="Налаштування">
      <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-5 dark:border-border">
        <Button
          size="sm"
          onClick={publish}
          disabled={(event as { status?: string }).status === "PUBLISHED"}
        >
          Опублікувати
        </Button>
        <Button variant="outline" size="sm" onClick={toggleRsvp}>
          {(event as { rsvpClosed?: boolean }).rsvpClosed ? "Відкрити RSVP" : "Закрити RSVP"}
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Редагування події</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Назва</Label><Input {...register("title")} /></div>
            <div><Label>Імена організаторів</Label><Input {...register("hostNames")} placeholder="Анна & Іван" /></div>
            <div><Label>Дата і час</Label><Input type="datetime-local" {...register("eventDate")} /></div>
            <div><Label>Місце проведення</Label><Input {...register("venueName")} /></div>
            <div><Label>Адреса</Label><Input {...register("venueAddress")} /></div>
            <div><Label>Google Maps</Label><Input {...register("googleMapsLink")} /></div>
            <div><Label>Текст запрошення</Label><Textarea {...register("invitationMessage")} rows={4} /></div>
            <div><Label>Дрес-код</Label><Input {...register("dressCode")} /></div>
            <div><Label>Додаткова інформація</Label><Textarea {...register("additionalInfo")} /></div>
            <div><Label>URL фонової музики</Label><Input {...register("backgroundMusicUrl")} /></div>
            <div><Label>URL обкладинки</Label><Input {...register("coverImageUrl")} placeholder="Cloudinary URL" /></div>
            <div>
              <Label>Статус</Label>
              <Select {...register("status")}>
                {["DRAFT", "PUBLISHED", "ARCHIVED", "CANCELLED"].map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_LABELS[s] ?? s}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дизайн запрошення</CardTitle>
            <p className="text-sm text-muted-foreground">
              Шаблон: <strong>{templateName}</strong> — змінити шаблон можна під час створення нової події
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>URL фонового зображення</Label><Input {...register("backgroundImageUrl")} placeholder="Фонове зображення на всю сторінку (Cloudinary)" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Основний колір</Label><Input type="color" {...register("themePrimaryColor")} className="h-10" /></div>
              <div><Label>Акцентний колір</Label><Input type="color" {...register("themeAccentColor")} className="h-10" /></div>
              <div><Label>Колір фону</Label><Input type="color" {...register("themeBackgroundColor")} className="h-10" /></div>
              <div><Label>Колір тексту</Label><Input type="color" {...register("themeTextColor")} className="h-10" /></div>
            </div>
            <div><Label>Монограма (1–3 літери)</Label><Input {...register("themeMonogram")} maxLength={3} placeholder="AI" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Мова</Label>
                <Select {...register("themeLocale")}>
                  <option value="">За замовчуванням для шаблону</option>
                  <option value="uk">Українська</option>
                  <option value="en">English (лише для запрошень гостей)</option>
                </Select>
              </div>
              <div>
                <Label>Стиль зворотного відліку</Label>
                <Select {...register("themeCountdownStyle")}>
                  <option value="">За замовчуванням для шаблону</option>
                  <option value="elegant">Елегантний (34 : 12 : 0 : 3)</option>
                  <option value="cards">Картки</option>
                  <option value="inline">В рядок</option>
                </Select>
              </div>
              <div>
                <Label>Показувати календар</Label>
                <Select {...register("themeShowCalendar")}>
                  <option value="">За замовчуванням для шаблону</option>
                  <option value="true">Так</option>
                  <option value="false">Ні</option>
                </Select>
              </div>
              <div>
                <Label>Прозорість скла (0–1)</Label>
                <Input type="number" step="0.05" min="0" max="1" {...register("themeGlassOpacity")} placeholder="0.88" />
              </div>
              <div>
                <Label>Накладення фону (0–1)</Label>
                <Input type="number" step="0.05" min="0" max="1" {...register("themeBackgroundOverlay")} placeholder="0.35" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Приховати розділи (для всіх гостей за замовчуванням)</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_SECTIONS.map((section) => (
                  <label key={section} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hiddenSections.includes(section)}
                      onChange={() =>
                        setHiddenSections((prev) =>
                          prev.includes(section)
                            ? prev.filter((s) => s !== section)
                            : [...prev, section],
                        )
                      }
                    />
                    {SECTION_LABELS[section] ?? section}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={loading}>Зберегти зміни</Button>
      </form>
    </DashboardShell>
  );
}
