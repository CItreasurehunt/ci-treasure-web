"use client";

import { useState } from "react";

import { COUNTRIES } from "@/lib/countries";

/**
 * Search-and-select a country by name, mirroring VenuePicker's interaction (search-as-you-type,
 * selected chip with a "Change" button) so the two location fields feel consistent. Unlike
 * VenuePicker there's no free-text fallback and no create option — the list is fixed and small
 * enough to always contain a match, and that constraint is the point: it's what makes a typo
 * like "UK" (not a real ISO code — "GB" is) impossible to enter (found live 2026-07-22).
 */
export function CountryPicker({
  value,
  onChange,
  inputClassName,
}: {
  value: string;
  onChange: (code: string) => void;
  inputClassName: string;
}) {
  const [query, setQuery] = useState("");
  const selected = COUNTRIES.find((c) => c.code === value);
  const matches = query.trim().length
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-(--color-sand-strong) bg-(--color-mist) px-4 py-3">
        <span className="text-sm font-medium text-slate-900">{selected.name}</span>
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-auto text-sm font-semibold text-(--color-pine) hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClassName}
        placeholder="Search countries…"
      />
      {matches.length ? (
        <div className="flex flex-col gap-2">
          {matches.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setQuery("");
              }}
              className="rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-2 text-left text-sm font-medium text-slate-900 hover:border-(--color-pine)"
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
