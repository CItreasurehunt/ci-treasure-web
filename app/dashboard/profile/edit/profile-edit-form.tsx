"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, type ProfileUpdateData } from "./actions";
import { CONTINENT_COUNTRIES } from "@/lib/continents";
import { getCountryLabel } from "@/lib/events";

const inputClassName =
  "w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-(--color-pine)";

type ProfileRow = {
  name: string;
  slug: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  telegram: string | null;
  newsletter: string | null;
  public_email: string | null;
};

export function ProfileEditForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ProfileUpdateData>({
    bio: profile.bio || "",
    city: profile.city || "",
    country: profile.country || "",
    website: profile.website || "",
    facebook: profile.facebook || "",
    instagram: profile.instagram || "",
    youtube: profile.youtube || "",
    telegram: profile.telegram || "",
    newsletter: profile.newsletter || "",
    public_email: profile.public_email || "",
  });

  const allCountries = Object.values(CONTINENT_COUNTRIES).flat().sort((a, b) =>
    getCountryLabel(a).localeCompare(getCountryLabel(b))
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile(form);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || "Failed to update profile");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Basic Info</h3>
        <div className="mt-4 space-y-4">
          <Field label="Name">
            <input
              value={profile.name}
              disabled
              className={`${inputClassName} bg-slate-50 text-slate-500 cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-slate-500">
              To update your name, contact us at <a href="mailto:hello@citreasurehunt.com" className="underline">hello@citreasurehunt.com</a>.
            </p>
          </Field>
          <Field label="Bio">
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className={`${inputClassName} min-h-32`}
              placeholder="Tell us about yourself..."
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City">
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className={inputClassName}
                placeholder="e.g. Berlin"
              />
            </Field>
            <Field label="Country">
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className={inputClassName}
              >
                <option value="">Select a country</option>
                {allCountries.map(code => (
                  <option key={code} value={code}>
                    {getCountryLabel(code)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contact & Social</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Public Email">
            <input
              type="email"
              name="public_email"
              value={form.public_email}
              onChange={handleChange}
              className={inputClassName}
              placeholder="hello@example.com"
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://..."
            />
          </Field>
          <Field label="Facebook">
            <input
              type="url"
              name="facebook"
              value={form.facebook}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="Instagram">
            <input
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              className={inputClassName}
              placeholder="@handle or URL"
            />
          </Field>
          <Field label="YouTube">
            <input
              type="url"
              name="youtube"
              value={form.youtube}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://youtube.com/..."
            />
          </Field>
          <Field label="Telegram">
            <input
              name="telegram"
              value={form.telegram}
              onChange={handleChange}
              className={inputClassName}
              placeholder="@handle or URL"
            />
          </Field>
          <Field label="Newsletter">
            <input
              type="url"
              name="newsletter"
              value={form.newsletter}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://..."
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-sm font-medium text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-100">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm font-medium text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            Profile updated successfully!
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-(--color-ink) px-8 py-3 text-sm font-semibold text-(--color-cream) shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-full border border-(--color-sand-strong) px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
