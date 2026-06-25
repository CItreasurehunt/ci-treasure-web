import Link from "next/link";

import { NEWSLETTER_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-[--color-sand-strong] bg-[--color-cream]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight text-slate-950">
          CI Treasure Hunt
          <span className="rounded-full bg-[--color-pine]/10 px-2 py-0.5 font-sans text-[10px] font-bold tracking-widest uppercase text-[--color-pine]">
            Alpha
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 text-sm font-medium text-slate-700 sm:gap-5">
          <Link href="/" className="transition hover:text-[--color-pine]">
            Events
          </Link>
          <Link href="/communities" className="transition hover:text-[--color-pine]">
            Communities
          </Link>
          <a
            href="https://tally.so/r/yPzK4B"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-[--color-pine]"
          >
            Feedback
          </a>
          <a
            href={NEWSLETTER_URL}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-[--color-pine]"
          >
            Newsletter
          </a>
        </nav>
      </div>
    </header>
  );
}
