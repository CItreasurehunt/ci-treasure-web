import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

async function getOpenReportCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminUser = await getAdminUser();
  const openReports = adminUser ? await getOpenReportCount() : 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e5_0%,#fffdf8_45%,#fffaf2_100%)] px-5 py-6 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_55px_rgba(106,75,25,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Admin</p>
            <h1 className="mt-2 font-serif text-3xl text-slate-950">CI Treasure Hunt</h1>
            <p className="mt-1 text-sm text-slate-600">Internal tools for event review and curation.</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
            <Link href="/admin/events" className="rounded-full border border-(--color-sand-strong) px-4 py-2 hover:border-(--color-pine) hover:text-(--color-pine)">
              Events
            </Link>
            <Link href="/admin/reports" className="relative rounded-full border border-(--color-sand-strong) px-4 py-2 hover:border-(--color-pine) hover:text-(--color-pine)">
              Reports
              {openReports > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {openReports > 9 ? "9+" : openReports}
                </span>
              )}
            </Link>
            <Link href="/" className="rounded-full border border-(--color-sand-strong) px-4 py-2 hover:border-(--color-pine) hover:text-(--color-pine)">
              Public site
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
