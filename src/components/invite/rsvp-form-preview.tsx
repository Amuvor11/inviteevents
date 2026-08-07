"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { resolveRsvpChrome, isDarkColor } from "@/lib/invite/rsvp-chrome";
import {
  enabledResponseOptions,
  isAttendeeFormField,
  resolveFormFieldOrder,
  resolveRsvpCopy,
  resolveRsvpFieldFlags,
} from "@/lib/invite/rsvp-copy";
import { resolveQuestionAnswer } from "@/lib/invite/question-defaults";
import type { DesignBlock } from "@/types/design";
import type { InviteTheme, PublicInviteEvent, RsvpAttendee } from "@/types/invite";

type Question = PublicInviteEvent["questions"][number];

function isQuestionAnswerEmpty(q: Question, answer: unknown): boolean {
  if (q.type === "MULTIPLE_CHOICE") {
    return !Array.isArray(answer) || answer.length === 0;
  }
  if (q.type === "NUMBER") {
    if (answer === undefined || answer === null || answer === "") return true;
    return Number.isNaN(Number(answer));
  }
  return answer === undefined || answer === null || String(answer).trim() === "";
}
export interface RsvpFormBodyProps {
  theme: InviteTheme;
  block?: Pick<DesignBlock, "data" | "style"> | null;
  questions?: PublicInviteEvent["questions"];
  showQuestions?: boolean;
  response: string;
  setResponse?: (v: string) => void;
  attendees: RsvpAttendee[];
  setAttendees?: (v: RsvpAttendee[]) => void;
  message: string;
  setMessage?: (v: string) => void;
  answers?: Record<string, unknown>;
  setAnswers?: (v: Record<string, unknown>) => void;
  loading?: boolean;
  onSubmit?: () => void;
  /** Editor canvas: same markup, non-interactive. */
  readOnly?: boolean;
}

/** Shared RSVP form body — identical in public invite and design editor. */
export function RsvpFormBody({
  theme,
  block = null,
  questions = [],
  showQuestions = true,
  response,
  setResponse,
  attendees,
  setAttendees,
  message,
  setMessage,
  answers = {},
  setAnswers,
  loading = false,
  onSubmit,
  readOnly = false,
}: RsvpFormBodyProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const data = (block?.data ?? {}) as Record<string, unknown>;
  const chrome = resolveRsvpChrome(theme, block);
  const labels = resolveRsvpCopy(data, theme.locale);
  const fields = resolveRsvpFieldFlags(data);
  const responseOpts = enabledResponseOptions(data, theme.locale);
  const requiredHint =
    theme.locale === "uk" ? "Це поле потрібно заповнити" : "This field is required";

  const formOrder = resolveFormFieldOrder(data);
  const fieldStyle = {
    backgroundColor: chrome.fieldBackground,
    borderColor: chrome.fieldBorder,
    color: chrome.fieldColor,
    colorScheme: isDarkColor(chrome.cardBackground) || isDarkColor(theme.backgroundColor) ? "dark" : "light",
  } as const;

  const ro = readOnly
    ? { readOnly: true as const, tabIndex: -1 }
    : {};

  const clearQuestionError = (questionId: string) => {
    setFieldErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = () => {
    if (readOnly) return;
    const nextErrors: Record<string, string> = {};
    if (showQuestions) {
      for (const q of questions) {
        if (!q.required) continue;
        const answer = resolveQuestionAnswer(q, answers);
        if (isQuestionAnswerEmpty(q, answer)) {
          nextErrors[q.id] = requiredHint;
        }
      }
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit?.();
  };
  const renderGuestControl = (id: "name" | "guestType" | "email", a: RsvpAttendee, i: number) => {
    if (id === "name" && fields.showName) {
      return (
        <Input
          key={`${i}-name`}
          placeholder={labels.namePlaceholder}
          value={a.name}
          onChange={(e) => {
            if (!setAttendees) return;
            const next = [...attendees];
            next[i] = { ...next[i], name: e.target.value };
            setAttendees(next);
          }}
          style={fieldStyle}
          {...ro}
        />
      );
    }
    if (id === "guestType" && fields.showGuestType) {
      return (
        <Select
          key={`${i}-guestType`}
          value={a.attendeeType}
          onChange={(e) => {
            if (!setAttendees) return;
            const next = [...attendees];
            next[i] = { ...next[i], attendeeType: e.target.value as "ADULT" | "CHILD" };
            setAttendees(next);
          }}
          style={fieldStyle}
        >
          <option value="ADULT">{labels.adultLabel}</option>
          <option value="CHILD">{labels.childLabel}</option>
        </Select>
      );
    }
    if (id === "email" && fields.showEmail && i === 0) {
      return (
        <Input
          key={`${i}-email`}
          placeholder={labels.emailPlaceholder}
          value={a.email}
          onChange={(e) => {
            if (!setAttendees) return;
            const next = [...attendees];
            next[i] = { ...next[i], email: e.target.value };
            setAttendees(next);
          }}
          style={fieldStyle}
          {...ro}
        />
      );
    }
    return null;
  };

  const renderResponse = () =>
    fields.showResponse ? (
      <div key="response">
        <Label style={{ color: theme.textColor }}>{labels.responseLabel}</Label>
        <Select
          value={
            responseOpts.some((o) => o.id === response)
              ? response
              : responseOpts.find((o) => o.value === response)?.id ?? responseOpts[0]?.id
          }
          onChange={(e) => setResponse?.(e.target.value)}
          style={fieldStyle}
        >
          {responseOpts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    ) : null;

  const renderAddGuest = () =>
    fields.allowAddGuest ? (
      <Button
        key="addGuest"
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setAttendees?.([...attendees, { name: "", attendeeType: "ADULT", email: "" }])
        }
        style={{
          backgroundColor: chrome.fieldBackground,
          borderColor: chrome.fieldBorder,
          color: theme.textColor,
        }}
      >
        {labels.addGuestLabel}
      </Button>
    ) : null;

  const renderComment = () =>
    fields.showComment ? (
      <div key="comment">
        <Label style={{ color: theme.textColor }}>{labels.commentLabel}</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage?.(e.target.value)}
          style={fieldStyle}
          {...ro}
        />
      </div>
    ) : null;

  const renderQuestions = () =>
    showQuestions && questions.length > 0 ? (
      <div key="questions" className="space-y-4">
        {labels.questionsTitle.trim() ? (
          <h4 className="font-semibold" style={{ color: theme.textColor }}>
            {labels.questionsTitle}
          </h4>
        ) : null}
        {questions.map((q) => {
          const answer = resolveQuestionAnswer(q, answers);
          const placeholder = q.placeholder?.trim() || undefined;
          const error = fieldErrors[q.id];
          const setAnswerValue = (value: unknown) => {
            clearQuestionError(q.id);
            setAnswers?.({ ...answers, [q.id]: value });
          };
          return (
          <div key={q.id}>
            {q.title.trim() ? (
              <Label style={{ color: theme.textColor }}>{q.title}</Label>
            ) : null}
            {q.description?.trim() ? (
              <p className="mb-1 text-xs opacity-60" style={{ color: theme.textColor }}>
                {q.description}
              </p>
            ) : null}
            {q.type === "TEXT" && (
              <Input
                value={(answer as string) ?? ""}
                placeholder={placeholder}
                onChange={(e) => setAnswerValue(e.target.value)}
                style={fieldStyle}
                aria-invalid={Boolean(error)}
                {...ro}
              />
            )}
            {q.type === "TEXTAREA" && (
              <Textarea
                value={(answer as string) ?? ""}
                placeholder={placeholder}
                onChange={(e) => setAnswerValue(e.target.value)}
                style={fieldStyle}
                aria-invalid={Boolean(error)}
                {...ro}
              />
            )}
            {q.type === "NUMBER" && (
              <Input
                type="number"
                value={(answer as string) ?? ""}
                placeholder={placeholder}
                onChange={(e) => setAnswerValue(e.target.value)}
                style={fieldStyle}
                aria-invalid={Boolean(error)}
                {...ro}
              />
            )}
            {q.type === "YES_NO" && (
              <Select
                value={(answer as string) ?? ""}
                onChange={(e) => setAnswerValue(e.target.value)}
                style={fieldStyle}
                aria-invalid={Boolean(error)}
              >
                <option value="">{placeholder || "..."}</option>
                <option value="yes">{theme.locale === "uk" ? "Так" : "Yes"}</option>
                <option value="no">{theme.locale === "uk" ? "Ні" : "No"}</option>
              </Select>
            )}
            {["SINGLE_CHOICE", "SELECT"].includes(q.type) && (
              <Select
                value={(answer as string) ?? ""}
                onChange={(e) => setAnswerValue(e.target.value)}
                style={fieldStyle}
                aria-invalid={Boolean(error)}
              >
                <option value="">{placeholder || "..."}</option>
                {q.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
            {q.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: theme.textColor }}
                  >
                    <input
                      type="checkbox"
                      checked={((answer as string[]) ?? []).includes(o.id)}
                      onChange={(e) => {
                        const current = ((answer as string[]) ?? []).slice();
                        setAnswerValue(
                          e.target.checked
                            ? [...current, o.id]
                            : current.filter((id) => id !== o.id),
                        );
                      }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
            {error ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          );
        })}
      </div>
    ) : null;

  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < formOrder.length) {
    const id = formOrder[i]!;
    if (isAttendeeFormField(id)) {
      const run: Array<"name" | "guestType" | "email"> = [];
      while (i < formOrder.length && isAttendeeFormField(formOrder[i]!)) {
        run.push(formOrder[i] as "name" | "guestType" | "email");
        i += 1;
      }
      nodes.push(
        ...attendees.map((a, ai) => (
          <div key={`att-${ai}-${run.join("-")}`} className="flex flex-col gap-2">
            {run.map((fid) => renderGuestControl(fid, a, ai))}
          </div>
        )),
      );
      continue;
    }
    if (id === "response") nodes.push(renderResponse());
    else if (id === "addGuest") nodes.push(renderAddGuest());
    else if (id === "comment") nodes.push(renderComment());
    else if (id === "questions") nodes.push(renderQuestions());
    i += 1;
  }

  return (
    <div className={`space-y-4 ${readOnly ? "pointer-events-none" : ""}`}>
      <h3 className="text-xl font-semibold" style={{ fontFamily: theme.serifFontFamily, color: theme.textColor }}>
        {labels.title}
      </h3>

      {nodes}

      <Button
        type="button"
        className="w-full"
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ backgroundColor: theme.primaryColor, color: "#fff" }}
      >
        {labels.submitLabel}
      </Button>
    </div>
  );
}

interface RsvpFormPreviewProps {
  theme: InviteTheme;
  block: Pick<DesignBlock, "data" | "style">;
  questions?: PublicInviteEvent["questions"];
  className?: string;
}

/** Design-editor canvas preview — same form as the public invite. */
export function RsvpFormPreview({
  theme,
  block,
  questions = [],
  className = "",
}: RsvpFormPreviewProps) {
  const chrome = resolveRsvpChrome(theme, block);

  return (
    <div
      className={`${chrome.cardClassName} !mx-0 !max-w-none ${className}`}
      style={chrome.cardStyle}
    >
      <RsvpFormBody
        theme={theme}
        block={block}
        questions={questions}
        response="ATTENDING"
        attendees={[{ name: "", attendeeType: "ADULT", email: "" }]}
        message=""
        readOnly
      />
    </div>
  );
}
