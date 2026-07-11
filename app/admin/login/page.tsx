import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  // Default to /dashboard, not /admin/events — the middleware already injects an
  // explicit next=/admin/events when a logged-out admin is redirected here from an
  // admin subpage (proxy.ts). This bare default only fires when /admin/login is
  // visited directly with no next param, which should be safe for non-admins too
  // (see safeNext() in auth/confirm/route.ts — same reasoning, kept in sync).
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email) {
    redirect(`/admin/login?error=${encodeURIComponent("Enter an email address.")}&next=${encodeURIComponent(next)}`);
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/admin/login?sent=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; sent?: string; email?: string; error?: string }>;
}) {
  const adminUser = await getAdminUser();
  if (adminUser) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f0e5_0%,_#fffdf8_45%,_#fffaf2_100%)] px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
          <h1 className="font-serif text-4xl text-slate-950">Admin already signed in</h1>
          <p className="mt-4 text-base leading-7 text-slate-700">You are signed in as {adminUser.email}.</p>
          <div className="mt-6">
            <Link href="/admin/events" className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)">
              Open admin events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const params = (await searchParams) ?? {};
  // Same reasoning as the default in sendMagicLink above — /dashboard, not /admin/events.
  const next = params.next ?? "/dashboard";
  const sentEmail = params.sent === "1" ? params.email ?? "" : "";
  const errorMessage = params.error ?? "";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f0e5_0%,_#fffdf8_45%,_#fffaf2_100%)] px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Admin login</p>
        <h1 className="mt-3 font-serif text-4xl text-slate-950">Magic link only</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Enter the configured admin email. Supabase will send a magic link, and after you open it you will land in the admin area.
        </p>
        {sentEmail ? <p className="mt-4 text-sm text-emerald-700">Magic link sent to {sentEmail}.</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}

        <form action={sendMagicLink} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-base text-slate-950 outline-none ring-0 transition focus:border-(--color-pine)"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)"
          >
            Send magic link
          </button>
        </form>
      </div>
    </main>
  );
}
