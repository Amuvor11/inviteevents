"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { QUESTION_TYPE_LABELS } from "@/lib/i18n/uk";
import {
  FORM_FIELD_META,
  GUEST_FIELD_META,
  RSVP_RESPONSE_VALUE_LABELS,
  enabledResponseOptions,
  moveItem,
  newResponseOptionId,
  resolveFormFieldOrder,
  resolveGuestFieldOrder,
  resolveRsvpCopy,
  resolveRsvpFieldFlags,
  resolveRsvpResponseOptions,
  type RsvpCopy,
  type RsvpFieldFlags,
  type RsvpFormFieldId,
  type RsvpResponseOption,
  type RsvpResponseValue,
} from "@/lib/invite/rsvp-copy";
import { RSVP_SURFACES, parseRsvpSurface } from "@/lib/invite/rsvp-chrome";
import { cn } from "@/lib/utils/cn";
import type { DesignBlock } from "@/types/design";
import type { PublicInviteEvent } from "@/types/invite";

type Question = PublicInviteEvent["questions"][number];

interface RsvpBlockFieldsProps {
  block: DesignBlock;
  event: PublicInviteEvent;
  eventId: string;
  updateBlock: (id: string, patch: Partial<DesignBlock>) => void;
  onQuestionsChange: (questions: Question[]) => void;
}

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];

function Section({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/40"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {hint && !open && (
            <p className="truncate text-[10px] text-muted-foreground">{hint}</p>
          )}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

export function RsvpBlockFields({
  block,
  event,
  eventId,
  updateBlock,
  onQuestionsChange,
}: RsvpBlockFieldsProps) {
  const locale = event.customTheme?.locale === "en" ? "en" : "uk";
  const labels = resolveRsvpCopy(block.data, locale);
  const flags = resolveRsvpFieldFlags(block.data);
  const responseOptions = resolveRsvpResponseOptions(block.data, locale);
  const surface = parseRsvpSurface(block.data.surface);

  const patchLabels = (patch: Partial<RsvpCopy>) => {
    updateBlock(block.id, { data: { labels: { ...labels, ...patch } } });
  };

  const patchFields = (patch: Partial<RsvpFieldFlags>) => {
    updateBlock(block.id, { data: { fields: { ...flags, ...patch } } });
  };

  const setResponseOptions = (next: RsvpResponseOption[]) => {
    const enabledCount = next.filter((o) => o.enabled).length;
    const safe =
      enabledCount === 0
        ? next.map((o, i) => (i === 0 ? { ...o, enabled: true } : o))
        : next;
    updateBlock(block.id, {
      data: {
        responseOptions: safe,
        labels: {
          ...labels,
          attendingLabel:
            safe.find((o) => o.enabled && o.value === "ATTENDING")?.label ?? labels.attendingLabel,
          notAttendingLabel:
            safe.find((o) => o.enabled && o.value === "NOT_ATTENDING")?.label ??
            labels.notAttendingLabel,
          maybeLabel: safe.find((o) => o.enabled && o.value === "MAYBE")?.label ?? labels.maybeLabel,
        },
      },
    });
  };

  const addResponseOption = () => {
    setResponseOptions([
      ...responseOptions,
      {
        id: newResponseOptionId(),
        label: "",
        value: "ATTENDING",
        enabled: true,
      },
    ]);
  };

  const removeResponseOption = (id: string) => {
    const next = responseOptions.filter((o) => o.id !== id);
    if (next.length === 0) return;
    if (!next.some((o) => o.enabled)) {
      next[0] = { ...next[0]!, enabled: true };
    }
    setResponseOptions(next);
  };

  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState("SINGLE_CHOICE");
  const [draftRequired, setDraftRequired] = useState(false);
  const [draftOptions, setDraftOptions] = useState(["", ""]);
  const [draftDesc, setDraftDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const refreshQuestions = async () => {
    const res = await fetch(`/api/events/${eventId}/questions`);
    const json = await res.json();
    onQuestionsChange(json.data ?? []);
  };

  const addQuestion = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/events/${eventId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle.trim(),
          type: draftType,
          required: draftRequired,
          description: draftDesc.trim() || undefined,
          options: CHOICE_TYPES.includes(draftType)
            ? draftOptions.filter(Boolean).map((label) => ({ label }))
            : undefined,
        }),
      });
      setDraftTitle("");
      setDraftDesc("");
      setDraftOptions(["", ""]);
      setDraftRequired(false);
      setAddingQuestion(false);
      await refreshQuestions();
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/events/${eventId}/questions/${id}`, { method: "DELETE" });
      await refreshQuestions();
    } finally {
      setBusy(false);
    }
  };

  const saveQuestion = async (
    q: Question,
    patch: {
      title?: string;
      description?: string | null;
      placeholder?: string | null;
      defaultValue?: string | null;
      required?: boolean;
      options?: { id?: string; label: string }[];
    },
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: patch.title ?? q.title,
          description: patch.description === undefined ? q.description : patch.description,
          placeholder: patch.placeholder === undefined ? q.placeholder ?? null : patch.placeholder,
          defaultValue: patch.defaultValue === undefined ? q.defaultValue ?? null : patch.defaultValue,
          required: patch.required ?? q.required,
          ...(patch.options && CHOICE_TYPES.includes(q.type)
            ? { options: patch.options.filter((o) => o.label.trim()) }
            : {}),
        }),
      });
      if (!res.ok) return;
      await refreshQuestions();
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const enabledOpts = enabledResponseOptions(block.data, locale);
  const formOrder = resolveFormFieldOrder(block.data);
  const guestOrder = resolveGuestFieldOrder(block.data);
  const orderHint = formOrder
    .map((id) => FORM_FIELD_META[id].title)
    .slice(0, 3)
    .join(" → ");

  const moveFormField = (from: number, to: number) => {
    updateBlock(block.id, {
      data: {
        formFieldOrder: moveItem(formOrder, from, to),
        guestFieldOrder: moveItem(formOrder, from, to).filter((id) =>
          ["name", "guestType", "email", "addGuest"].includes(id),
        ),
      },
    });
  };

  const reorderQuestions = async (from: number, to: number) => {
    if (busy || to < 0 || to >= event.questions.length) return;
    const ordered = moveItem(event.questions, from, to);
    onQuestionsChange(ordered);
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/questions/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: ordered.map((q) => q.id) }),
      });
      const json = await res.json();
      if (json.data) onQuestionsChange(json.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <Section title="Основне" hint={labels.title} defaultOpen>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-[11px] text-muted-foreground">Заголовок форми</Label>
            <Input
              value={labels.title}
              onChange={(e) => patchLabels({ title: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-[11px] text-muted-foreground">Кнопка надсилання</Label>
            <Input
              value={labels.submitLabel}
              onChange={(e) => patchLabels({ submitLabel: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Варіанти відповіді"
        hint={enabledOpts.map((o) => o.label).join(" · ")}
        defaultOpen
      >
        <ToggleSwitch
          label="Показувати блок відповіді"
          checked={flags.showResponse}
          onChange={(v) => patchFields({ showResponse: v })}
        />
        {flags.showResponse && (
          <>
            <div>
              <Label className="mb-1.5 block text-[11px] text-muted-foreground">Підпис</Label>
              <Input
                value={labels.responseLabel}
                onChange={(e) => patchLabels({ responseLabel: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Варіанти в списку</p>
              {responseOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "space-y-1.5 rounded-md border px-2 py-2",
                    opt.enabled ? "border-border bg-muted/20" : "border-dashed border-border/70 opacity-60",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={opt.label}
                      disabled={!opt.enabled}
                      placeholder="Текст варіанту"
                      onChange={(e) =>
                        setResponseOptions(
                          responseOptions.map((o) =>
                            o.id === opt.id ? { ...o, label: e.target.value } : o,
                          ),
                        )
                      }
                      className="h-8 flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 px-0"
                      title="Видалити варіант"
                      disabled={responseOptions.length <= 1}
                      onClick={() => removeResponseOption(opt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  {opt.enabled && (
                    <Select
                      value={opt.value}
                      onChange={(e) =>
                        setResponseOptions(
                          responseOptions.map((o) =>
                            o.id === opt.id
                              ? { ...o, value: e.target.value as RsvpResponseValue }
                              : o,
                          ),
                        )
                      }
                      className="h-8 text-xs"
                    >
                      {(Object.keys(RSVP_RESPONSE_VALUE_LABELS) as RsvpResponseValue[]).map((v) => (
                        <option key={v} value={v}>
                          Статус: {RSVP_RESPONSE_VALUE_LABELS[v]}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full text-xs"
                onClick={addResponseOption}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Додати варіант
              </Button>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Можна додати кілька варіантів з різними підписами. Статус потрібен для статистики RSVP.
              </p>
            </div>
          </>
        )}
      </Section>

      <Section title="Порядок форми" hint={orderHint} defaultOpen>
        <p className="text-[10px] leading-snug text-muted-foreground">
          Стрілки змінюють порядок на запрошенні. Наприклад, поставте «Додаткові питання» одразу після «Тип гостя».
        </p>
        <div className="space-y-1.5">
          {formOrder.map((fieldId, index) => (
            <div
              key={fieldId}
              className="flex items-center gap-1 rounded-md border border-border/80 bg-muted/15 px-2 py-1.5"
            >
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-5 w-6 px-0"
                  disabled={index === 0}
                  title="Вище"
                  onClick={() => moveFormField(index, index - 1)}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-5 w-6 px-0"
                  disabled={index === formOrder.length - 1}
                  title="Нижче"
                  onClick={() => moveFormField(index, index + 1)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="min-w-0 flex-1 text-xs font-medium">
                {FORM_FIELD_META[fieldId].title}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">{index + 1}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Поля гостя" hint="Увімкнення та підписи" defaultOpen>
        <div className="space-y-3">
          {guestOrder.map((fieldId) => {
            const meta = GUEST_FIELD_META[fieldId];
            const flag = meta.flag;
            return (
              <div key={fieldId} className="space-y-2 rounded-md border border-border/80 p-2.5">
                <ToggleSwitch
                  label={meta.title}
                  checked={flags[flag]}
                  onChange={(v) => patchFields({ [flag]: v })}
                />
                {flags[flag] && fieldId === "name" && (
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Підказка в полі</Label>
                    <Input
                      value={labels.namePlaceholder}
                      onChange={(e) => patchLabels({ namePlaceholder: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {flags[flag] && fieldId === "guestType" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1 block text-[10px] text-muted-foreground">Дорослий</Label>
                      <Input
                        value={labels.adultLabel}
                        onChange={(e) => patchLabels({ adultLabel: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-[10px] text-muted-foreground">Дитина</Label>
                      <Input
                        value={labels.childLabel}
                        onChange={(e) => patchLabels({ childLabel: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
                {flags[flag] && fieldId === "email" && (
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Підказка в полі</Label>
                    <Input
                      value={labels.emailPlaceholder}
                      onChange={(e) => patchLabels({ emailPlaceholder: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {flags[flag] && fieldId === "addGuest" && (
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Текст кнопки</Label>
                    <Input
                      value={labels.addGuestLabel}
                      onChange={(e) => patchLabels({ addGuestLabel: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Коментар" hint={flags.showComment ? labels.commentLabel : "Вимкнено"}>
        <ToggleSwitch
          label="Показувати коментар"
          checked={flags.showComment}
          onChange={(v) => patchFields({ showComment: v })}
        />
        {flags.showComment && (
          <div>
            <Label className="mb-1.5 block text-[11px] text-muted-foreground">Підпис</Label>
            <Input
              value={labels.commentLabel}
              onChange={(e) => patchLabels({ commentLabel: e.target.value })}
              className="text-sm"
            />
          </div>
        )}
      </Section>

      <Section
        title="Додаткові питання"
        hint={
          event.questions.length
            ? `${event.questions.length} шт.`
            : "Немає — можна додати нижче"
        }
        defaultOpen={event.questions.length > 0 || addingQuestion}
      >
        <p className="text-[10px] text-muted-foreground">
          Стрілки змінюють порядок питань на формі
        </p>
        <div>
          <Label className="mb-1.5 block text-[11px] text-muted-foreground">Заголовок секції</Label>
          <Input
            value={labels.questionsTitle}
            onChange={(e) => patchLabels({ questionsTitle: e.target.value })}
            className="text-sm"
          />
        </div>

        {event.questions.length === 0 && !addingQuestion ? (
          <p className="rounded-md bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
            Поки немає питань
          </p>
        ) : (
          <ul className="space-y-3">
            {event.questions.map((q, index) => (
              <li key={q.id} className="rounded-lg border border-border bg-muted/15 p-3">
                {editingId === q.id ? (
                  <QuestionEditForm
                    question={q}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={(patch) => saveQuestion(q, patch)}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-1">
                      <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 px-0"
                          disabled={index === 0 || busy}
                          title="Вище"
                          onClick={() => reorderQuestions(index, index - 1)}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 px-0"
                          disabled={index === event.questions.length - 1 || busy}
                          title="Нижче"
                          onClick={() => reorderQuestions(index, index + 1)}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Питання {index + 1}
                            </p>
                            <p className="text-sm font-medium leading-snug">{q.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                              {q.required ? " · обовʼязкове" : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => setEditingId(q.id)}
                            >
                              Змінити
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 px-0"
                              onClick={() => deleteQuestion(q.id)}
                              disabled={busy}
                              title="Видалити питання"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {q.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {q.options.map((o) => (
                              <span
                                key={o.id}
                                className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px]"
                              >
                                {o.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {addingQuestion ? (
          <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary">Нове питання</p>
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Текст питання"
              className="text-sm"
            />
            <Textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              placeholder="Опис (необовʼязково)"
              className="min-h-[56px] text-sm"
            />
            <Select value={draftType} onChange={(e) => setDraftType(e.target.value)} className="text-sm">
              {Object.entries(QUESTION_TYPE_LABELS).map(([t, label]) => (
                <option key={t} value={t}>
                  {label}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={draftRequired}
                onChange={(e) => setDraftRequired(e.target.checked)}
              />
              Обовʼязкове
            </label>
            {CHOICE_TYPES.includes(draftType) && (
              <div className="space-y-2">
                <Label className="text-[11px]">Варіанти відповіді</Label>
                {draftOptions.map((opt, i) => (
                  <div key={i} className="flex gap-1.5">
                    <Input
                      value={opt}
                      placeholder={`Варіант ${i + 1}`}
                      className="text-sm"
                      onChange={(e) => {
                        const next = [...draftOptions];
                        next[i] = e.target.value;
                        setDraftOptions(next);
                      }}
                    />
                    {draftOptions.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10 shrink-0 px-0"
                        onClick={() => setDraftOptions(draftOptions.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setDraftOptions([...draftOptions, ""])}
                >
                  <Plus className="mr-1 h-3 w-3" /> Додати варіант
                </Button>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={busy}
                onClick={addQuestion}
              >
                Зберегти питання
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddingQuestion(false)}
              >
                Скасувати
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setAddingQuestion(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Додати питання
          </Button>
        )}
      </Section>

      <Section title="Оформлення" hint={RSVP_SURFACES.find((s) => s.id === surface)?.label}>
        <div>
          <Label className="mb-2 block text-[11px] text-muted-foreground">Фон форми</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {RSVP_SURFACES.map(({ id, label }) => {
              const active = surface === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    updateBlock(block.id, {
                      data: {
                        surface: id,
                        ...(id === "theme"
                          ? { showBorder: false, showShadow: false }
                          : id === "glass" || id === "card"
                            ? { showBorder: true, showShadow: true }
                            : {}),
                      },
                    })
                  }
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-left text-[11px] transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {surface === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(block.style.backgroundColor ?? "")
                  ? block.style.backgroundColor!
                  : "#111111"
              }
              onChange={(e) => updateBlock(block.id, { style: { backgroundColor: e.target.value } })}
              className="h-9 w-12 shrink-0 cursor-pointer p-1"
            />
            <Input
              value={block.style.backgroundColor ?? ""}
              onChange={(e) =>
                updateBlock(block.id, { style: { backgroundColor: e.target.value.trim() || undefined } })
              }
              className="font-mono text-xs"
              placeholder="#111111"
            />
          </div>
        )}
        <ToggleSwitch
          label="Рамка"
          checked={
            block.data.showBorder === true ||
            (block.data.showBorder !== false && surface !== "theme")
          }
          onChange={(checked) => updateBlock(block.id, { data: { showBorder: checked } })}
        />
        <ToggleSwitch
          label="Тінь"
          checked={block.data.showShadow === true}
          onChange={(checked) => updateBlock(block.id, { data: { showShadow: checked } })}
        />
      </Section>
    </div>
  );
}

function QuestionEditForm({
  question,
  busy,
  onCancel,
  onSave,
}: {
  question: Question;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: {
    title: string;
    description: string | null;
    placeholder: string | null;
    defaultValue: string | null;
    required: boolean;
    options?: { id?: string; label: string }[];
  }) => void;
}) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description ?? "");
  const [placeholder, setPlaceholder] = useState(question.placeholder ?? "");
  const [defaultValue, setDefaultValue] = useState(question.defaultValue ?? "");
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState<{ id?: string; label: string }[]>(
    question.options.length
      ? question.options.map((o) => ({ id: o.id, label: o.label }))
      : [{ label: "" }, { label: "" }],
  );
  const isChoice = CHOICE_TYPES.includes(question.type);
  const isTextLike = ["TEXT", "TEXTAREA", "NUMBER"].includes(question.type);
  const isYesNo = question.type === "YES_NO";
  const isMulti = question.type === "MULTIPLE_CHOICE";
  const showPlaceholder = isTextLike || ["SINGLE_CHOICE", "SELECT", "YES_NO"].includes(question.type);

  const defaultSelectedIds = isMulti
    ? defaultValue.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-2.5">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[52px] text-sm"
        placeholder="Опис"
      />
      {showPlaceholder && (
        <Input
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          className="text-sm"
          placeholder="Плейсхолдер"
        />
      )}
      {isTextLike && (
        <Input
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          className="text-sm"
          placeholder="Відповідь за замовчуванням"
        />
      )}
      {isYesNo && (
        <Select
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          className="text-sm"
        >
          <option value="">Без відповіді за замовчуванням</option>
          <option value="yes">Так</option>
          <option value="no">Ні</option>
        </Select>
      )}
      {["SINGLE_CHOICE", "SELECT"].includes(question.type) && (
        <Select
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          className="text-sm"
        >
          <option value="">Без відповіді за замовчуванням</option>
          {options
            .filter((o) => o.label.trim() && o.id)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
        </Select>
      )}
      {isMulti && (
        <div className="space-y-1.5">
          <Label className="text-[11px]">Відповіді за замовчуванням</Label>
          {options
            .filter((o) => o.label.trim() && o.id)
            .map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={defaultSelectedIds.includes(o.id!)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...defaultSelectedIds, o.id!]
                      : defaultSelectedIds.filter((id) => id !== o.id);
                    setDefaultValue(next.join(","));
                  }}
                />
                {o.label}
              </label>
            ))}
        </div>
      )}
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        Обовʼязкове
      </label>
      {isChoice && (
        <div className="space-y-2">
          <Label className="text-[11px]">Варіанти</Label>
          {options.map((opt, i) => (
            <div key={opt.id ?? `new-${i}`} className="flex gap-1.5">
              <Input
                value={opt.label}
                className="text-sm"
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...next[i]!, label: e.target.value };
                  setOptions(next);
                }}
              />
              {options.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 shrink-0 px-0"
                  onClick={() => {
                    const removed = options[i];
                    setOptions(options.filter((_, j) => j !== i));
                    if (removed?.id && defaultValue.includes(removed.id)) {
                      if (isMulti) {
                        setDefaultValue(
                          defaultSelectedIds.filter((id) => id !== removed.id).join(","),
                        );
                      } else if (defaultValue === removed.id) {
                        setDefaultValue("");
                      }
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setOptions([...options, { label: "" }])}
          >
            <Plus className="mr-1 h-3 w-3" /> Додати варіант
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 flex-1 text-xs"
          disabled={busy}
          onClick={() =>
            onSave({
              title: title.trim(),
              description: description.trim() || null,
              placeholder: placeholder.trim() || null,
              defaultValue: defaultValue.trim() || null,
              required,
              options: isChoice
                ? options.filter((o) => o.label.trim()).map((o) => ({ id: o.id, label: o.label.trim() }))
                : undefined,
            })
          }
        >
          Зберегти
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </div>
  );
}
