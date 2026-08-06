import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  { name: "Classic", slug: "classic", layout: "classic", thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400", structure: { version: 1 } },
  { name: "Minimal", slug: "minimal", layout: "minimal", thumbnailUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400", structure: { version: 1 } },
  { name: "Elegant", slug: "elegant", layout: "elegant", thumbnailUrl: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400", structure: { version: 1 } },
  { name: "Romantic", slug: "romantic", layout: "romantic", thumbnailUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400", structure: { version: 1 } },
  { name: "Modern", slug: "modern", layout: "modern", thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400", structure: { version: 1 } },
  { name: "Kids Party", slug: "kids-party", layout: "kids", thumbnailUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400", structure: { version: 1 } },
];

async function main() {
  const category = await prisma.templateCategory.upsert({
    where: { slug: "general" },
    create: { name: "General", slug: "general", description: "All event types" },
    update: {},
  });

  for (const [i, t] of templates.entries()) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      create: {
        categoryId: category.id,
        name: t.name,
        slug: t.slug,
        layout: t.layout,
        thumbnailUrl: t.thumbnailUrl,
        structure: t.structure,
        sortOrder: i,
      },
      update: { name: t.name, layout: t.layout, thumbnailUrl: t.thumbnailUrl },
    });
  }

  console.log("Seed completed:", templates.length, "templates");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
