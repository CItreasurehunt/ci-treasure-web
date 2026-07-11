import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

// Find a unique slug (idx_profiles_slug is UNIQUE on lower(slug)).
async function uniqueProfileSlug(admin: ReturnType<typeof createAdminClient>, name: string) {
  const base = slugify(name) || "profile";
  let candidate = base;
  for (let i = 2; i < 100; i += 1) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("slug", candidate)
      .maybeSingle();
    if (!data) {
      return candidate;
    }
    candidate = `${base}-${i}`;
  }
  // Extremely unlikely fallback: suffix with a random token.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

async function createProfile(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/dashboard/new-profile");
  }

  // Guard: one profile per user.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect("/dashboard");
  }

  const name = String(formData.get("name") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const isOrganizer = formData.get("is_organizer") === "on";
  const isTeacher = formData.get("is_teacher") === "on";

  if (!name) {
    redirect(`/dashboard/new-profile?error=${encodeURIComponent("Name is required.")}`);
  }

  // Insert via service role so the slug collision check sees shadow profiles too.
  // user_id is taken from the verified session — never from client input.
  const admin = createAdminClient();
  const slug = await uniqueProfileSlug(admin, name);

  const { error } = await admin.from("profiles").insert({
    name,
    slug,
    website: website || null,
    user_id: user.id,
    visibility: "public",
    source: "self_submitted",
    is_organizer: isOrganizer,
    is_teacher: isTeacher,
    is_trusted: false,
  });

  if (error) {
    redirect(`/dashboard/new-profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/dashboard/new-profile");
  }
  const { data: owned } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (owned) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const errorMessage = params.error ?? "";

  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard/claim" className="text-sm font-medium text-(--color-pine) hover:underline">
          ← Back to search
        </Link>
        <div className="mt-4 rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">New profile</p>
          <h1 className="mt-3 font-serif text-4xl text-slate-950">Create your profile</h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            You&apos;re not listed yet — create a profile so you can submit and manage events. New profiles are
            trusted after your first event is reviewed.
          </p>
          {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}

          <form action={createProfile} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-(--color-pine)"
                placeholder="Your name or organizer name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium text-slate-700">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                className="w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-(--color-pine)"
                placeholder="https://…"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">I am a…</legend>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="is_organizer" className="h-4 w-4" defaultChecked />
                Organizer
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="is_teacher" className="h-4 w-4" />
                Teacher
              </label>
            </fieldset>
            <button
              type="submit"
              className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)"
            >
              Create profile
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
