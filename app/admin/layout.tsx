import Link from "next/link";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f0e5_0%,_#fffdf8_45%,_#fffaf2_100%)] px-5 py-6 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_55px_rgba(106,75,25,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[--color-pine]">Admin</p>
            <h1 className="mt-2 font-serif text-3xl text-slate-950">CI Treasure Hunt</h1>
            <p className="mt-1 text-sm text-slate-600">Internal tools for event review and curation.</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
            <Link href="/admin/events" className="rounded-full border border-[--color-sand-strong] px-4 py-2 hover:border-[--color-pine] hover:text-[--color-pine]">
              Events
            </Link>
            <Link href="/" className="rounded-full border border-[--color-sand-strong] px-4 py-2 hover:border-[--color-pine] hover:text-[--color-pine]">
              Public site
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
