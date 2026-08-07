import type { InviteLocale } from "@/types/invite";

export interface RsvpCopy {
  title: string;
  responseLabel: string;
  attendingLabel: string;
  notAttendingLabel: string;
  maybeLabel: string;
  namePlaceholder: string;
  adultLabel: string;
  childLabel: string;
  emailPlaceholder: string;
  addGuestLabel: string;
  commentLabel: string;
  submitLabel: string;
  questionsTitle: string;
}

export interface RsvpFieldFlags {
  showResponse: boolean;
  showName: boolean;
  showGuestType: boolean;
  showEmail: boolean;
  allowAddGuest: boolean;
  showComment: boolean;
}

/** Values accepted by the RSVP API / DB enum. */
export type RsvpResponseValue = "ATTENDING" | "NOT_ATTENDING" | "MAYBE";

export interface RsvpResponseOption {
  /** Stable id for list editing. */
  id: string;
  label: string;
  /** Stored RSVP status when this option is chosen. */
  value: RsvpResponseValue;
  enabled: boolean;
}

const UK: RsvpCopy = {
  title: "Підтвердити присутність",
  responseLabel: "Ваша відповідь",
  attendingLabel: "Буду",
  notAttendingLabel: "Не буду",
  maybeLabel: "Можливо",
  namePlaceholder: "Повне ім'я",
  adultLabel: "Дорослий",
  childLabel: "Дитина",
  emailPlaceholder: "Email (необов'язково)",
  addGuestLabel: "+ Додати гостя",
  commentLabel: "Коментар",
  submitLabel: "Надіслати",
  questionsTitle: "Додаткові питання",
};

const EN: RsvpCopy = {
  title: "RSVP",
  responseLabel: "Your response",
  attendingLabel: "Attending",
  notAttendingLabel: "Not Attending",
  maybeLabel: "Maybe",
  namePlaceholder: "Full name",
  adultLabel: "Adult",
  childLabel: "Child",
  emailPlaceholder: "Email (optional)",
  addGuestLabel: "+ Add family member",
  commentLabel: "Comment",
  submitLabel: "Submit RSVP",
  questionsTitle: "Additional questions",
};

const RESPONSE_VALUES: RsvpResponseValue[] = ["ATTENDING", "NOT_ATTENDING", "MAYBE"];

export const RSVP_RESPONSE_VALUE_LABELS: Record<RsvpResponseValue, string> = {
  ATTENDING: "Буду / Attending",
  NOT_ATTENDING: "Не буду / Not attending",
  MAYBE: "Можливо / Maybe",
};

/** Orderable guest-related controls on the form (not response/comment). */
export type RsvpGuestFieldId = "name" | "guestType" | "email" | "addGuest";

export const DEFAULT_GUEST_FIELD_ORDER: RsvpGuestFieldId[] = [
  "name",
  "guestType",
  "email",
  "addGuest",
];

export const GUEST_FIELD_META: Record<
  RsvpGuestFieldId,
  { flag: keyof RsvpFieldFlags; title: string }
> = {
  name: { flag: "showName", title: "Ім'я" },
  guestType: { flag: "showGuestType", title: "Тип гостя" },
  email: { flag: "showEmail", title: "Email" },
  addGuest: { flag: "allowAddGuest", title: "Кнопка «Додати гостя»" },
};

/** Full form layout order — includes survey questions and comment. */
export type RsvpFormFieldId =
  | "response"
  | RsvpGuestFieldId
  | "questions"
  | "comment";

export const DEFAULT_FORM_FIELD_ORDER: RsvpFormFieldId[] = [
  "response",
  "name",
  "guestType",
  "email",
  "addGuest",
  "questions",
  "comment",
];

export const FORM_FIELD_META: Record<RsvpFormFieldId, { title: string }> = {
  response: { title: "Відповідь (Буду / Не буду)" },
  name: { title: "Ім'я" },
  guestType: { title: "Тип гостя" },
  email: { title: "Email" },
  addGuest: { title: "Кнопка «Додати гостя»" },
  questions: { title: "Додаткові питання" },
  comment: { title: "Коментар" },
};

export function isAttendeeFormField(
  id: RsvpFormFieldId,
): id is "name" | "guestType" | "email" {
  return id === "name" || id === "guestType" || id === "email";
}

export function resolveGuestFieldOrder(
  data: Record<string, unknown> | null | undefined,
): RsvpGuestFieldId[] {
  const formOrder = resolveFormFieldOrder(data);
  const fromForm = formOrder.filter((id): id is RsvpGuestFieldId =>
    DEFAULT_GUEST_FIELD_ORDER.includes(id as RsvpGuestFieldId),
  );
  if (fromForm.length) return fromForm;

  const raw = data?.guestFieldOrder;
  if (!Array.isArray(raw)) return [...DEFAULT_GUEST_FIELD_ORDER];
  const seen = new Set<RsvpGuestFieldId>();
  const ordered: RsvpGuestFieldId[] = [];
  for (const id of raw) {
    if (
      typeof id === "string" &&
      DEFAULT_GUEST_FIELD_ORDER.includes(id as RsvpGuestFieldId) &&
      !seen.has(id as RsvpGuestFieldId)
    ) {
      seen.add(id as RsvpGuestFieldId);
      ordered.push(id as RsvpGuestFieldId);
    }
  }
  for (const id of DEFAULT_GUEST_FIELD_ORDER) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

export function resolveFormFieldOrder(
  data: Record<string, unknown> | null | undefined,
): RsvpFormFieldId[] {
  const raw = data?.formFieldOrder;
  if (Array.isArray(raw) && raw.length) {
    const seen = new Set<RsvpFormFieldId>();
    const ordered: RsvpFormFieldId[] = [];
    for (const id of raw) {
      if (
        typeof id === "string" &&
        DEFAULT_FORM_FIELD_ORDER.includes(id as RsvpFormFieldId) &&
        !seen.has(id as RsvpFormFieldId)
      ) {
        seen.add(id as RsvpFormFieldId);
        ordered.push(id as RsvpFormFieldId);
      }
    }
    for (const id of DEFAULT_FORM_FIELD_ORDER) {
      if (!seen.has(id)) ordered.push(id);
    }
    return ordered;
  }

  // Legacy: build from guestFieldOrder + fixed response / questions / comment
  const guest = (() => {
    const g = data?.guestFieldOrder;
    if (!Array.isArray(g)) return [...DEFAULT_GUEST_FIELD_ORDER];
    const seen = new Set<RsvpGuestFieldId>();
    const ordered: RsvpGuestFieldId[] = [];
    for (const id of g) {
      if (
        typeof id === "string" &&
        DEFAULT_GUEST_FIELD_ORDER.includes(id as RsvpGuestFieldId) &&
        !seen.has(id as RsvpGuestFieldId)
      ) {
        seen.add(id as RsvpGuestFieldId);
        ordered.push(id as RsvpGuestFieldId);
      }
    }
    for (const id of DEFAULT_GUEST_FIELD_ORDER) {
      if (!seen.has(id)) ordered.push(id);
    }
    return ordered;
  })();

  return ["response", ...guest, "questions", "comment"];
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function defaultRsvpCopy(locale: InviteLocale = "uk"): RsvpCopy {
  return locale === "en" ? { ...EN } : { ...UK };
}

export function defaultRsvpFieldFlags(): RsvpFieldFlags {
  return {
    showResponse: true,
    showName: true,
    showGuestType: true,
    showEmail: true,
    allowAddGuest: true,
    showComment: true,
  };
}

export function defaultResponseOptions(locale: InviteLocale = "uk"): RsvpResponseOption[] {
  const base = defaultRsvpCopy(locale);
  return [
    { id: "attending", label: base.attendingLabel, value: "ATTENDING", enabled: true },
    { id: "not_attending", label: base.notAttendingLabel, value: "NOT_ATTENDING", enabled: true },
    { id: "maybe", label: base.maybeLabel, value: "MAYBE", enabled: true },
  ];
}

/**
 * Keep explicit strings (including "") so the editor can clear a field.
 * Only fall back when the key was never set.
 */
function str(raw: unknown, fallback: string): string {
  if (typeof raw === "string") return raw;
  return fallback;
}

function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

function labelsBag(
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const d = data ?? {};
  if (d.labels && typeof d.labels === "object" && !Array.isArray(d.labels)) {
    return d.labels as Record<string, unknown>;
  }
  return d;
}

/** Resolve RSVP labels from block.data with locale defaults. */
export function resolveRsvpCopy(
  data: Record<string, unknown> | null | undefined,
  locale: InviteLocale = "uk",
): RsvpCopy {
  const nested = labelsBag(data);
  const base = defaultRsvpCopy(locale);

  return {
    title: str(nested.title, base.title),
    responseLabel: str(nested.responseLabel, base.responseLabel),
    attendingLabel: str(nested.attendingLabel, base.attendingLabel),
    notAttendingLabel: str(nested.notAttendingLabel, base.notAttendingLabel),
    maybeLabel: str(nested.maybeLabel, base.maybeLabel),
    namePlaceholder: str(nested.namePlaceholder, base.namePlaceholder),
    adultLabel: str(nested.adultLabel, base.adultLabel),
    childLabel: str(nested.childLabel, base.childLabel),
    emailPlaceholder: str(nested.emailPlaceholder, base.emailPlaceholder),
    addGuestLabel: str(nested.addGuestLabel, base.addGuestLabel),
    commentLabel: str(nested.commentLabel, base.commentLabel),
    submitLabel: str(nested.submitLabel, base.submitLabel),
    questionsTitle: str(nested.questionsTitle, base.questionsTitle),
  };
}

/** @deprecated Prefer resolveRsvpCopy — empty values stay empty. */
export function resolveRsvpCopyForDisplay(
  data: Record<string, unknown> | null | undefined,
  locale: InviteLocale = "uk",
): RsvpCopy {
  return resolveRsvpCopy(data, locale);
}

export function resolveRsvpFieldFlags(
  data: Record<string, unknown> | null | undefined,
): RsvpFieldFlags {
  const d = data ?? {};
  const nested =
    d.fields && typeof d.fields === "object" && !Array.isArray(d.fields)
      ? (d.fields as Record<string, unknown>)
      : d;
  const base = defaultRsvpFieldFlags();
  return {
    showResponse: bool(nested.showResponse, base.showResponse),
    showName: bool(nested.showName, base.showName),
    showGuestType: bool(nested.showGuestType, base.showGuestType),
    showEmail: bool(nested.showEmail, base.showEmail),
    allowAddGuest: bool(nested.allowAddGuest, base.allowAddGuest),
    showComment: bool(nested.showComment, base.showComment),
  };
}

function isResponseValue(v: unknown): v is RsvpResponseValue {
  return typeof v === "string" && RESPONSE_VALUES.includes(v as RsvpResponseValue);
}

/**
 * Attendance dropdown options.
 * Supports legacy `{ key, label, enabled }` and current `{ id, label, value, enabled }`.
 * Empty labels are preserved for the editor (use enabledResponseOptions for public UI).
 */
export function resolveRsvpResponseOptions(
  data: Record<string, unknown> | null | undefined,
  locale: InviteLocale = "uk",
): RsvpResponseOption[] {
  const defaults = defaultResponseOptions(locale);
  const d = data ?? {};
  const raw = d.responseOptions;

  if (!Array.isArray(raw) || raw.length === 0) {
    // Legacy: sync labels from copy fields if present
    const copy = resolveRsvpCopy(data, locale);
    return [
      {
        id: "attending",
        label: copy.attendingLabel,
        value: "ATTENDING",
        enabled: true,
      },
      {
        id: "not_attending",
        label: copy.notAttendingLabel,
        value: "NOT_ATTENDING",
        enabled: true,
      },
      {
        id: "maybe",
        label: copy.maybeLabel,
        value: "MAYBE",
        enabled: true,
      },
    ];
  }

  const parsed: RsvpResponseOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;

    // Legacy shape: { key: ATTENDING, label, enabled }
    if (typeof row.key === "string" && isResponseValue(row.key) && row.id === undefined) {
      const def = defaults.find((o) => o.value === row.key);
      parsed.push({
        id: def?.id ?? row.key.toLowerCase(),
        label: typeof row.label === "string" ? row.label : (def?.label ?? row.key),
        value: row.key,
        enabled: row.enabled !== false,
      });
      continue;
    }

    const id = typeof row.id === "string" && row.id ? row.id : `opt_${parsed.length}`;
    const value = isResponseValue(row.value)
      ? row.value
      : isResponseValue(row.key)
        ? row.key
        : "MAYBE";
    const label = typeof row.label === "string" ? row.label : "";
    parsed.push({
      id,
      label,
      value,
      enabled: row.enabled !== false,
    });
  }

  return parsed.length > 0 ? parsed : defaults;
}

export function enabledResponseOptions(
  data: Record<string, unknown> | null | undefined,
  locale: InviteLocale = "uk",
): RsvpResponseOption[] {
  const all = resolveRsvpResponseOptions(data, locale);
  const base = defaultResponseOptions(locale);
  const enabled = all.filter((o) => o.enabled);
  return enabled.length > 0 ? enabled : [{ ...base[0]!, enabled: true }];
}

export function newResponseOptionId(): string {
  return `opt_${Math.random().toString(36).slice(2, 10)}`;
}
