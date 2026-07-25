import Link from "next/link";
import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminVenueRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  visibility: string;
  show_in_list: boolean;
  show_in_announce: boolean;
  image_url: string | null;
  website: string | null;
};

const VISIBILITY_OPTIONS = ["public", "hidden"] as const;
const DEFAULT_VISIBILITIES = ["public", "hidden"] as const;

async function toggleVisibility(formData: FormData) {
  "use server";

  await requireAdminUser();
  const venueId = String(formData.get("venueId") ?? "");
  const currentVisibility = String(formData.get("currentVisibility") ?? "");
  if (!venueId) throw new Error("Missing venue id.");

  const nextVisibility = currentVisibility === "public" ? "hidden" : "public";
  const supabase = createAdminClient();
  const { error } = await supabase.from("venues").update({ visibility: nextVisibility }).eq("id", venueId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/venues");
  revalidatePath("/venues");
}

async function toggleShowInList(formData: FormData) {
  "use server";

  await requireAdminUser();
  const venueId = String(formData.get("venueId") ?? "");
  const currentShowInList = String(formData.get("currentShowInList") ?? "") === "true";
  if (!venueId) throw new Error("Missing venue id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("venues").update({ show_in_list: !currentShowInList }).eq("id", venueId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/venues");
  revalidatePath("/venues");
}

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ visibility?: string | string[]; q?: string }>;
}) {
  await requireAdminUser();

  const { visibility, q } = await searchParams;
  const requestedVisibilities = visibility === undefined ? [] : Array.isArray(visibility) ? visibility : [visibility];
  const selectedVisibilities = requestedVisibilities.length > 0 ? requestedVisibilities : [...DEFAULT_VISIBILITIES];
  const query = (q ?? "").trim();

  const supabase = createAdminClient();
  let dbQuery = supabase
    .from("venues")
    .select("id, name, slug, city, country, visibility, show_in_list, show_in_announce, image_url, website")
    .in("visibility", selectedVisibilities)
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,city.ilike.%${query}%`);
  }

  const { data: venues, error } = await dbQuery;
  if (error) {
    throw new Error(error.message);
  }

  const rows = venues as AdminVenueRow[];
  const listedCount = rows.filter((v) => v.show_in_list).length;

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Venues</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-950">Manage venues</h2>
          <p className="mt-1 text-sm text-slate-600">
            {rows.length} shown · {listedCount} on the /venues directory. Curation stays manual, one venue at a
            time — flipping &quot;on list&quot; is a deliberate call, not a bulk operation.
          </p>
        </div>
        <Link href="/admin/venues/new" className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)">
          New venue
        </Link>
      </div>

      <form
        method="get"
        className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-(--color-sand-strong) bg-(--color-mist) p-4"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">visibility</span>
        {VISIBILITY_OPTIONS.map((v) => (
          <label key={v} className="flex items-center gap-1.5 text-sm text-slate-800">
            <input type="checkbox" name="visibility" value={v} defaultChecked={selectedVisibilities.includes(v)} />
            {v}
          </label>
        ))}
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search name or city..."
          className="rounded-full border border-(--color-sand-strong) bg-white px-4 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-(--color-ink) px-4 py-1.5 text-xs font-semibold text-(--color-mist)"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="space-y-3 lg:min-w-[1080px]">
          <div className="hidden grid-cols-[minmax(220px,3fr)_140px_140px_90px_90px_200px] gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
            <div>name</div>
            <div>city</div>
            <div>country</div>
            <div>visibility</div>
            <div>on list</div>
            <div>actions</div>
          </div>

          {rows.map((venue) => (
            <div
              key={venue.id}
              className="rounded-2xl bg-(--color-mist) p-4 text-sm text-slate-900 shadow-[0_10px_30px_rgba(106,75,25,0.05)]"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(220px,3fr)_140px_140px_90px_90px_200px] lg:items-center">
                <DetailItem label="name" value={venue.name} strong truncate />
                <DetailItem label="city" value={venue.city} />
                <DetailItem label="country" value={venue.country} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">visibility</p>
                  <div className="mt-1 flex flex-wrap gap-2 lg:mt-0">
                    <span className="rounded-full border border-(--color-sand-strong) px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                      {venue.visibility}
                    </span>
                    {venue.visibility === "public" && !venue.website ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        no website
                      </span>
                    ) : null}
                  </div>
                </div>
                <DetailItem label="on list" value={venue.show_in_list ? "yes" : "no"} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">actions</p>
                  <div className="mt-1 flex flex-wrap gap-2 lg:mt-0">
                    <Link href={`/admin/venues/${venue.id}/edit`} className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                      Edit
                    </Link>
                    {venue.visibility === "public" ? (
                      <Link
                        href={`https://citreasurehunt.com/venues/${venue.slug}`}
                        target="_blank"
                        className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold"
                      >
                        View live
                      </Link>
                    ) : null}
                    <form action={toggleVisibility}>
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="currentVisibility" value={venue.visibility} />
                      <button type="submit" className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                        {venue.visibility === "public" ? "Set hidden" : "Set public"}
                      </button>
                    </form>
                    <form action={toggleShowInList}>
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="currentShowInList" value={String(venue.show_in_list)} />
                      <button type="submit" className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                        {venue.show_in_list ? "Remove from list" : "Add to list"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 ? <p className="px-3 py-6 text-sm text-slate-500">No venues match this filter.</p> : null}
        </div>
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  strong = false,
  truncate = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">{label}</p>
      <p className={`mt-1 lg:mt-0 ${strong ? "font-medium leading-snug" : ""} ${truncate ? "lg:truncate" : ""}`}>
        {value}
      </p>
    </div>
  );
}
