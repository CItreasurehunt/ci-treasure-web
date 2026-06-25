import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { formatEventDateRange, getCountryLabel, getEventHref, getTypeLabel, type EventListItem } from "@/lib/events";

function canUseNextImage(src: string) {
  try {
    const url = new URL(src);
    return url.hostname === "ormttcjjsumbmvyennfx.supabase.co";
  } catch {
    return false;
  }
}

export function EventCard({ event, compact = false }: { event: EventListItem; compact?: boolean }) {
  const imageUrl = event.imageUrl?.trim() ?? "";
  const renderImage = imageUrl.length > 0;
  const useNextImage = renderImage && canUseNextImage(imageUrl);

  if (compact) {
    return (
      <Link
        href={getEventHref(event)}
        className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
      >
        <article className="flex items-start gap-3 p-3">
          <div className={`h-12 w-12 shrink-0 rounded-md border border-[--color-sand-strong] overflow-hidden ${!renderImage ? event.accentClass : ""}`}>
            {renderImage && (
              useNextImage ? (
                <Image src={imageUrl} alt={event.title} width={48} height={48} className="h-full w-full object-cover" />
              ) : (
                <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
              )
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--color-pine]">
              {getTypeLabel(event.type)}
            </p>
            <h3 className="truncate font-serif text-sm font-semibold leading-snug text-slate-950">{event.title}</h3>
            <p className="text-xs text-slate-500">{formatEventDateRange(event)}</p>
            <p className="text-xs text-slate-400">{event.city}, {getCountryLabel(event.country)}</p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={getEventHref(event)}
      className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <article>
        {renderImage ? (
          <div className="relative h-44 border-b border-[--color-sand-strong]">
            {useNextImage ? (
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            ) : (
              <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className={`h-44 border-b border-[--color-sand-strong] ${event.accentClass}`} />
        )}
        <div className="space-y-5 p-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[--color-pine]">
              {getTypeLabel(event.type)}
            </p>
            <h3 className="font-serif text-2xl leading-tight text-slate-950">{event.title}</h3>
            {event.description ? (
              <p className="line-clamp-3 text-sm leading-7 text-slate-600">{event.description}</p>
            ) : null}
          </div>

          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-4 text-[--color-ember]" />
              <dd>{formatEventDateRange(event)}</dd>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-[--color-ember]" />
              <dd>
                {event.city}, {getCountryLabel(event.country)}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </Link>
  );
}
