import type { QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertEventOwner } from "./event.service";
import type { QuestionAnalytics, SurveyAnalyticsSummary } from "@/types/analytics";

const CHOICE_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];

const CHART_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function buildChartData(breakdown: QuestionAnalytics["optionBreakdown"]) {
  return (breakdown ?? []).map((item, i) => ({
    label: item.label,
    count: item.count,
    percentage: item.percentage,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function analyzeQuestion(
  question: {
    id: string;
    title: string;
    type: QuestionType;
    options: { id: string; label: string }[];
  },
  eventId: string,
  totalEligible: number
): Promise<QuestionAnalytics> {
  const answers = await prisma.guestAnswer.findMany({
    where: { questionId: question.id, eventId },
    include: {
      guest: true,
      option: true,
      group: { include: { guests: true } },
    },
  });

  const distinctGroups = new Set(answers.map((a) => a.groupId));
  const totalAnswers = distinctGroups.size;
  const responseRate = totalEligible > 0 ? Math.round((totalAnswers / totalEligible) * 100) : 0;

  const analytics: QuestionAnalytics = {
    questionId: question.id,
    title: question.title,
    type: question.type,
    totalAnswers,
    totalEligible,
    responseRate,
    chartData: [],
  };

  if (CHOICE_TYPES.includes(question.type) || question.type === "YES_NO") {
    if (question.type === "YES_NO") {
      const yes = answers.filter((a) => a.boolValue === true).length;
      const no = answers.filter((a) => a.boolValue === false).length;
      analytics.optionBreakdown = [
        { optionId: null, label: "Yes", count: yes, percentage: totalAnswers ? Math.round((yes / totalAnswers) * 100) : 0 },
        { optionId: null, label: "No", count: no, percentage: totalAnswers ? Math.round((no / totalAnswers) * 100) : 0 },
      ];
    } else {
      analytics.optionBreakdown = question.options.map((option) => {
        const count = answers.filter((a) => a.optionId === option.id).length;
        return {
          optionId: option.id,
          label: option.label,
          count,
          percentage: totalAnswers ? Math.round((count / totalAnswers) * 100) : 0,
        };
      });
    }
    analytics.chartData = buildChartData(analytics.optionBreakdown);
  } else if (question.type === "NUMBER") {
    const values = answers.map((a) => Number(a.numberValue)).filter((v) => !isNaN(v));
    if (values.length) {
      analytics.numberStats = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100,
        count: values.length,
      };
      analytics.chartData = [{ label: "Average", count: analytics.numberStats.avg, percentage: 100 }];
    }
  } else {
    analytics.textResponses = answers
      .filter((a) => a.textValue)
      .slice(0, 100)
      .map((a) => ({
        groupName: a.group.groupName ?? "",
        guestName: a.guest?.name ?? a.group.guests.find((g) => g.isPrimary)?.name ?? "Guest",
        value: a.textValue!,
        respondedAt: a.createdAt.toISOString(),
      }));
    analytics.chartData = [{ label: "Responses", count: totalAnswers, percentage: responseRate }];
  }

  return analytics;
}

export async function getSurveyAnalytics(
  eventId: string,
  userId: string,
  questionId?: string
): Promise<SurveyAnalyticsSummary> {
  await assertEventOwner(eventId, userId);

  const [questions, totalEligibleGroups] = await Promise.all([
    prisma.question.findMany({
      where: { eventId, ...(questionId ? { id: questionId } : {}) },
      include: { options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.guestResponse.count({ where: { eventId } }),
  ]);

  const questionAnalytics = await Promise.all(
    questions.map((q) => analyzeQuestion(q, eventId, totalEligibleGroups))
  );

  return {
    eventId,
    totalQuestions: questions.length,
    totalEligibleGroups,
    questions: questionAnalytics,
  };
}

export async function getQuestionAnalytics(
  eventId: string,
  userId: string,
  questionId: string
): Promise<QuestionAnalytics> {
  const summary = await getSurveyAnalytics(eventId, userId, questionId);
  const question = summary.questions[0];
  if (!question) throw new Error("Question not found");
  return question;
}
