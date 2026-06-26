export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-serif text-4xl text-slate-950">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
        <p className="text-sm text-slate-500">Last updated: June 2026</p>
        <section>
          <h2 className="font-semibold text-slate-950">1. Controller</h2>
          <p>
            Jan Auras
            <br />
            Lenbachstr. 17
            <br />
            10115 Berlin
            <br />
            Germany
            <br />
            Email:{" "}
            <a href="mailto:hello@citreasurehunt.com" className="underline">
              hello@citreasurehunt.com
            </a>
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">2. What this site does</h2>
          <p>
            CI Treasure Hunt is a non-commercial public directory of contact improvisation events and communities
            worldwide. We do not sell tickets, process payments, or organise events. We link to external organiser
            pages.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">3. Hosting and server logs</h2>
          <p>
            This website is hosted by Vercel Inc. When you visit, technical data including IP address, browser type,
            requested pages, and access time may be logged by Vercel for security and stability purposes. We do not
            use these logs for profiling or tracking. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel&apos;s privacy policy
            </a>{" "}
            for details. Legal basis: Art. 6(1)(f) GDPR - legitimate interest in operating a stable website.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">4. Analytics</h2>
          <p>
            This website uses Vercel Web Analytics (aggregate traffic: page views, referrers, top pages) and Vercel
            Speed Insights (Core Web Vitals: loading speed, layout stability, interactivity). Both tools are designed
            to be privacy-friendly: they do not use cookies or persistent identifiers and do not track visitors across
            sites. A short-lived hash derived from the visitor&apos;s IP address and user agent is used for unique
            visitor counting and is not stored. All data is aggregate only. It is processed by Vercel Inc. (US) under
            Standard Contractual Clauses. Legal basis:{" "}
            Art.&nbsp;6(1)(f) GDPR — legitimate interest in understanding how the site is used and performs so we can improve it.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">5. Event data</h2>
          <p>
            Event listings are stored in a database provided by Supabase Inc. (US). This data is publicly displayed
            on the site. It consists of event details compiled from public sources and does not include personal data
            beyond organiser names and contact links that are already publicly available. Data transfers to Supabase
            are governed by Standard Contractual Clauses (SCCs) under Art.&nbsp;46(2)(c) GDPR. See{" "}
            <a href="https://supabase.com/legal/privacy" className="underline" target="_blank" rel="noopener noreferrer">
              Supabase&apos;s privacy policy
            </a>{" "}
            for details.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">6. Newsletter</h2>
          <p>
            Newsletter signup is handled via an external EmailOctopus page. When you sign up, your name and email
            address are stored by EmailOctopus. Their privacy policy applies to that data. We do not receive or store
            your email address on our own systems. Legal basis for any data we may later process directly: Art.
            6(1)(a) GDPR - consent. You can unsubscribe at any time via the link in any newsletter email.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">7. Your rights</h2>
          <p>
            Under the GDPR you have the right to access, correct, or delete personal data we hold about you, to
            restrict or object to processing, and to data portability where applicable. To exercise these rights,
            contact us at hello@citreasurehunt.com.
          </p>
          <p className="mt-2">
            You also have the right to lodge a complaint with the supervisory authority responsible for Berlin:{" "}
            <a
              href="https://www.datenschutz-berlin.de"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Berliner Beauftragte für Datenschutz und Informationsfreiheit
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">8. Reports</h2>
          <p>
            When you submit a report via the report form on event, venue, or teacher pages, a daily-rotating hash
            of your IP address is stored to prevent abuse. This hash cannot be used to identify you and is not
            shared with third parties. Legal basis: Art. 6(1)(f) GDPR — legitimate interest in preventing spam
            and abuse.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">9. Changes to this policy</h2>
          <p>
            This policy will be updated when new features affecting data processing are added. The date at the top of
            this page reflects the most recent revision.
          </p>
        </section>
      </div>
    </main>
  );
}
