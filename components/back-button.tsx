"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window === "undefined") return;
    const hasInternalHistory = sessionStorage.getItem("hasInternalHistory");
    if (hasInternalHistory) {
      router.back();
    } else {
      const lastEventsUrl = sessionStorage.getItem("lastEventsUrl");
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
