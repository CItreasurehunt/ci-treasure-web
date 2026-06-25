import { EventForm } from "@/components/admin/event-form";
import { createEmptyEventFormData } from "@/lib/admin-events";
import { requireAdminUser } from "@/lib/admin-auth";

export default async function AdminNewEventPage() {
  await requireAdminUser();
  return <EventForm mode="create" initialEvent={createEmptyEventFormData()} />;
}
