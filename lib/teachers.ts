import { createClient } from "@/lib/supabase/server";
import { type EventListItem, type SupabaseEventRow, mapEventRow } from "./events";

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type TeacherProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  public_email: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  telegram: string | null;
  newsletter: string | null;
  is_teacher: boolean;
  is_organizer: boolean;
  is_musician: boolean;
  significant_teachers: string | null;
  year_starting_practice: number | null;
  year_starting_teaching: number | null;
  visibility: string;
  show_in_list: boolean;
  image_url: string | null;
  image_credit: string | null;
  image_status: string;
  event_count?: number;
};

export async function getAllPublicTeachers(): Promise<TeacherProfile[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }
  const supabase = await createClient();

  // Fetch teachers
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select(`
      id, name, slug, city, country,
      is_teacher, is_organizer, is_musician,
      visibility, show_in_list
    `)
    .eq("is_teacher", true)
    .eq("visibility", "public")
    .eq("show_in_list", true)
    .order("name", { ascending: true });

  if (error || !teachers) {
    console.error("Error fetching teachers:", error);
    return [];
  }

  // Fetch event counts for these teachers (published only)
  const teacherIds = teachers.map(t => t.id);
  const { data: eventCounts, error: countsError } = await supabase
    .from("event_teachers")
    .select("teacher_id, events!inner(status)")
    .in("teacher_id", teacherIds)
    .eq("events.status", "published");

  const countsMap: Record<string, number> = {};
  if (!countsError && eventCounts) {
    eventCounts.forEach(ec => {
      countsMap[ec.teacher_id] = (countsMap[ec.teacher_id] || 0) + 1;
    });
  }

  return teachers.map(t => ({
    ...t,
    event_count: countsMap[t.id] || 0
  })) as TeacherProfile[];
}

export async function getTeacherBySlug(slug: string): Promise<TeacherProfile | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .single();

  if (error || !data) {
    return null;
  }

  return data as TeacherProfile;
}

type TeacherEventItem = EventListItem & { teacher_id?: string; organizer_id?: string; role?: string };

export async function getTeacherEvents(profileId: string): Promise<{
  upcoming: TeacherEventItem[];
  past: TeacherEventItem[];
}> {
  if (!hasSupabaseEnv()) {
    return { upcoming: [], past: [] };
  }
  const supabase = await createClient();
  const fields = `role, teacher_id, events (id, short_id, title, description, type, start_date, end_date, city, country, image_url, lat, lng, status, hide)`;
  const orgFields = `organizer_id, events (id, short_id, title, description, type, start_date, end_date, city, country, image_url, lat, lng, status, hide)`;

  const [{ data: asTeacher }, { data: asOrganizer }] = await Promise.all([
    supabase.from("event_teachers").select(fields).eq("teacher_id", profileId),
    supabase.from("event_organizers").select(orgFields).eq("organizer_id", profileId),
  ]);

  const allRows = [
    ...(asTeacher ?? []).map(r => ({ ...r.events, role: r.role, teacher_id: r.teacher_id })),
    ...(asOrganizer ?? []).map(r => ({ ...r.events, organizer_id: r.organizer_id }))
  ];

  // Deduplicate by event id, keep published + visible archived (same public-visibility rule
  // as getVenueEvents), sort ascending.
  const results: TeacherEventItem[] = [];

  for (const row of allRows) {
    const e = row as unknown as SupabaseEventRow & { status: string, hide?: boolean, teacher_id?: string, organizer_id?: string, role?: string };
    if (!e) continue;
    const isVisible = e.status === "published" || (e.status === "archived" && e.hide === false);
    if (!isVisible) continue;

    // We might have the same event twice (as teacher AND organizer).
    // We want to keep both pieces of info for role derivation, OR just make sure we don't drop them.
    // If we want a deduplicated list for display, but keep all roles...
    // Let's actually keep the first one we see but combine the flags if needed.

    const existing = results.find(r => r.id === e.id);
    if (existing) {
        if (e.teacher_id) {
            existing.teacher_id = e.teacher_id;
            existing.role = e.role;
        }
        if (e.organizer_id) existing.organizer_id = e.organizer_id;
    } else {
        results.push({
            ...mapEventRow(e),
            teacher_id: e.teacher_id,
            organizer_id: e.organizer_id,
            role: e.role
        });
    }
  }

  const today = new Date().toISOString().split("T")[0];
  return {
    upcoming: results
      .filter(e => e.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    past: results
      .filter(e => e.endDate < today)
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
  };
}

export async function getAllPublicTeacherSlugs(): Promise<string[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("slug")
    .eq("is_teacher", true)
    .eq("visibility", "public");

  if (error || !data) {
    return [];
  }

  return data.map(row => row.slug);
}
