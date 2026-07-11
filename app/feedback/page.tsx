import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback — CI Treasure Hunt",
  description: "Share your thoughts, report a bug, or suggest a feature.",
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-(--color-mist)">
      <section className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
        <div className="mb-8 border-l-4 border-(--color-pine) pl-5 py-1">
          <h1 className="font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">Feedback</h1>
          <p className="mt-2 text-base text-slate-500">
            Found a bug, missing an event, or have an idea? We read everything.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <iframe
            data-tally-src="https://tally.so/embed/yPzK4B?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="500"
            style={{ border: 0 }}
            title="Feedback"
          />
        </div>
      </section>

      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
    </main>
  );
}
