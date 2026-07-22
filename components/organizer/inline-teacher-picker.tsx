"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { TEACHER_ROLE_OPTIONS, type OrganizerTeacherItem } from "@/lib/organizer-events";

type ProfileResult = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
};

/**
 * Create-mode teacher picker: keeps selections in local state and hands them to the parent
 * form instead of writing to event_teachers directly, since that table needs a real event id
 * that doesn't exist yet at this point (unlike TeacherManager, which edits an existing event).
 * createEvent inserts these links right after the event row itself. Search mirrors
 * TeacherManager's (same direct profiles query, same "contact us" fallback) for consistency —
 * no inline profile creation, that stays an admin-only curation call.
 */
export function InlineTeacherPicker({
  items,
  onChange,
}: {
  items: OrganizerTeacherItem[];
  onChange: (items: OrganizerTeacherItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  async function handleSearch(nextQuery: string) {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, city, country")
      .ilike("name", `%${nextQuery.trim()}%`)
      .limit(5);
    if (!error && data) {
      setResults(data.filter((r) => !items.some((item) => item.profileId === r.id)));
    }
    setIsSearching(false);
  }

  function addTeacher(result: ProfileResult) {
    onChange([...items, { profileId: result.id, name: result.name, role: TEACHER_ROLE_OPTIONS[0] }]);
    setQuery("");
    setResults([]);
  }

  function updateRole(index: number, role: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, role } : item)));
  }

  function removeTeacher(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const inputClassName =
    "w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-(--color-pine)";

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Teachers</h3>
      <p className="mt-1 text-sm text-slate-600">Add every teacher or musician linked to this event.</p>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${item.profileId}-${index}`} className="rounded-2xl border border-(--color-sand-strong) bg-(--color-mist) p-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-center">
              <p className="font-medium text-slate-950">{item.name}</p>
              <select value={item.role} onChange={(e) => updateRole(index, e.target.value)} className={inputClassName}>
                {TEACHER_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => removeTeacher(index)} className="text-sm font-semibold text-rose-700">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-(--color-sand-strong) bg-(--color-mist) p-4">
        <input
          value={query}
          onChange={(e) => void handleSearch(e.target.value)}
          className={inputClassName}
          placeholder="Search by name…"
        />
        {isSearching ? <p className="mt-2 text-sm text-slate-500">Searching…</p> : null}
        {results.length ? (
          <div className="mt-2 flex flex-col gap-2">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => addTeacher(result)}
                className="rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-left text-sm font-medium text-slate-900"
              >
                {result.name}
                {result.city ? <span className="text-slate-500"> — {[result.city, result.country].filter(Boolean).join(", ")}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
        {query.trim().length >= 2 && !results.length && !isSearching ? (
          <p className="mt-2 text-sm text-slate-600">
            Teacher not listed? Contact us at{" "}
            <a href="mailto:hello@citreasurehunt.com" className="font-medium text-(--color-pine) hover:underline">
              hello@citreasurehunt.com
            </a>{" "}
            and we&apos;ll add them.
          </p>
        ) : null}
      </div>
    </section>
  );
}
