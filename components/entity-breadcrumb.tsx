import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_URL } from "@/lib/site";

// I-132 Step 2: shared across events/venues/teachers/communities detail pages. Deliberately
// renders nothing — no visible trail, no BreadcrumbList JSON-LD — when the entity's country has
// no country page yet, rather than a bare "Home > Entity" trail. A two-level breadcrumb with
// nothing meaningful in the middle isn't informative, it's just clutter; it only earns its place
// once there's a real hub page in between to point at. See docs/issues/i-132-country-pages.md.
export function EntityBreadcrumb({
  country,
  currentLabel,
  currentUrl,
}: {
  country: { slug: string; label: string } | null;
  currentLabel: string;
  currentUrl: string;
}) {
  if (!country) return null;

  const items = [
    { name: "Home", url: SITE_URL },
    { name: country.label, url: `${SITE_URL}/${country.slug}` },
    { name: currentLabel, url: currentUrl },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // currentLabel is entity-owner-controlled free text (event title, teacher name, etc.) —
        // escape "<" so a value containing "</script>" can't break out of this tag, same pattern
        // as every other JSON-LD block on these pages.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-(--color-pine) hover:underline">
          Home
        </Link>
        <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
        <Link href={`/${country.slug}`} className="hover:text-(--color-pine) hover:underline">
          {country.label}
        </Link>
        <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
        <span className="truncate text-slate-700" aria-current="page">
          {currentLabel}
        </span>
      </nav>
    </>
  );
}
