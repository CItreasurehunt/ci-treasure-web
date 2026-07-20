"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { approveEventClaim, rejectEventClaim } from "./actions";

export function EventClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result = action === "approve" ? await approveEventClaim(claimId) : await rejectEventClaim(claimId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Action failed.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("approve")}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reject")}
          className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
