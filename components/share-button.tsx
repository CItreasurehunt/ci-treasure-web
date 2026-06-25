"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        // Ignore clipboard failures in browsers that block it.
      }
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="border-[--color-sand-strong] bg-white/80"
      onClick={handleShare}
    >
      <Share2 />
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
