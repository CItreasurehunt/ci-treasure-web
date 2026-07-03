"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export function CountryFilter({
  countries,
  selectedCountry,
}: {
  countries: Array<{ value: string; label: string }>;
  selectedCountry: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedCountry}
      onChange={(event) => {
        const params = new URLSearchParams(window.location.search);
        const value = event.target.value;

        if (value) {
          params.set("country", value);
        } else {
          params.delete("country");
        }

        startTransition(() => {
          const query = params.toString();
          router.push(query ? `/?${query}#events` : "/#events", { scroll: false });
        });
      }}
      className="w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-(--color-pine) focus:ring-2 focus:ring-(--color-pine)/20"
    >
      <option value="">All countries</option>
      {countries.map((country) => (
        <option key={country.value} value={country.value}>
          {country.label}
        </option>
      ))}
    </select>
  );
}
