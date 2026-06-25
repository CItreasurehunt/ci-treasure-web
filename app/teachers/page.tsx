import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { getAllPublicTeachers } from "@/lib/teachers";
import { getCountryLabel } from "@/lib/events";
import { getCountryFlag } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export default async function TeachersPage() {
  const teachers = await getAllPublicTeachers();

  return (
    <main className="min-h-screen bg-[--color-cream] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-[--color-sand-strong] bg-white/80">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to calendar
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <h1 className="font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl">
            Teachers
          </h1>
          <p className="text-lg text-slate-600">
            Discover {teachers.length} contact improvisation teachers in our directory.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Link
              key={teacher.id}
              href={`/teachers/${teacher.slug}`}
              className="group flex flex-col justify-between rounded-[2rem] border border-[--color-sand-strong] bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[--color-pine]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="rounded-full bg-[--color-cream] p-3 text-[--color-pine] group-hover:bg-[--color-sand-strong] transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.is_teacher && (
                      <RoleBadge>Teacher</RoleBadge>
                    )}
                    {teacher.is_organizer && (
                      <RoleBadge>Organizer</RoleBadge>
                    )}
                    {teacher.is_musician && (
                      <RoleBadge>Musician</RoleBadge>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-xl text-slate-950 group-hover:text-[--color-pine] transition-colors">
                    {teacher.name}
                  </h2>
                  {(teacher.city || teacher.country) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      {teacher.country && (
                        <span title={getCountryLabel(teacher.country)}>
                          {getCountryFlag(teacher.country)}
                        </span>
                      )}
                      {teacher.city}{teacher.city && teacher.country ? ", " : ""}{teacher.country ? getCountryLabel(teacher.country) : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[--color-sand-strong] pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {teacher.event_count || 0} {(teacher.event_count === 1) ? 'Event' : 'Events'}
                </span>
                <span className="text-sm font-medium text-[--color-pine] opacity-0 group-hover:opacity-100 transition-opacity">
                  View profile →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {children}
    </span>
  );
}
