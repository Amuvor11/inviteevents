"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardShell } from "@/components/dashboard/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyAnalyticsSummary } from "@/types";

const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [summary, setSummary] = useState<SurveyAnalyticsSummary | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}/survey/analytics`)
      .then((r) => r.json())
      .then((j) => setSummary(j.data ?? null));
  }, [eventId]);

  const analytics = summary?.questions ?? [];

  return (
    <DashboardShell title="Аналітика">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">Аналітика опитування</h2>

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{summary.totalQuestions}</p><p className="text-sm text-muted-foreground">Питань</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{summary.totalEligibleGroups}</p><p className="text-sm text-muted-foreground">RSVP-груп</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{analytics.length}</p><p className="text-sm text-muted-foreground">Відстежуваних питань</p></CardContent></Card>
        </div>
      )}

      {analytics.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Ще немає даних опитування</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {analytics.map((q) => (
            <Card key={q.questionId}>
              <CardHeader>
                <CardTitle className="text-base">{q.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {q.totalAnswers} відповідей · {q.responseRate}% рівень відповідей
                </p>
              </CardHeader>
              <CardContent>
                {q.optionBreakdown && q.optionBreakdown.length > 0 && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={q.optionBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f06632" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={q.optionBreakdown} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, percentage }) => `${label}: ${percentage}%`}>
                          {q.optionBreakdown.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="lg:col-span-2 space-y-2">
                      {q.optionBreakdown.map((opt) => (
                        <div key={opt.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
                          <span>{opt.label}</span>
                          <span className="font-medium">{opt.count} гостей ({opt.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {q.numberStats && (
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <Stat label="Мін." value={q.numberStats.min} />
                    <Stat label="Макс." value={q.numberStats.max} />
                    <Stat label="Середнє" value={q.numberStats.avg} />
                    <Stat label="Кількість" value={q.numberStats.count} />
                  </div>
                )}
                {q.textResponses && q.textResponses.length > 0 && (
                  <div className="space-y-2">
                    {q.textResponses.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-medium">{r.guestName}</p>
                        <p className="text-muted-foreground">{r.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
