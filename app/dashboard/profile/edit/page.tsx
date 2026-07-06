import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/dashboard/profile/edit");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e5_0%,#fffdf8_45%,#fffaf2_100%)] px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-medium text-(--color-pine) hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Profile</p>
          <h1 className="mt-2 font-serif text-4xl text-slate-950">Edit profile</h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Keep your public profile up to date. Changes are saved immediately.
          </p>
        </div>
        <div className="mt-8">
          <ProfileEditForm profile={profile} />
        </div>
      </div>
    </main>
  );
}
