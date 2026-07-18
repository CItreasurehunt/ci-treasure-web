import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminRequestUser } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeJsonItems<T>(items: T[]) {
  return items.length ? { items } : null;
}

function parsePriceItems(items: Array<{ amount: string; currency: string; description: string }>) {
  return items
    .map((item) => {
      const amount = item.amount.trim();
      return {
        amount: amount ? Math.round(Number.parseFloat(amount) * 100) : null,
        currency: item.currency.trim() || "EUR",
        description: item.description.trim() || undefined,
      };
    })
    .filter((item) => item.amount !== null || item.description || item.currency);
}

function parseLinkItems(items: Array<{ type: string; url: string }>) {
  return items
    .map((item) => ({
      type: item.type.trim() || "website",
      url: item.url.trim(),
    }))
    .filter((item) => item.url);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminRequestUser(request);
    const { id } = await params;
    const payload = await request.json();
    const supabase = createAdminClient();

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title: payload.title,
        type: payload.type,
        status: payload.status,
        start_date: payload.startDate,
        end_date: payload.endDate,
        timezone: payload.timezone,
        city: payload.city,
        country: payload.country,
        description: payload.description || null,
        image_url: payload.imageUrl || null,
        cancelled: Boolean(payload.cancelled),
        cancelled_text: payload.cancelled ? payload.cancelledText || "" : null,
        hide: Boolean(payload.hide),
        address: payload.venueName ? { venue_name: payload.venueName } : null,
        price: normalizeJsonItems(parsePriceItems(payload.priceItems ?? [])),
        links: normalizeJsonItems(parseLinkItems(payload.linkItems ?? [])),
        updated_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    const { error: deleteTeachersError } = await supabase.from("event_teachers").delete().eq("event_id", id);
    if (deleteTeachersError) {
      throw deleteTeachersError;
    }

    const teacherRows = (payload.teachers ?? []).map((item: { profileId: string; role: string }) => ({
      event_id: id,
      teacher_id: item.profileId,
      role: item.role,
    }));

    if (teacherRows.length) {
      const { error: insertTeachersError } = await supabase.from("event_teachers").insert(teacherRows);
      if (insertTeachersError) {
        throw insertTeachersError;
      }
    }

    const { error: deleteOrganizersError } = await supabase.from("event_organizers").delete().eq("event_id", id);
    if (deleteOrganizersError) {
      throw deleteOrganizersError;
    }

    const organizerRows = (payload.organizers ?? []).map((item: { profileId: string; role: string }) => ({
      event_id: id,
      organizer_id: item.profileId,
      role: item.role,
    }));

    if (organizerRows.length) {
      const { error: insertOrganizersError } = await supabase.from("event_organizers").insert(organizerRows);
      if (insertOrganizersError) {
        throw insertOrganizersError;
      }
    }

    // Cached ISR pages (homepage list, this event's own detail page) won't
    // otherwise pick up an admin edit for up to an hour — revalidate both
    // immediately. Path-pattern form revalidates every slug variant of the
    // dynamic route without needing to know this event's current slug.
    revalidatePath("/");
    revalidatePath("/events/[eventSlug]", "page");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update event." },
      { status: 500 },
    );
  }
}
