import { prisma } from "@/lib/prisma";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueEventSlug(title: string, eventType?: string): Promise<string> {
  const base = slugify(eventType ? `${title}-${eventType}` : title) || "event";
  let slug = base;
  let counter = 1;

  while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
