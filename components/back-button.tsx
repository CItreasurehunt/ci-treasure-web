"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  label?: string;
  // Used on the event detail page ("Back to events"): always returns to the
  // events list specifically, rather than wherever the user actually came from
  // (e.g. a venue or teacher page whose event list linked into this event).
  toEventsList?: boolean;
};

export default function BackButton({ label = "Back", toEventsList = false }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window === "undefined") return;
    const lastEventsUrl = sessionStorage.getItem("lastEventsUrl");

    if (toEventsList) {
      const previousPathname = sessionStorage.getItem("previousPathname");
      if (previousPathname === "/") {
        router.back();
      } else {
        router.push(lastEventsUrl ?? "/");
      }
      return;
    }

    const hasInternalHistory = sessionStorage.getItem("hasInternalHistory");
    if (hasInternalHistory) {
      router.back();
    } else {
      router.push(lastEventsUrl ?? "/");
    }
  }

  return (
    <Button
      variant="outline"
      className="border-(--color-sand-strong) bg-white/80"
      onClick={handleBack}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
