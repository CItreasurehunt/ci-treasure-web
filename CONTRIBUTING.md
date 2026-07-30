# Contributing to CI Treasure Hunt

CI Treasure Hunt is a global directory of Contact Improvisation events, communities, venues, and teachers.

Bug reports and small fixes are welcome. For larger changes, open an issue first, the project has a specific direction and not all contributions will fit.

---

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/ci-treasure-hunt/ci-treasure-web
cd ci-treasure-web
npm install
```

Create `.env.local` with a Supabase URL and anon key.

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
supabase/
  migrations/         Database schema (PostgreSQL)
```

**Key conventions:**
- Tailwind v4: use `bg-(--color-name)` not `bg-[--color-name]` for CSS variable references
- Server components fetch directly; client components use `"use client"` + props passed down
- Admin routes use the Supabase service role key (set in deployment env vars)

---

## Community data and private links

CI communities often use Telegram, WhatsApp, Signal, and LINE groups with private invite links. Direct invite links are revealed in the public UI, but only after the visitor passes a Cloudflare Turnstile challenge (see `components/invite-buttons.tsx`, `lib/invite-links-action.ts`). This limits scraping and spam while keeping links a normal part of the page. Don't bypass or remove the Turnstile gate when touching this flow.
