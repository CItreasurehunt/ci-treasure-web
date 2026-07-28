import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Auth-gated utility pages (dashboard, claim flows, event submission/edit) have no
    // unique public content to rank and would otherwise get crawled as a pile of
    // near-duplicate /auth?next=... URLs once a bot follows the sign-in redirect — wasted
    // crawl budget, not a security boundary (the real gate is proxy.ts's auth check).
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/ isn't a security boundary either (same as the rest of this list) — these are
      // JSON endpoints with no unique content to rank, not linked from anywhere crawlable, but
      // blocking them rules out any chance of a response surfacing in search results and saves
      // crawl budget.
      disallow: ["/admin/", "/dashboard/", "/auth", "/events/new", "/events/*/edit", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
