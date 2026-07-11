"use client";

import { useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { removeTeacher } from "@/app/events/[eventSlug]/edit/actions";

export function RemoveMeButton({ eventId, teacherId }: { eventId: string; teacherId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm("Are you sure you want to remove yourself from this event?")) return;
    startTransition(async () => {
      const result = await removeTeacher(eventId, teacherId);
      if (!result.success) {
        alert(result.error ?? "Failed to remove yourself from event");
      }
    });
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      title="Remove me from this event"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      Remove me
    </button>
  );
}
