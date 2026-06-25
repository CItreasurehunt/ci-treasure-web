import { NextResponse, type NextRequest } from "next/server";

import { requireAdminRequestUser } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequestUser(request);

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const role = request.nextUrl.searchParams.get("role") ?? "teacher";

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = createAdminClient();
    let builder = supabase
      .from("profiles")
      .select("id, name, is_teacher, is_organizer, is_musician")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(10);

    builder =
      role === "organizer"
        ? builder.or("is_organizer.eq.true,is_teacher.eq.true")
        : builder.or("is_teacher.eq.true,is_musician.eq.true");

    const { data, error } = await builder;
    if (error) {
      throw error;
    }

    return NextResponse.json({
      results: (data ?? []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        isTeacher: profile.is_teacher,
        isOrganizer: profile.is_organizer,
        isMusician: profile.is_musician,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not search profiles." },
      { status: 500 },
    );
  }
}
