import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllPublishedEventSlugs } from "@/lib/events";
import { getAllPublicTeacherSlugs } from "@/lib/teachers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventSlugs, teacherSlugs] = await Promise.all([
    getAllPublishedEventSlugs(),
    getAllPublicTeacherSlugs(),
  ]);

  const eventEntries = eventSlugs.map((slug) => ({
    url: `${SITE_URL}/events/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const teacherEntries = teacherSlugs.map((slug) => ({
    url: `${SITE_URL}/teachers/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/communities`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/teachers`, changeFrequency: "daily", priority: 0.7 },
    ...eventEntries,
    ...teacherEntries,
  ];
}
