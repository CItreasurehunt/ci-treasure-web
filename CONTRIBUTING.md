# Contributing to CI Treasure Hunt

CI Treasure Hunt is a global directory of Contact Improvisation events, communities, venues, and teachers. The code is public for transparency and because the CI community is small and friendly.

Bug reports and small fixes are welcome. For larger changes, open an issue first — the project has a specific direction and not all contributions will fit.

---

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/CItreasurehunt/ci-treasure-web
cd ci-treasure-web
npm install
```

Create `.env.local` — you'll need a Supabase URL and anon key. Open a GitHub issue to request read-only access for local development.

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
app/                  Next.js App Router pages
  events/             Public event calendar
  communities/        Community directory
  teachers/           Teacher profiles
  admin/              Admin dashboard (auth required)
components/           Shared UI components
lib/
  supabase.ts         Supabase client (browser + server)
  airtable.ts         Airtable client (communities data)
supabase/
  migrations/         Database schema (PostgreSQL)
```

**Key conventions:**
- Tailwind v4: use `bg-(--color-name)` not `bg-[--color-name]` for CSS variable references
- Server components fetch directly; client components use `"use client"` + props passed down
- Admin routes use the Supabase service role key (not committed — set in deployment env vars)

---

## Community data and private links

CI communities often use Telegram, WhatsApp, and Signal groups with private invite links. Direct join links are intentionally hidden on the public website to reduce spam — access is available after joining the main [CI Treasure Hunt Telegram group](https://t.me/citreasurehunt).

Never expose raw invite links in public-facing UI.
