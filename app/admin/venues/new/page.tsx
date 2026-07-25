import { VenueForm } from "@/components/admin/venue-form";
import { requireAdminUser } from "@/lib/admin-auth";

export default async function AdminNewVenuePage() {
  await requireAdminUser();
  return <VenueForm mode="create" />;
}
