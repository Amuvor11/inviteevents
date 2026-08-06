import { z } from "zod";

export const customThemeSchema = z.object({
  primaryColor: z.string().nullish(),
  secondaryColor: z.string().nullish(),
  fontFamily: z.string().nullish(),
  backgroundColor: z.string().nullish(),
  accentColor: z.string().nullish(),
  textColor: z.string().nullish(),
  serifFontFamily: z.string().nullish(),
  monogram: z.string().max(8).nullish(),
  showCalendar: z.boolean().nullish(),
  countdownStyle: z.enum(["cards", "elegant", "inline"]).nullish(),
  locale: z.enum(["en", "uk"]).nullish(),
  glassOpacity: z.number().min(0).max(1).nullish(),
  backgroundOverlay: z.number().min(0).max(1).nullish(),
  pagePaddingTop: z.number().min(0).max(200).nullish(),
  pagePaddingBottom: z.number().min(0).max(200).nullish(),
  pagePaddingLeft: z.number().min(0).max(120).nullish(),
  pagePaddingRight: z.number().min(0).max(120).nullish(),
  blockGap: z.number().min(0).max(80).nullish(),
  hiddenSections: z
    .array(
      z.enum([
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
      ]),
    )
    .nullish(),
});

export const scheduleItemSchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const createEventSchema = z.object({
  eventType: z.enum([
    "WEDDING",
    "BIRTHDAY",
    "BAPTISM",
    "GRADUATION",
    "CORPORATE",
    "BABY_SHOWER",
    "OTHER",
  ]),
  title: z.string().min(1).max(200),
  hostNames: z.string().max(300).optional(),
  eventDate: z.string().datetime(),
  eventEndDate: z.string().datetime().optional(),
  timezone: z.string().optional().default("UTC"),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(500).optional(),
  invitationMessage: z.string().max(5000).optional(),
  additionalInfo: z.string().max(5000).optional(),
  dressCode: z.string().max(500).optional(),
  schedule: z.array(scheduleItemSchema).optional(),
  googleMapsLink: z.string().url().optional().or(z.literal("")),
  backgroundMusicUrl: z.string().url().optional().or(z.literal("")),
  templateId: z.string().optional(),
  customTheme: customThemeSchema.optional(),
  coverImageUrl: z.string().optional(),
  coverImagePublicId: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "CANCELLED"]).optional(),
  rsvpClosed: z.boolean().optional(),
  slug: z.string().min(3).max(100).optional(),
  backgroundImageUrl: z.string().optional(),
  designContent: z
    .object({
      version: z.literal(1),
      blocks: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          label: z.string(),
          data: z.record(z.unknown()).optional().default({}),
          style: z.record(z.unknown()).optional().default({}),
          animation: z.enum(["none", "fade", "slideUp", "slideDown", "zoom"]).optional().default("fade"),
          animationDelay: z.number().optional(),
          animationDuration: z.number().optional(),
        }),
      ),
    })
    .optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
