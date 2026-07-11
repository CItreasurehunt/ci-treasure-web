import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export default function AdminForbiddenPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f0e5_0%,_#fffdf8_45%,_#fffaf2_100%)] px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">403</p>
        <h1 className="mt-3 font-serif text-4xl text-slate-950">Admin access required</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          This signed-in account is not allowed to access the admin area. Sign out and log in with the
          configured admin email, or head to your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)"
            >
              Sign out
            </button>
          </form>
          <Link href="/dashboard" className="rounded-full border border-(--color-sand-strong) px-5 py-3 text-sm font-semibold text-slate-800">
            My dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
