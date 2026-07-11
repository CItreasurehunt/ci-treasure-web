import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
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
import { SocialLink } from "@/components/social-link";
import { EntityEventCard } from "@/components/entity-event-card";
import { EntityImage } from "@/components/entity-image";
import {
  GENERIC_ACCENT_GRADIENT,
  getCountryLabel,
  getLinkLabel,
  linkSortKey,
} from "@/lib/events";
import { getCountryFlag } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

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

export async function generateMetadata({ params }: TeacherPageProps): Promise<Metadata> {
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);
  if (!teacher) return {};

  const description =
    teacher.bio?.slice(0, 160) ??
    `Contact Improvisation teacher${teacher.city ? ` based in ${teacher.city}` : ""} — CI Treasure Hunt`;

  const approvedImage = teacher.image_status === "approved" ? teacher.image_url : null;

  return {
    title: `${teacher.name} — CI Treasure Hunt`,
    description,
    openGraph: {
      title: teacher.name,
      description,
      url: `${SITE_URL}/teachers/${teacher.slug}`,
      images: approvedImage ? [{ url: approvedImage }] : [],
    },
  };
}

export default async function TeacherPage({ params }: TeacherPageProps) {
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);

  if (!teacher) {
    notFound();
  }

  const { upcoming, past } = await getTeacherEvents(teacher.id);
  const allEvents = [...upcoming, ...past];

  // Derive roles from both stored flags and linked events (I-115)
  // getTeacherEvents returns events where teacher is linked as either teacher or organizer.
  // We need to distinguish roles.
  const derivedIsTeacher = teacher.is_teacher || allEvents.some(e =>
    e.teacher_id === teacher.id && e.role !== 'musician'
  );
  const derivedIsMusician = teacher.is_musician || allEvents.some(e =>
    e.teacher_id === teacher.id && e.role === 'musician'
  );
  const derivedIsOrganizer = teacher.is_organizer || allEvents.some(e =>
    e.organizer_id === teacher.id
  );

  const ensureHttps = (url: string) => url.startsWith("http") ? url : `https://${url}`;
  type LinkRow = { type: string; href: string; label: string; icon: React.ReactNode };
  const teacherLinks: LinkRow[] = [];
  if (teacher.website) teacherLinks.push({ type: "website", href: ensureHttps(teacher.website), label: getLinkLabel("website"), icon: <Globe className="h-4 w-4" /> });
  if (teacher.facebook) teacherLinks.push({ type: "facebook", href: ensureHttps(teacher.facebook), label: getLinkLabel("facebook"), icon: <Facebook className="h-4 w-4" /> });
  if (teacher.instagram) teacherLinks.push({ type: "instagram", href: ensureHttps(teacher.instagram.replace(/^@/, "https://instagram.com/")), label: getLinkLabel("instagram"), icon: <Instagram className="h-4 w-4" /> });
  if (teacher.youtube) teacherLinks.push({ type: "youtube", href: ensureHttps(teacher.youtube), label: getLinkLabel("youtube"), icon: <Youtube className="h-4 w-4" /> });
  if (teacher.telegram) teacherLinks.push({ type: "telegram", href: teacher.telegram.startsWith("http") ? teacher.telegram : `https://t.me/${teacher.telegram.replace(/^@/, "")}`, label: getLinkLabel("telegram"), icon: <Send className="h-4 w-4" /> });
  if (teacher.newsletter) teacherLinks.push({ type: "newsletter", href: ensureHttps(teacher.newsletter), label: getLinkLabel("newsletter"), icon: <MessageSquare className="h-4 w-4" /> });
  teacherLinks.sort((a, b) => linkSortKey(a.type) - linkSortKey(b.type));
  if (teacher.public_email) teacherLinks.push({ type: "email", href: `mailto:${teacher.public_email}`, label: "Email", icon: <Mail className="h-4 w-4" /> });

  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <BackButton />
        </div>
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_90px_rgba(105,73,22,0.12)]">
          <div className={`flex min-h-52 flex-col justify-end border-b border-(--color-sand-strong) ${GENERIC_ACCENT_GRADIENT} px-6 py-8 sm:px-8`}>
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap gap-2">
                {derivedIsTeacher && <RoleBadge>Teacher</RoleBadge>}
                {derivedIsOrganizer && <RoleBadge>Organizer</RoleBadge>}
                {derivedIsMusician && <RoleBadge>Musician</RoleBadge>}
              </div>
              <h1 className="font-serif text-4xl leading-tight tracking-tight text-white sm:text-5xl">
                {teacher.name}
              </h1>
              {(teacher.city || teacher.country) && (
                <p className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4 shrink-0 text-white/70" />
                  {teacher.country ? (
                    <span className="leading-none" title={getCountryLabel(teacher.country)}>
                      {getCountryFlag(teacher.country)}
                    </span>
                  ) : null}
                  <span>
                    {teacher.city}{teacher.city && teacher.country ? ", " : ""}{teacher.country ? getCountryLabel(teacher.country) : ""}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-8">
              {teacher.image_url && teacher.image_status === "approved" && (
                <EntityImage src={teacher.image_url} alt={teacher.name} credit={teacher.image_credit} />
              )}

              {teacher.bio ? (
                <section className="space-y-3">
                  <h2 className="font-serif text-2xl text-slate-950">About</h2>
                  <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                    {teacher.bio}
                  </p>
                </section>
              ) : null}

              <section className="space-y-6">
                <h2 className="font-serif text-2xl text-slate-950">Events</h2>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                      Upcoming Events
                    </h3>
                    {upcoming.length > 0 ? (
                      <div className="grid gap-4">
                        {upcoming.map((event) => (
                          <EntityEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-slate-500">No upcoming events scheduled.</p>
                    )}
                  </div>

                  {past.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer list-none space-y-4">
                        <div className="flex items-center justify-between border-t border-(--color-sand-strong) pt-6">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Past Events ({past.length})
                          </h3>
                          <span className="text-sm font-medium text-violet-600 group-open:hidden">
                            Show past events
                          </span>
                          <span className="hidden text-sm font-medium text-violet-600 group-open:block">
                            Hide past events
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 grid gap-4">
                        {past.map((event) => (
                          <EntityEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              {teacherLinks.length > 0 && (
                <section className="rounded-[1.75rem] border border-(--color-sand-strong) bg-(--color-mist) p-6">
                  <h2 className="font-serif text-2xl text-slate-950">Links</h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {teacherLinks.map((row, i) => (
                      <SocialLink key={i} href={row.href} icon={row.icon} label={row.label} />
                    ))}
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
