export default function ImprintPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-serif text-4xl text-slate-950">Imprint</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
        <section>
          <h2 className="font-semibold text-slate-950">Information according to § 5 TMG</h2>
          <p>
            Max Mustermann
            <br />
            Musterstrasse 12
            <br />
            10115 Berlin
            <br />
            Germany
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">Contact</h2>
          <p>
            Email:{" "}
            <a href="mailto:citreasurehunt@gmail.com" className="underline">
              citreasurehunt@gmail.com
            </a>
            <br />
            Phone: available on request
            <br />
            Website: citreasurehunt.com
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">Responsible for content according to § 18 Abs. 2 MStV</h2>
          <p>Max Mustermann, address as above.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">Liability for content</h2>
          <p>
            The contents of this website have been compiled with care. However, we cannot guarantee the accuracy,
            completeness, or timeliness of the information provided. Event listings are submitted by third parties or
            compiled from public sources. Always verify event details directly with the organizer.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">Liability for links</h2>
          <p>
            This site contains links to external websites. We have no control over their content and accept no
            liability for them. The respective providers are responsible for their own content.
          </p>
        </section>
      </div>
    </main>
  );
}
