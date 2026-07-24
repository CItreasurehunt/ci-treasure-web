"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MoreVertical, Share, Smartphone, SquarePlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Neither platform gets a reliable native install prompt: Chrome's
// beforeinstallprompt eligibility heuristics are inconsistent, and iOS has no
// automatic prompt at all. So this is a plain instructional walkthrough on
// both platforms rather than depending on beforeinstallprompt — same choice
// ci-events.org's install banner makes (I-142 addendum).
function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallToHomeScreen() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(true);

  useEffect(() => {
    setVisible(!isStandalone());
    setIos(isIos());
  }, []);

  if (!visible || pathname !== "/") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-(--color-sand-strong) px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-(--color-pine) hover:text-(--color-pine)"
      >
        <Smartphone className="size-3.5" />
        Add to Home Screen
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add CI Treasure Hunt to your Home Screen</DialogTitle>
            <DialogDescription>
              For quick access next time. No app store needed.
            </DialogDescription>
          </DialogHeader>
          {ios ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Open this website in Safari</li>
              <li className="flex flex-wrap items-center gap-1">
                Tap the
                <Share className="size-4 shrink-0" />
                Share icon in the toolbar
              </li>
              <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
              <li>Tap &quot;Add&quot; to confirm</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Open this website in Chrome</li>
              <li className="flex flex-wrap items-center gap-1">
                Tap the
                <MoreVertical className="size-4 shrink-0" />
                menu icon in the toolbar
              </li>
              <li className="flex flex-wrap items-center gap-1">
                Tap
                <SquarePlus className="size-4 shrink-0" />
                &quot;Add to Home Screen&quot; (sometimes shown as
                &quot;Install app&quot;)
              </li>
              <li>Tap &quot;Add&quot; / &quot;Install&quot; to confirm</li>
            </ol>
          )}
          <p className="text-sm text-slate-500">
            You&apos;ll get a quick-access icon added to your home screen.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
