import { NextResponse, type NextRequest } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminRequestUser(request);
    const payload = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("events")
      .insert({
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
        source: "manual",
        user_id: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create event." },
      { status: 500 },
    );
  }
}
