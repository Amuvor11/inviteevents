"use client";

import { useRef, useState } from "react";
import { Loader2, Music, Upload, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/lib/cloudinary/client-upload";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

interface AudioUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  eventId: string;
  folder?: string;
}

export function AudioUploadField({
  label = "Музика",
  value,
  onChange,
  eventId,
  folder = "music",
}: AudioUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|ogg|wav|aac)$/i.test(file.name)) {
      setError("Оберіть аудіофайл (MP3, M4A, OGG, WAV)");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Максимальний розмір файлу — 15 МБ");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(file, eventId, folder, "video");
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="space-y-2 rounded-lg border border-border bg-background p-2">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
            <audio src={value} controls className="h-8 w-full min-w-0" preload="metadata" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Видалити музику"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.ogg,.wav,.aac"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-1.5"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Завантаження…" : "Завантажити файл"}
        </Button>
      </div>

      <div>
        <p className="mb-1 text-[11px] text-muted-foreground">або вставте URL</p>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="h-8 text-xs"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
