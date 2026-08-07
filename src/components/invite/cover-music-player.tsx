"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

import { getSharedInviteAudio, startSharedInviteAudio } from "@/lib/invite/shared-invite-audio";

export type MusicPlayerStyle = "overlay" | "pill" | "disc";

export interface CoverMusicPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  style?: MusicPlayerStyle;
  loop?: boolean;
  /** Try to start playback on mount (public invite). Falls back to first tap if blocked. */
  autoPlay?: boolean;
  className?: string;
  /** When true, pointer events on controls still work but outer drag can capture move. */
  compact?: boolean;
}

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useAudioPlayer(src: string, loop: boolean, autoPlay: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopOn, setLoopOn] = useState(loop);

  useEffect(() => {
    const audio = getSharedInviteAudio(src, loopOn);
    audioRef.current = audio;
    setPlaying(!audio.paused);
    setCurrent(audio.currentTime);
    setDuration(audio.duration || 0);

    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (!audio.loop) setPlaying(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    let unlockCleanup: (() => void) | undefined;

    const tryPlay = () =>
      startSharedInviteAudio(src, loopOn).then((el) => {
        if (el && !el.paused) {
          el.muted = false;
          unlockCleanup?.();
          unlockCleanup = undefined;
        }
      });

    if (autoPlay) {
      if (audio.paused) {
        void tryPlay();
      } else {
        audio.muted = false;
      }
      // Unmute / start on first gesture if autoplay was blocked or stayed muted.
      const unlock = () => {
        audio.muted = false;
        if (!audio.paused) {
          unlockCleanup?.();
          unlockCleanup = undefined;
          return;
        }
        void tryPlay();
      };
      const opts = { capture: true } as const;
      window.addEventListener("pointerdown", unlock, opts);
      window.addEventListener("touchstart", unlock, opts);
      window.addEventListener("keydown", unlock, opts);
      unlockCleanup = () => {
        window.removeEventListener("pointerdown", unlock, opts);
        window.removeEventListener("touchstart", unlock, opts);
        window.removeEventListener("keydown", unlock, opts);
      };
    }

    return () => {
      unlockCleanup?.();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      // Keep shared audio playing across envelope → invite transition.
      audioRef.current = null;
    };
  }, [src, autoPlay]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loopOn;
  }, [loopOn]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.muted = false;
      void audio.play().catch(() => setPlaying(false));
    } else audio.pause();
  };

  const seek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.min(duration, Math.max(0, ratio * duration));
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
  };

  return {
    playing,
    current,
    duration,
    loopOn,
    setLoopOn,
    toggle,
    seek,
    restart,
    progress: duration > 0 ? current / duration : 0,
  };
}

function Scrubber({
  progress,
  onSeek,
  light,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
  light?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      className={cn("relative h-5 w-full cursor-pointer touch-none py-2", light ? "text-white" : "text-foreground")}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        handlePointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        e.stopPropagation();
        handlePointer(e.clientX);
      }}
    >
      <div className={cn("h-0.5 w-full rounded-full", light ? "bg-white/40" : "bg-foreground/20")}>
        <div
          className={cn("relative h-full rounded-full", light ? "bg-white" : "bg-foreground")}
          style={{ width: `${progress * 100}%` }}
        >
          <span
            className={cn(
              "absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full",
              light ? "bg-white" : "bg-foreground",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function OverlayPlayer({
  title,
  artist,
  playing,
  progress,
  loopOn,
  onToggle,
  onSeek,
  onRestart,
  onToggleLoop,
  className,
}: {
  title: string;
  artist: string;
  playing: boolean;
  progress: number;
  loopOn: boolean;
  onToggle: () => void;
  onSeek: (r: number) => void;
  onRestart: () => void;
  onToggleLoop: () => void;
  className?: string;
}) {
  return (
    <div className={cn("w-[min(100%,18rem)] select-none text-center text-white drop-shadow-md", className)}>
      <p className="truncate text-base font-semibold tracking-tight">{title}</p>
      {artist ? <p className="mt-0.5 truncate text-sm font-normal text-white/90">{artist}</p> : null}
      <div className="mt-3 px-1">
        <Scrubber progress={progress} onSeek={onSeek} light />
      </div>
      <div
        className="mt-1 flex items-center justify-center gap-5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="opacity-40" disabled aria-label="Shuffle" tabIndex={-1}>
          <Shuffle className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRestart} aria-label="На початок" className="opacity-90 hover:opacity-100">
          <SkipBack className="h-5 w-5 fill-white" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Пауза" : "Грати"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black"
        >
          {playing ? <Pause className="h-5 w-5 fill-black" /> : <Play className="ml-0.5 h-5 w-5 fill-black" />}
        </button>
        <button type="button" className="opacity-40" disabled aria-label="Далі" tabIndex={-1}>
          <SkipForward className="h-5 w-5 fill-white" />
        </button>
        <button
          type="button"
          onClick={onToggleLoop}
          aria-label="Повтор"
          className={cn("opacity-90 hover:opacity-100", loopOn && "text-white")}
        >
          <Repeat className={cn("h-4 w-4", loopOn && "drop-shadow-[0_0_4px_white]")} />
        </button>
      </div>
    </div>
  );
}

function PillPlayer({
  title,
  playing,
  progress,
  current,
  duration,
  onToggle,
  onSeek,
  className,
}: {
  title: string;
  playing: boolean;
  progress: number;
  current: number;
  duration: number;
  onToggle: () => void;
  onSeek: (r: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-[min(100%,17rem)] items-center gap-2 rounded-full bg-black/45 px-2 py-1.5 text-white backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={playing ? "Пауза" : "Грати"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black"
      >
        {playing ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-black" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <span className="shrink-0 text-[9px] tabular-nums text-white/70">{formatTime(current)}</span>
          <div className="min-w-0 flex-1">
            <Scrubber progress={progress} onSeek={onSeek} light />
          </div>
          <span className="shrink-0 text-[9px] tabular-nums text-white/70">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function DiscPlayer({
  title,
  artist,
  playing,
  onToggle,
  className,
}: {
  title: string;
  artist: string;
  playing: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-[7.5rem] flex-col items-center gap-2 text-white", className)}>
      <button
        type="button"
        onClick={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={playing ? "Пауза" : "Грати"}
        className="relative h-24 w-24 rounded-full shadow-lg"
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#1a1a1a_0deg,#3a3a3a_40deg,#1a1a1a_80deg,#4a4a4a_140deg,#1a1a1a_200deg,#2a2a2a_280deg,#1a1a1a_360deg)]",
            playing && "animate-[spin_8s_linear_infinite]",
          )}
        />
        <span className="absolute inset-[28%] rounded-full bg-neutral-800 ring-2 ring-white/20" />
        <span className="absolute inset-0 flex items-center justify-center">
          {playing ? (
            <Pause className="h-5 w-5 fill-white text-white drop-shadow" />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-white text-white drop-shadow" />
          )}
        </span>
      </button>
      <div className="w-full text-center drop-shadow-md">
        <p className="truncate text-xs font-semibold">{title}</p>
        {artist ? <p className="truncate text-[10px] text-white/85">{artist}</p> : null}
      </div>
    </div>
  );
}

export function CoverMusicPlayer({
  src,
  title = "Музика",
  artist = "",
  style = "overlay",
  loop = true,
  autoPlay = false,
  className,
}: CoverMusicPlayerProps) {
  const player = useAudioPlayer(src, loop, autoPlay);
  const displayTitle = title.trim() || "Музика";
  const displayArtist = artist.trim();

  if (style === "pill") {
    return (
      <PillPlayer
        title={displayTitle}
        playing={player.playing}
        progress={player.progress}
        current={player.current}
        duration={player.duration}
        onToggle={player.toggle}
        onSeek={player.seek}
        className={className}
      />
    );
  }

  if (style === "disc") {
    return (
      <DiscPlayer
        title={displayTitle}
        artist={displayArtist}
        playing={player.playing}
        onToggle={player.toggle}
        className={className}
      />
    );
  }

  return (
    <OverlayPlayer
      title={displayTitle}
      artist={displayArtist}
      playing={player.playing}
      progress={player.progress}
      loopOn={player.loopOn}
      onToggle={player.toggle}
      onSeek={player.seek}
      onRestart={player.restart}
      onToggleLoop={() => player.setLoopOn((v) => !v)}
      className={className}
    />
  );
}

/** Resolve music drag offset from hero block data. */
export function resolveMusicOffset(data: Record<string, unknown>): { x: number; y: number } {
  const ox = data.musicOffsetX;
  const oy = data.musicOffsetY;
  if (typeof ox === "number" && typeof oy === "number") {
    return {
      x: Math.min(100, Math.max(0, ox)),
      y: Math.min(100, Math.max(0, oy)),
    };
  }
  return { x: 50, y: 75 };
}

export function parseMusicPlayerStyle(raw: unknown): MusicPlayerStyle {
  if (raw === "pill" || raw === "disc" || raw === "overlay") return raw;
  return "overlay";
}
