# InviteEvents

Beautiful online event invitations built with Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Firebase Auth, and Cloudinary.

## Features

- Landing page with features, templates, FAQ
- Google & Apple authentication (Firebase)
- Event creation with 6 invitation templates
- Guest groups with adult/child attendee tracking
- Custom survey builder (7 question types, drag-and-drop reorder)
- Public invitation pages with countdown, gallery, RSVP
- Dashboard analytics with Recharts
- CSV guest export
- Dark/light mode

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — PostgreSQL connection string
- Firebase client & admin credentials
- Cloudinary credentials
- `NEXT_PUBLIC_APP_URL`

### 3. Set up database

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # UI components
├── hooks/            # Client hooks (auth)
├── lib/              # Utilities, Firebase, Cloudinary, Prisma
├── services/         # Business logic
├── types/            # TypeScript types
└── validations/      # Zod schemas
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Template seed data
```

## Guest Group Model

One RSVP can represent multiple attendees (families, couples, groups):

- **GuestGroup** — RSVP unit with invite token
- **Guest** — Individual attendee (Adult/Child)
- **GuestResponse** — Attendance status for the group

Dashboard counts people, not just RSVP records.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed templates |
| `npm run db:studio` | Open Prisma Studio |
