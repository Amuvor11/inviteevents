import { prisma } from "@/lib/prisma";

export async function listTemplates() {
  return prisma.template.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTemplateById(templateId: string) {
  return prisma.template.findUnique({
    where: { id: templateId, isActive: true },
    include: { category: true },
  });
}

export async function getTemplateBySlug(slug: string) {
  return prisma.template.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  });
}
