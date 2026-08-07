-- Add placeholder + default answer columns for RSVP questions
-- Run via: npx prisma db push
-- Or apply manually in Neon SQL editor:

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "placeholder" TEXT;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "default_value" TEXT;
