import type { InviteTheme, PublicInviteEvent, RsvpAttendee } from "@/types/invite";
import type { ResolvedInviteContext } from "@/lib/invite/personalization";

export interface InviteLayoutProps {
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
}

/** @deprecated use ctx.theme */
export type { InviteTheme };
