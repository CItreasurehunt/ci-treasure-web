"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitClaim, type ClaimableProfile } from "./actions";

export function ClaimConfirm({ profile }: { profile: ClaimableProfile }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setError(null);
    setSubmitting(true);
    const result = await submitClaim(profile.id);
    setSubmitting(false);
    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error ?? "Could not submit claim.");
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-(--color-sand-strong) bg-white px-5 py-4">
        <p className="font-semibold text-slate-950">{profile.name}</p>
        {profile.roles ? <p className="text-xs uppercase tracking-wide text-(--color-pine)">{profile.roles}</p> : null}
        {profile.bioSnippet ? <p className="mt-1 text-sm text-slate-600">{profile.bioSnippet}…</p> : null}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <button
        type="button"
        onClick={claim}
        disabled={submitting}
        className="mt-6 rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist) disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Yes, this is me"}
      </button>

      <p className="mt-6 text-sm text-slate-600">
        Not you?{" "}
        <Link href="/dashboard/claim" className="font-semibold text-(--color-pine) underline">
          Search instead
        </Link>
        .
      </p>
    </div>
  );
}
