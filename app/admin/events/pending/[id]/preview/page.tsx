import { notFound } from "next/navigation";

import { requireAdminUser } from "@/lib/admin-auth";
import { EventDetailView } from "@/components/event-detail-view";
import { getEventDetailForAdmin } from "@/lib/events";
import { getCountryPageLink } from "@/lib/country-pages";

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PendingEventPreviewPage({ params }: PreviewPageProps) {
  await requireAdminUser();
  const { id } = await params;

  const event = await getEventDetailForAdmin(id);
  if (!event) {
    notFound();
  }

  const countryLink = await getCountryPageLink(event.country);

  return <EventDetailView event={event} countryLink={countryLink} preview />;
}
