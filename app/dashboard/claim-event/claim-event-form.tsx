"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitEventClaim } from "./actions";

export function ClaimEventForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [role, setRole] = useState<"organizer" | "teacher">("organizer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result = await submitEventClaim(eventId, role);
    setSubmitting(false);
    if (result.success) {
      setDone(true);
      router.refresh();
    } else {
      setError(result.error ?? "Could not submit claim.");
    }
  }

  if (done) {
    return (
      <p className="text-base leading-7 text-slate-700">
        Submitted — an admin will review it. You&apos;ll get an email once it&apos;s approved.
      </p>
    );
  }

  return (
    <div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">I was involved as…</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="role"
            checked={role === "organizer"}
            onChange={() => setRole("organizer")}
            className="h-4 w-4"
          />
          Organizer
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="role"
            checked={role === "teacher"}
            onChange={() => setRole("teacher")}
            className="h-4 w-4"
          />
          Teacher
        </label>
      </fieldset>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-6 rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist) disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit claim"}
      </button>
    </div>
  );
}
