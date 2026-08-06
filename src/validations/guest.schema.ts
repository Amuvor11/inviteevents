import { z } from "zod";
import { customThemeSchema } from "./event.schema";

export const attendeeSchema = z.object({
  name: z.string().min(1).max(200),
  attendeeType: z.enum(["ADULT", "CHILD"]).default("ADULT"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  isPrimary: z.boolean().optional(),
});

const inviteSectionSchema = z.enum([
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
]);

export const guestPersonalizationSchema = z.object({
  customGreeting: z.string().max(300).optional(),
  personalMessage: z.string().max(5000).optional(),
  invitationMessageOverride: z.string().max(5000).optional(),
  accentNote: z.string().max(500).optional(),
  monogram: z.string().max(3).optional(),
  locale: z.enum(["en", "uk"]).optional(),
  showRsvp: z.boolean().optional(),
  hiddenSections: z.array(inviteSectionSchema).optional(),
  shownSections: z.array(inviteSectionSchema).optional(),
  coverImageUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  customTheme: customThemeSchema.optional(),
});

export const createGuestGroupSchema = z.object({
  groupName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  attendees: z.array(attendeeSchema).min(1),
  personalization: guestPersonalizationSchema.optional(),
});

export const updateGuestGroupSchema = z.object({
  groupName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  attendees: z.array(attendeeSchema.extend({ id: z.string().optional() })).optional(),
  personalization: guestPersonalizationSchema.optional(),
  markSent: z.boolean().optional(),
});

export type CreateGuestGroupInput = z.output<typeof createGuestGroupSchema>;
export type UpdateGuestGroupInput = z.output<typeof updateGuestGroupSchema>;
