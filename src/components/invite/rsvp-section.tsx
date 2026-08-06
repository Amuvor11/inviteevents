"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { GlassCard } from "@/components/invite/glass-card";
import { SectionReveal } from "@/components/invite/section-reveal";
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
  variant = "glass",
}: RsvpSectionProps) {
  const theme = ctx.theme;
  if (!ctx.showRsvp || event.rsvpClosed) return null;
  if (!ctx.isSectionVisible("rsvp")) return null;

  const labels =
    theme.locale === "uk"
      ? { rsvp: "Підтвердити присутність", response: "Ваша відповідь", submit: "Надіслати", comment: "Коментар", addMember: "+ Додати гостя" }
      : { rsvp: "RSVP", response: "Your response", submit: "Submit RSVP", comment: "Comment", addMember: "+ Add family member" };

  const content = (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold" style={{ fontFamily: theme.serifFontFamily, color: theme.textColor }}>
        {labels.rsvp}
      </h3>
      <div>
        <Label style={{ color: theme.textColor }}>{labels.response}</Label>
        <Select value={response} onChange={(e) => setResponse(e.target.value)}>
          <option value="ATTENDING">{theme.locale === "uk" ? "Буду" : "Attending"}</option>
          <option value="NOT_ATTENDING">{theme.locale === "uk" ? "Не буду" : "Not Attending"}</option>
          <option value="MAYBE">{theme.locale === "uk" ? "Можливо" : "Maybe"}</option>
        </Select>
      </div>
      {attendees.map((a, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder={theme.locale === "uk" ? "Повне ім'я" : "Full name"}
            value={a.name}
            onChange={(e) => {
              const next = [...attendees];
              next[i] = { ...next[i], name: e.target.value };
              setAttendees(next);
            }}
          />
          <Select
            value={a.attendeeType}
            onChange={(e) => {
              const next = [...attendees];
              next[i] = { ...next[i], attendeeType: e.target.value as "ADULT" | "CHILD" };
              setAttendees(next);
            }}
          >
            <option value="ADULT">{theme.locale === "uk" ? "Дорослий" : "Adult"}</option>
            <option value="CHILD">{theme.locale === "uk" ? "Дитина" : "Child"}</option>
          </Select>
          {i === 0 && (
            <Input
              placeholder={theme.locale === "uk" ? "Email (необов'язково)" : "Email (optional)"}
              value={a.email}
              onChange={(e) => {
                const next = [...attendees];
                next[i] = { ...next[i], email: e.target.value };
                setAttendees(next);
              }}
            />
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAttendees([...attendees, { name: "", attendeeType: "ADULT", email: "" }])}
      >
        {labels.addMember}
      </Button>
      <div>
        <Label style={{ color: theme.textColor }}>{labels.comment}</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      {event.questions.length > 0 && ctx.isSectionVisible("questions") && (
        <div className="space-y-4 border-t border-black/10 pt-4">
          <h4 className="font-semibold" style={{ color: theme.textColor }}>
            {theme.locale === "uk" ? "Додаткові питання" : "Additional questions"}
          </h4>
          {event.questions.map((q) => (
            <div key={q.id}>
              <Label style={{ color: theme.textColor }}>
                {q.title}
                {q.required && " *"}
              </Label>
              {q.description && <p className="mb-1 text-xs opacity-60">{q.description}</p>}
              {q.type === "TEXT" && (
                <Input onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.type === "TEXTAREA" && (
                <Textarea onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.type === "NUMBER" && (
                <Input type="number" onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.type === "YES_NO" && (
                <Select onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                  <option value="">...</option>
                  <option value="yes">{theme.locale === "uk" ? "Так" : "Yes"}</option>
                  <option value="no">{theme.locale === "uk" ? "Ні" : "No"}</option>
                </Select>
              )}
              {["SINGLE_CHOICE", "SELECT"].includes(q.type) && (
                <Select onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                  <option value="">...</option>
                  {q.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              )}
              {q.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const current = (answers[q.id] as string[]) ?? [];
                          setAnswers({
                            ...answers,
                            [q.id]: e.target.checked
                              ? [...current, o.id]
                              : current.filter((id) => id !== o.id),
                          });
                        }}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full"
        onClick={onSubmit}
        loading={loading}
        style={{ backgroundColor: theme.primaryColor, color: "#fff" }}
      >
        {labels.submit}
      </Button>
    </div>
  );

  return (
    <SectionReveal className="px-4 pb-12">
      {variant === "glass" ? (
        <GlassCard opacity={theme.glassOpacity} className="mx-auto max-w-lg p-6 sm:p-8">
          {content}
        </GlassCard>
      ) : (
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{content}</div>
      )}
    </SectionReveal>
  );
}
