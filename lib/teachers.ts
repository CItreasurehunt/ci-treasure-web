import { createClient } from "@/lib/supabase/server";
import { type EventListItem, type SupabaseEventRow, mapEventRow } from "./events";

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
  event_count?: number;
};

export async function getAllPublicTeachers(): Promise<TeacherProfile[]> {
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

export async function getTeacherEvents(profileId: string): Promise<EventListItem[]> {
  const supabase = await createClient();
  const fields = `events (id, short_id, title, description, type, start_date, end_date, city, country, image_url, lat, lng, status)`;

  const [{ data: asTeacher }, { data: asOrganizer }] = await Promise.all([
    supabase.from("event_teachers").select(fields).eq("teacher_id", profileId),
    supabase.from("event_organizers").select(fields).eq("organizer_id", profileId),
  ]);

  const allRows = [...(asTeacher ?? []), ...(asOrganizer ?? [])];

  // Deduplicate by event id, keep published only, sort ascending
  const seen = new Set<string>();
  return allRows
    .map(row => row.events as unknown as SupabaseEventRow & { status: string })
    .filter(e => {
      if (!e || e.status !== "published" || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .map(e => mapEventRow(e))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getAllPublicTeacherSlugs(): Promise<string[]> {
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
