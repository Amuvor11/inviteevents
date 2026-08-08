"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { QUESTION_TYPE_LABELS } from "@/lib/i18n/uk";

type Question = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: { id: string; label: string }[];
};

function SortableQuestion({ question, onDelete }: { question: Question; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
    <Card>
      <CardHeader className="flex flex-row items-start gap-2 pb-2">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <CardTitle className="text-base">{question.title}</CardTitle>
          <div className="mt-1 flex gap-2">
            <Badge variant="outline">{QUESTION_TYPE_LABELS[question.type] ?? question.type}</Badge>
            {question.required && <Badge variant="warning">Обов&apos;язкове</Badge>}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onDelete(question.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      {question.options.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {question.options.map((o) => (
              <Badge key={o.id} variant="outline">{o.label}</Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
    </div>
  );
}

export default function QuestionsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("SINGLE_CHOICE");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = () => {
    fetch(`/api/events/${eventId}/questions`).then((r) => r.json()).then((j) => setQuestions(j.data ?? []));
  };

  useEffect(() => { load(); }, [eventId]);

  const addQuestion = async () => {
    const choiceTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];
    await fetch(`/api/events/${eventId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        required,
        options: choiceTypes.includes(type)
          ? options.filter(Boolean).map((label) => ({ label }))
          : undefined,
      }),
    });
    setTitle("");
    setOptions(["", ""]);
    load();
  };

  const deleteQuestion = async (id: string) => {
    await fetch(`/api/events/${eventId}/questions/${id}`, { method: "DELETE" });
    load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reordered);
    await fetch(`/api/events/${eventId}/questions/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((q) => q.id) }),
    });
  };

  const choiceTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELECT"];

  return (
    <DashboardShell title="Опитування">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">Конструктор опитування</h2>

      <Card className="mb-6">
        <CardHeader><CardTitle>Додати питання</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Питання</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Чи бажаєте ви виголосити тост?" /></div>
          <div>
            <Label>Тип</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {["TEXT", "TEXTAREA", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "YES_NO", "NUMBER", "SELECT"].map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABELS[t] ?? t}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Обов&apos;язкове
          </label>
          {choiceTypes.includes(type) && (
            <div className="space-y-2">
              <Label>Варіанти</Label>
              {options.map((opt, i) => (
                <Input key={i} value={opt} placeholder={`Варіант ${i + 1}`} onChange={(e) => {
                  const next = [...options]; next[i] = e.target.value; setOptions(next);
                }} />
              ))}
              <Button size="sm" variant="outline" onClick={() => setOptions([...options, ""])}>
                <Plus className="h-3 w-3" /> Додати варіант
              </Button>
            </div>
          )}
          <Button onClick={addQuestion} disabled={!title}>Додати питання</Button>
        </CardContent>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Ще немає питань</CardContent></Card>
            ) : questions.map((q) => (
              <SortableQuestion key={q.id} question={q} onDelete={deleteQuestion} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </DashboardShell>
  );
}
