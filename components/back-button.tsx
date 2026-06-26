"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="border-[--color-sand-strong] bg-white/80"
      onClick={() => router.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
