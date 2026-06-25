import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import {
  FACEBOOK_URL,
  INSTAGRAM_URL,
  NEWSLETTER_URL,
  SITE_URL,
  TELEGRAM_URL,
} from "@/lib/site";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CI Treasure Hunt",
  description: "Public calendar for contact improvisation festivals, retreats, trainings, and workshops worldwide.",
  openGraph: {
    title: "CI Treasure Hunt",
    description: "Public calendar for contact improvisation festivals, retreats, trainings, and workshops worldwide.",
    url: SITE_URL,
    siteName: "CI Treasure Hunt",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CI Treasure Hunt",
    description: "Public calendar for contact improvisation festivals, retreats, trainings, and workshops worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <div className="min-h-screen">
          <SiteHeader />
          {children}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 text-sm text-slate-700 sm:px-8 lg:grid lg:grid-cols-3 lg:items-center lg:px-10">
              <div className="flex flex-col gap-4">
                <p className="font-serif text-2xl text-slate-950">CI Treasure Hunt</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Link href="/imprint">Imprint</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </div>
              </div>
              <div className="lg:text-center">
                <a href="mailto:hello@citreasurehunt.com" className="text-slate-500 transition hover:text-slate-800">
                  hello@citreasurehunt.com
                </a>
              </div>
              <div className="flex items-center gap-3 lg:justify-end">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Telegram group"
                  title="Telegram group"
                >
                  <TelegramIcon className="size-5" />
                </a>
                <a
                  href={NEWSLETTER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Newsletter"
                  title="Newsletter"
                >
                  <Mail className="size-5" />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <InstagramIcon className="size-5" />
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Facebook page"
                  title="Facebook page"
                >
                  <FacebookIcon className="size-5" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.9 4.6 18.6 20c-.2 1.1-.8 1.4-1.7.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.8 13.4.7 11.8c-1.1-.3-1.1-1.1.2-1.6L20.8 2.5c.9-.3 1.7.2 1.1 2.1Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.6 1.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M14.1 8.3V6.6c0-.8.5-1 1-1h1.7V2.2C16.5 2.1 15.4 2 14.2 2c-2.7 0-4.5 1.6-4.5 4.6v1.7h-3v3.8h3V22h4.1v-9.9h3l.5-3.8h-3.2Z" />
    </svg>
  );
}
