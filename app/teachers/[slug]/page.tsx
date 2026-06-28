import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Youtube,
} from "lucide-react";

import {
  getTeacherBySlug,
  getTeacherEvents,
  getAllPublicTeacherSlugs
} from "@/lib/teachers";
import { ReportButton } from "@/components/report-button";
import BackButton from "@/components/back-button";
import {
  getCountryLabel,
  formatEventDateRange,
  getTypeLabel,
  getEventHref
} from "@/lib/events";
import { getCountryFlag } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllPublicTeacherSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

type TeacherPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TeacherPage({ params }: TeacherPageProps) {
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);

  if (!teacher) {
    notFound();
  }

  const events = await getTeacherEvents(teacher.id);

  return (
    <main className="min-h-screen bg-[--color-cream] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <BackButton />
        </div>
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_90px_rgba(105,73,22,0.12)]">
          <div className="border-b border-[--color-sand-strong] bg-[linear-gradient(135deg,#1f3b46_0%,#3a6a73_50%,#ead9b1_100%)] px-6 py-10 sm:px-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {teacher.is_teacher && <RoleBadge>Teacher</RoleBadge>}
                {teacher.is_organizer && <RoleBadge>Organizer</RoleBadge>}
                {teacher.is_musician && <RoleBadge>Musician</RoleBadge>}
              </div>
              <h1 className="font-serif text-4xl leading-tight tracking-tight text-white sm:text-5xl">
                {teacher.name}
              </h1>
              {(teacher.city || teacher.country) && (
                <p className="flex items-center gap-2 text-lg text-white/90">
                  <MapPin className="h-5 w-5 text-white/70" />
                  {teacher.city}{teacher.city && teacher.country ? ", " : ""}{teacher.country ? getCountryLabel(teacher.country) : ""}
                  {teacher.country && (
                    <span className="ml-1" title={getCountryLabel(teacher.country)}>
                      {getCountryFlag(teacher.country)}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-8">
              {teacher.bio ? (
                <section className="space-y-3">
                  <h2 className="font-serif text-2xl text-slate-950">About</h2>
                  <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                    {teacher.bio}
                  </p>
                </section>
              ) : null}

              <section className="space-y-5">
                <h2 className="font-serif text-2xl text-slate-950">Events</h2>
                {events.length > 0 ? (
                  <div className="grid gap-4">
                    {events.map((event) => (
                      <Link key={event.id} href={getEventHref(event)} className="group">
                        <div className="rounded-[1.5rem] border border-[--color-sand-strong] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[--color-pine] sm:p-6">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <h3 className="font-serif text-xl leading-tight text-slate-900 group-hover:text-[--color-pine] transition-colors">
                              {event.title}
                            </h3>
                            <span className="shrink-0 text-sm font-semibold text-[--color-pine] flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" />
                              {formatEventDateRange(event)}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium tracking-wider text-slate-600 uppercase">
                                {getTypeLabel(event.type)}
                              </span>
                              <span className="text-sm text-slate-500">
                                {getCountryFlag(event.country)} {event.city}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-[--color-pine] opacity-0 group-hover:opacity-100 transition-opacity">
                              View event →
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No published events found for this teacher.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              {(teacher.website || teacher.public_email || teacher.instagram || teacher.facebook || teacher.youtube || teacher.telegram || teacher.newsletter) && (
                <section className="rounded-[1.75rem] border border-[--color-sand-strong] bg-[--color-cream] p-6">
                  <h2 className="font-serif text-2xl text-slate-950">Links</h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {teacher.website && (
                      <SocialLink href={teacher.website.startsWith('http') ? teacher.website : `https://${teacher.website}`} icon={<Globe className="h-4 w-4" />} label="Website" />
                    )}
                    {teacher.public_email && (
                      <SocialLink href={`mailto:${teacher.public_email}`} icon={<Mail className="h-4 w-4" />} label="Email" />
                    )}
                    {teacher.facebook && (
                      <SocialLink href={teacher.facebook.startsWith('http') ? teacher.facebook : `https://facebook.com/${teacher.facebook}`} icon={<Facebook className="h-4 w-4" />} label="Facebook" />
                    )}
                    {teacher.instagram && (
                      <SocialLink href={teacher.instagram.startsWith('http') ? teacher.instagram : `https://instagram.com/${teacher.instagram.replace('@', '')}`} icon={<Instagram className="h-4 w-4" />} label="Instagram" />
                    )}
                    {teacher.youtube && (
                      <SocialLink href={teacher.youtube.startsWith('http') ? teacher.youtube : `https://youtube.com/${teacher.youtube}`} icon={<Youtube className="h-4 w-4" />} label="YouTube" />
                    )}
                    {teacher.telegram && (
                      <SocialLink href={teacher.telegram.startsWith('http') ? teacher.telegram : `https://t.me/${teacher.telegram.replace('@', '')}`} icon={<Send className="h-4 w-4" />} label="Telegram" />
                    )}
                    {teacher.newsletter && (
                      <SocialLink href={teacher.newsletter.startsWith('http') ? teacher.newsletter : `https://${teacher.newsletter}`} icon={<MessageSquare className="h-4 w-4" />} label="Newsletter" />
                    )}
                  </div>
                </section>
              )}

              {/* Professional Background (year_starting_practice, year_starting_teaching, significant_teachers) — hidden for now; re-enable when data is more complete */}
            </aside>
          </div>
        </section>
        <div className="text-center text-sm text-slate-400">
          Is this your profile?{" "}
          <a href="mailto:hello@citreasurehunt.com" className="underline hover:text-slate-600">
            Get in touch
          </a>{" "}
          to update it.{" "}
          ·{" "}
          <ReportButton
            entity_type="profile"
            entity_id={teacher.id}
            entity_title={teacher.name}
            entity_slug={teacher.slug}
          />
        </div>
      </div>
    </main>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm border border-white/30">
      {children}
    </span>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-between rounded-xl border border-[--color-sand-strong] bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-[--color-pine] hover:text-[--color-pine]"
    >
      <span className="flex items-center gap-3">
        <span className="text-[--color-pine]">{icon}</span>
        <span>{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 opacity-30" />
    </a>
  );
}
