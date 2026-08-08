"use client";

import { SectionReveal } from "@/components/invite/section-reveal";
import { RsvpFormBody } from "@/components/invite/rsvp-form-preview";
import { resolveRsvpChrome } from "@/lib/invite/rsvp-chrome";
import type { DesignBlock } from "@/types/design";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";
import type { PublicInviteEvent, RsvpAttendee } from "@/types/invite";

interface RsvpSectionProps {
  event: PublicInviteEvent;
  ctx: ResolvedInviteContext;
  response: string;
  setResponse: (v: string) => void;
  attendees: RsvpAttendee[];
  setAttendees: (v: RsvpAttendee[]) => void;
  message: string;
  setMessage: (v: string) => void;
  answers: Record<string, unknown>;
  setAnswers: (v: Record<string, unknown>) => void;
  loading: boolean;
  onSubmit: () => void;
  /** Design block settings (surface, colors, labels). */
  block?: Pick<DesignBlock, "data" | "style"> | null;
  /** @deprecated Prefer block.data.surface — kept for classic layouts. */
  variant?: "glass" | "card";
}

export function RsvpSection({
  event,
  ctx,
  response,
  setResponse,
  attendees,
  setAttendees,
  message,
  setMessage,
  answers,
  setAnswers,
  loading,
  onSubmit,
  block = null,
  variant,
}: RsvpSectionProps) {
  const theme = ctx.theme;
  if (!ctx.showRsvp || event.rsvpClosed) return null;
  if (!ctx.isSectionVisible("rsvp")) return null;

  const resolvedBlock =
    block ??
    (variant
      ? {
          data: { surface: variant === "card" ? "card" : "glass", showBorder: true, showShadow: true },
          style: {},
        }
      : null);

  const chrome = resolveRsvpChrome(theme, resolvedBlock);

  return (
    <SectionReveal className="px-4 pb-8">
      <div className={chrome.cardClassName} style={chrome.cardStyle}>
        <RsvpFormBody
          theme={theme}
          block={resolvedBlock}
          questions={event.questions}
          showQuestions={ctx.isSectionVisible("questions")}
          response={response}
          setResponse={setResponse}
          attendees={attendees}
          setAttendees={setAttendees}
          message={message}
          setMessage={setMessage}
          answers={answers}
          setAnswers={setAnswers}
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
    </SectionReveal>
  );
}
