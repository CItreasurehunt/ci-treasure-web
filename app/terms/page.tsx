export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-serif text-4xl text-slate-950">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
        <p className="text-sm text-slate-500">Last updated: March 2026</p>
        <section>
          <h2 className="font-semibold text-slate-950">1. Scope</h2>
          <p>
            These terms govern use of the CI Treasure Hunt website (citreasurehunt.com). By using the site you
            accept these terms.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">2. Nature of the service</h2>
          <p>
            CI Treasure Hunt is a free, non-commercial directory of contact improvisation events and communities.
            Event listings link to external organiser pages. Registration, ticketing, and participation are handled
            entirely by the respective organisers. We are not a party to any transaction between users and organisers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">3. Accuracy of listings</h2>
          <p>
            Listings are compiled from public sources. While we aim for accuracy, we cannot guarantee that event
            information is complete, correct, or current at all times. Always verify details directly with the
            organiser before making travel or registration decisions. We accept no liability for cancelled, changed,
            or incorrectly listed events.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">4. External links</h2>
          <p>
            This website contains links to third-party sites. CI Treasure Hunt is not responsible for the content,
            availability, or privacy practices of those sites.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">5. Acceptable use</h2>
          <p>
            You may not use this site to scrape or bulk-download data for commercial purposes, submit false or
            misleading information, or attempt to disrupt the service.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">6. Changes</h2>
          <p>
            We may update these terms when new features are added. Continued use of the site after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">7. Governing law</h2>
          <p>These terms are governed by the laws of the Federal Republic of Germany.</p>
        </section>
      </div>
    </main>
  );
}
