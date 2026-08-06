import type { InviteTheme, PublicInviteEvent } from "@/types/invite";
import type { GuestGroupPersonalization, GuestInviteContext, InviteSection } from "@/types/personalization";
import { resolveInviteTheme, deriveMonogram } from "@/lib/invite/theme";

const ALL_SECTIONS: InviteSection[] = [
  "hero",
  "countdown",
  "calendar",
  "details",
  "message",
  "schedule",
  "dressCode",
  "media",
  "additionalInfo",
  "music",
  "rsvp",
  "questions",
];

export interface ResolvedInviteContext {
  theme: InviteTheme;
  greeting: string;
  invitationMessage: string | null;
  personalNote: string | null;
  monogram: string;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  isSectionVisible: (section: InviteSection) => boolean;
  showRsvp: boolean;
  guest: GuestInviteContext | null;
}

function deriveDefaultGreeting(
  guest: GuestInviteContext | null,
  locale: InviteLocale,
): string {
  if (!guest) return locale === "uk" ? "Дорогі гості" : "Dear guests";

  if (guest.groupName) {
    return locale === "uk" ? `Шановні ${guest.groupName}` : `Dear ${guest.groupName}`;
  }

  const names = guest.guests.map((g) => g.name).filter(Boolean);
  if (names.length === 1) {
    return locale === "uk" ? `Шановний(-а) ${names[0]}` : `Dear ${names[0]}`;
  }
  if (names.length > 1) {
    return locale === "uk" ? `Шановні ${names.join(" та ")}` : `Dear ${names.join(" & ")}`;
  }

  return locale === "uk" ? "Дорогі гості" : "Dear guests";
}

type InviteLocale = "en" | "uk";

export function resolveInviteContext(
  event: PublicInviteEvent,
  guest: GuestInviteContext | null,
): ResolvedInviteContext {
  const layout = event.template?.layout ?? "classic";
  const eventCustom = (event.customTheme ?? {}) as Partial<InviteTheme> & {
    hiddenSections?: InviteSection[];
  };
  const guestPersonalization = (guest?.personalization ?? null) as GuestGroupPersonalization | null;
  const guestTheme = guestPersonalization?.customTheme ?? {};

  const theme = resolveInviteTheme(layout, {
    ...eventCustom,
    ...guestTheme,
    locale: guestPersonalization?.locale ?? guestTheme.locale ?? eventCustom.locale,
    monogram: guestPersonalization?.monogram ?? guestTheme.monogram ?? eventCustom.monogram,
  });

  const eventHidden = new Set(eventCustom.hiddenSections ?? []);
  const guestHidden = new Set(guestPersonalization?.hiddenSections ?? []);
  const guestShown = guestPersonalization?.shownSections;

  const isSectionVisible = (section: InviteSection): boolean => {
    if (guestShown?.length) return guestShown.includes(section);
    if (guestHidden.has(section)) return false;
    if (eventHidden.has(section)) return false;
    return true;
  };

  const greeting =
    guestPersonalization?.customGreeting?.trim() ||
    deriveDefaultGreeting(guest, theme.locale);

  const invitationMessage =
    guestPersonalization?.invitationMessageOverride?.trim() ||
    guestPersonalization?.personalMessage?.trim() ||
    event.invitationMessage;

  const monogram = deriveMonogram(
    event.hostNames,
    guestPersonalization?.monogram ?? guestTheme.monogram ?? theme.monogram,
  );

  return {
    theme,
    greeting,
    invitationMessage,
    personalNote: guestPersonalization?.accentNote?.trim() ?? null,
    monogram,
    coverImageUrl: guestPersonalization?.coverImageUrl ?? event.coverImageUrl,
    backgroundImageUrl:
      guestPersonalization?.backgroundImageUrl ??
      event.design?.backgroundImageUrl ??
      null,
    isSectionVisible,
    showRsvp: guestPersonalization?.showRsvp !== false && isSectionVisible("rsvp"),
    guest,
  };
}

export { ALL_SECTIONS };
