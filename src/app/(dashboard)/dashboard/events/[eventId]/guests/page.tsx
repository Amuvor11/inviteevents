"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { GuestPersonalizationPanel } from "@/components/dashboard/guest-personalization-panel";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Link2, Plus, Search, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  RSVP_STATUS_LABELS,
  INVITE_STATUS_LABELS,
  ATTENDEE_TYPE_LABELS,
  GUEST_FILTER_LABELS,
} from "@/lib/i18n/uk";
import type { GuestGroupPersonalization } from "@/types/personalization";

type GuestGroup = {
  id: string;
  groupName: string | null;
  inviteToken: string;
  inviteStatus: string;
  sentAt: string | null;
  openedAt: string | null;
  personalization: GuestGroupPersonalization | null;
  guests: { id: string; name: string; email: string | null; phone: string | null; attendeeType: string; isPrimary: boolean }[];
  response: { response: string; message: string | null; respondedAt: string } | null;
};

export default function GuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [eventSlug, setEventSlug] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState([{ name: "", attendeeType: "ADULT", email: "", isPrimary: true }]);

  const load = () => {
    fetch(`/api/events/${eventId}/guest-groups`).then((r) => r.json()).then((j) => setGroups(j.data ?? []));
  };

  useEffect(() => {
    load();
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then((j) => {
      if (j.data?.slug) setEventSlug(j.data.slug);
    });
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin);
  }, [eventId]);

  const inviteLink = (token: string) => `${appUrl}/invite/${eventSlug}?token=${token}`;

  const copyLink = async (group: GuestGroup) => {
    await navigator.clipboard.writeText(inviteLink(group.inviteToken));
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
    await fetch(`/api/events/${eventId}/guest-groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markSent: true }),
    });
    load();
  };

  const filtered = groups.filter((g) => {
    if (filter !== "ALL") {
      if (filter === "NO_RESPONSE" && g.response) return false;
      if (filter !== "NO_RESPONSE" && g.response?.response !== filter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return g.groupName?.toLowerCase().includes(q) || g.guests.some((guest) => guest.name.toLowerCase().includes(q));
    }
    return true;
  });

  const addGroup = async () => {
    await fetch(`/api/events/${eventId}/guest-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendees }),
    });
    setShowForm(false);
    setAttendees([{ name: "", attendeeType: "ADULT", email: "", isPrimary: true }]);
    load();
  };

  const addAttendeeRow = () => {
    setAttendees([...attendees, { name: "", attendeeType: "ADULT", email: "", isPrimary: false }]);
  };

  return (
    <DashboardShell title="Гості">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 dark:border-border">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Керування гостями</h2>
          <p className="mt-1 text-sm text-muted-foreground">Кожен гість отримує персональне посилання на запрошення</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/events/${eventId}/guest-groups?format=csv`}>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Експорт CSV</Button>
          </a>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" /> Додати групу
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "ATTENDING", "NOT_ATTENDING", "MAYBE", "NO_RESPONSE"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "primary" : "outline"} onClick={() => setFilter(f)}>
            {GUEST_FILTER_LABELS[f] ?? f}
          </Button>
        ))}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Пошук гостей..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Додати групу гостей</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {attendees.map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-4">
                <Input placeholder="Ім'я" value={a.name} onChange={(e) => {
                  const next = [...attendees]; next[i].name = e.target.value; setAttendees(next);
                }} />
                <Select value={a.attendeeType} onChange={(e) => {
                  const next = [...attendees]; next[i].attendeeType = e.target.value; setAttendees(next);
                }}>
                  <option value="ADULT">{ATTENDEE_TYPE_LABELS.ADULT}</option>
                  <option value="CHILD">{ATTENDEE_TYPE_LABELS.CHILD}</option>
                </Select>
                <Input placeholder="Email (лише для основного)" value={a.email} onChange={(e) => {
                  const next = [...attendees]; next[i].email = e.target.value; setAttendees(next);
                }} />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addAttendeeRow}>+ Додати учасника</Button>
              <Button size="sm" onClick={addGroup}>Зберегти групу</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Гостей не знайдено</CardContent></Card>
        ) : filtered.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-base">
                  {group.groupName ?? group.guests.find((g) => g.isPrimary)?.name ?? "Група гостей"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{group.guests.length} учасник(ів)</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline">{INVITE_STATUS_LABELS[group.inviteStatus] ?? group.inviteStatus}</Badge>
                  {group.personalization?.customGreeting && <Badge variant="outline">Особливе привітання</Badge>}
                  {group.personalization?.personalMessage && <Badge variant="outline">Особисте повідомлення</Badge>}
                  {(group.personalization?.hiddenSections?.length ?? 0) > 0 && (
                    <Badge variant="outline">{group.personalization!.hiddenSections!.length} прихованих розділів</Badge>
                  )}
                </div>
              </div>
              <Badge variant={group.response?.response === "ATTENDING" ? "success" : group.response ? "outline" : "warning"}>
                {group.response?.response ? (RSVP_STATUS_LABELS[group.response.response] ?? group.response.response) : RSVP_STATUS_LABELS.NO_RESPONSE}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.guests.map((guest) => (
                  <div key={guest.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{guest.name}</span>
                    <Badge variant="outline">{ATTENDEE_TYPE_LABELS[guest.attendeeType] ?? guest.attendeeType}</Badge>
                    {guest.isPrimary && <Badge>Основний</Badge>}
                    {guest.email && <span className="text-muted-foreground">{guest.email}</span>}
                  </div>
                ))}
              </div>

              {eventSlug && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(group)}>
                    {copiedId === group.id ? (
                      <>Скопійовано!</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Копіювати персональне посилання</>
                    )}
                  </Button>
                  <a href={inviteLink(group.inviteToken)} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><Link2 className="h-4 w-4" /> Перегляд</Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingGroupId(editingGroupId === group.id ? null : group.id)}
                  >
                    <Settings2 className="h-4 w-4" />
                    {editingGroupId === group.id ? "Закрити" : "Персоналізувати"}
                  </Button>
                </div>
              )}

              {editingGroupId === group.id && (
                <GuestPersonalizationPanel
                  groupId={group.id}
                  eventId={eventId}
                  initial={group.personalization}
                  onSaved={load}
                  onClose={() => setEditingGroupId(null)}
                />
              )}

              {group.response && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {group.response.message && `"${group.response.message}" · `}
                  Відповіли {format(new Date(group.response.respondedAt), "PPp", { locale: uk })}
                </p>
              )}
              {group.openedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Відкрито {format(new Date(group.openedAt), "PPp", { locale: uk })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
