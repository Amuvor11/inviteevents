"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { resolveInviteContext } from "@/lib/invite/personalization";
import { parseDesignContent } from "@/lib/invite/blocks";
import { enabledResponseOptions } from "@/lib/invite/rsvp-copy";
import { buildDefaultAnswers } from "@/lib/invite/question-defaults";
import { InviteLayoutRenderer } from "@/components/invite/layouts";
import { BlockLayout } from "@/components/invite/block-layout";
import { RsvpSection } from "@/components/invite/rsvp-section";
import { GlassCard } from "@/components/invite/glass-card";
import {
  EnvelopeIntroScreen,
  isEnvelopeIntroEnabled,
} from "@/components/invite/envelope-intro-screen";
import { InviteLoadingScreen } from "@/components/invite/invite-loading-screen";
import type { DesignBlock } from "@/types/design";
import type { PublicInviteEvent, RsvpAttendee } from "@/types/invite";

export default function PublicInvitePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [event, setEvent] = useState<PublicInviteEvent | null>(null);
  const [response, setResponse] = useState("ATTENDING");
  const [attendees, setAttendees] = useState<RsvpAttendee[]>([
    { name: "", attendeeType: "ADULT", email: "" },
  ]);
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);

  const preview = searchParams.get("preview") === "1";

  useEffect(() => {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (preview) params.set("preview", "1");
    const qs = params.toString();
    const url = qs ? `/api/public/invite/${slug}?${qs}` : `/api/public/invite/${slug}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!j.data) return;
        setEvent(j.data);
        setAnswers(buildDefaultAnswers(j.data.questions ?? []));
        if (j.data.guest?.guests?.length) {
          setAttendees(
            j.data.guest.guests.map((g: { name: string; attendeeType: string; email: string | null }) => ({
              name: g.name,
              attendeeType: g.attendeeType as "ADULT" | "CHILD",
              email: g.email ?? "",
            })),
          );
        }
      });
  }, [slug, token, preview]);

  const submit = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const answerPayload = event.questions.map((q) => {
        const val = answers[q.id];
        if (q.type === "MULTIPLE_CHOICE") return { questionId: q.id, optionIds: val as string[] };
        if (["SINGLE_CHOICE", "SELECT"].includes(q.type)) return { questionId: q.id, optionId: val as string };
        if (q.type === "YES_NO") return { questionId: q.id, boolValue: val === "yes" };
        if (q.type === "NUMBER") return { questionId: q.id, numberValue: Number(val) };
        return { questionId: q.id, textValue: val as string };
      });

      const endpoint = token ? `/api/public/rsvp/${token}` : "/api/public/rsvp";
      const designBlocksForSubmit = parseDesignContent(event.design?.content).blocks as DesignBlock[];
      const rsvpBlockForSubmit = designBlocksForSubmit.find((b) => b.type === "rsvp");
      const responseOpts = enabledResponseOptions(
        (rsvpBlockForSubmit?.data ?? {}) as Record<string, unknown>,
        event.customTheme?.locale === "en" ? "en" : "uk",
      );
      const apiResponse =
        responseOpts.find((o) => o.id === response)?.value ??
        responseOpts.find((o) => o.value === response)?.value ??
        (["ATTENDING", "NOT_ATTENDING", "MAYBE"].includes(response)
          ? response
          : responseOpts[0]?.value ?? "ATTENDING");

      const body = token
        ? { response: apiResponse, message, email: attendees[0]?.email, attendees, answers: answerPayload }
        : { slug, response: apiResponse, message, email: attendees[0]?.email, attendees, answers: answerPayload };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return <InviteLoadingScreen />;
  }

  const ctx = resolveInviteContext(event, event.guest ?? null);
  const designBlocks = parseDesignContent(event.design?.content).blocks as DesignBlock[];
  const useBlockDesign = designBlocks.length > 0;
  const layoutProps = {
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
    onSubmit: submit,
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: ctx.theme.backgroundColor }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard opacity={0.95} className="max-w-md p-10 text-center">
            <h2 className="text-2xl font-bold" style={{ fontFamily: ctx.theme.serifFontFamily, color: ctx.theme.textColor }}>
              {ctx.theme.locale === "uk" ? "Дякуємо!" : "Thank you!"}
            </h2>
            <p className="mt-2 opacity-70" style={{ color: ctx.theme.textColor }}>
              {ctx.theme.locale === "uk" ? "Вашу відповідь записано." : "Your RSVP has been recorded."}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const envelopeSettings =
    ctx.theme.envelopeIntro ??
    (event.customTheme as { envelopeIntro?: typeof ctx.theme.envelopeIntro } | null)?.envelopeIntro;
  const showEnvelope = isEnvelopeIntroEnabled(envelopeSettings) && !envelopeOpened;

  if (showEnvelope) {
    return (
      <EnvelopeIntroScreen
        theme={ctx.theme}
        monogram={ctx.monogram}
        settings={envelopeSettings}
        musicUrl={event.backgroundMusicUrl}
        onOpen={() => setEnvelopeOpened(true)}
      />
    );
  }

  if (useBlockDesign) {
    const contentBlocks = designBlocks.filter((b) => b.type !== "rsvp");
    const rsvpBlock = designBlocks.find((b) => b.type === "rsvp") ?? null;

    return (
      <div className="min-h-screen" style={{ backgroundColor: ctx.theme.backgroundColor }}>
        <BlockLayout event={event} ctx={ctx} blocks={contentBlocks} />
        {rsvpBlock && <RsvpSection {...layoutProps} block={rsvpBlock} />}
      </div>
    );
  }

  return (
    <InviteLayoutRenderer {...layoutProps} />
  );
}
