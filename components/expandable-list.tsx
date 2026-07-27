"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Keeps dense countries (Germany-scale: 25+ communities, 39+ teachers) from turning the page
// into an endless scroll, without depending on a real /teachers directory to link out to —
// that page doesn't exist yet (I-132 was built ahead of it). This expands in place instead.
// Once /teachers is a real filterable directory, a "view all in Germany" link-out can replace
// or supplement this, but this component doesn't need to change either way.
export function ExpandableList({
  items,
  initialCount,
  itemLabel,
}: {
  items: React.ReactNode[];
  initialCount: number;
  itemLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = items.length - initialCount;
  const visible = expanded ? items : items.slice(0, initialCount);

  return (
    <>
      {visible}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-(--color-pine) hover:bg-(--color-mist)"
        >
          Show all {items.length} {itemLabel}
          <ChevronDown className="size-4" />
        </button>
      )}
    </>
  );
}
