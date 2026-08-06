export function isValidImageSrc(src: string | null | undefined): src is string {
  if (!src?.trim()) return false;
  const trimmed = src.trim();
  if (trimmed.startsWith("/")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
