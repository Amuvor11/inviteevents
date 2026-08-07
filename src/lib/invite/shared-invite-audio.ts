/** Shared HTMLAudioElement so music survives envelope → invite transition. */

let shared: HTMLAudioElement | null = null;
let sharedSrc = "";

export function getSharedInviteAudio(src: string, loop = true): HTMLAudioElement {
  const normalized = src.trim();
  if (shared && sharedSrc === normalized) {
    shared.loop = loop;
    return shared;
  }
  if (shared) {
    shared.pause();
    shared.src = "";
  }
  shared = new Audio(normalized);
  shared.preload = "auto";
  shared.loop = loop;
  sharedSrc = normalized;
  return shared;
}

export function playSharedInviteAudio(
  src: string,
  options?: { muted?: boolean; loop?: boolean },
): Promise<HTMLAudioElement> {
  const audio = getSharedInviteAudio(src, options?.loop ?? true);
  if (typeof options?.muted === "boolean") {
    audio.muted = options.muted;
  }
  return audio.play().then(() => audio);
}

/** Try unmuted play; if blocked, muted play then unmute (best-effort). */
export async function startSharedInviteAudio(src: string, loop = true): Promise<HTMLAudioElement | null> {
  if (!src.trim()) return null;
  const audio = getSharedInviteAudio(src, loop);
  try {
    audio.muted = false;
    await audio.play();
    return audio;
  } catch {
    try {
      audio.muted = true;
      await audio.play();
      audio.muted = false;
      return audio;
    } catch {
      return audio;
    }
  }
}

export function isSharedInviteAudioPlaying(src?: string): boolean {
  if (!shared || shared.paused) return false;
  if (src && sharedSrc !== src.trim()) return false;
  return true;
}
