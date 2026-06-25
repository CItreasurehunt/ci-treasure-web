"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, Map, List, X } from "lucide-react";

import { EventCard } from "./event-card";
import { Button } from "./ui/button";
import { getCountryLabel, getTypeLabel, type EventListItem } from "@/lib/events";
import { TELEGRAM_URL } from "@/lib/site";

// Dynamically load the Map component without SSR to avoid 'window is not defined' errors
const EventMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Loading Interactive Map...</p>
      </div>
    </div>
  ),
});

type EventsDashboardProps = {
  events: EventListItem[];
};

export function EventsDashboard({ events }: EventsDashboardProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [soonOnly, setSoonOnly] = useState(false);
  
  // Interaction state
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  
  // Mobile view state: 'list' | 'map'
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedType("");
    setSelectedMonth("");
    setSoonOnly(false);
    setHighlightedEventId(null);
  };

  // Helper: check if event is within next 14 days
  const isSoon = (startDateStr: string) => {
    try {
      const start = new Date(startDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    } catch {
      return false;
    }
  };

  // Extract unique countries from loaded events list for dropdown options
  const countryOptions = useMemo(() => {
    const countries = Array.from(new Set(events.map((e) => e.country)));
    return countries
      .map((c) => ({ value: c, label: getCountryLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [events]);

  // Extract unique types from loaded events list
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(events.map((e) => e.type)));
    return types
      .map((t) => ({ value: t, label: getTypeLabel(t) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [events]);

  // Extract unique months from events for the month filter
  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(events.map((e) => e.startDate.substring(0, 7))));
    return months.sort().map((m) => {
      const [year, month] = m.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
      return { value: m, label };
    });
  }, [events]);

  // Filter events locally on the client (blasing fast, updates map and list instantly)
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Search Query (matches title, description, city, country)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = event.title?.toLowerCase().includes(query);
        const descMatch = event.description?.toLowerCase().includes(query);
        const cityMatch = event.city?.toLowerCase().includes(query);
        const countryMatch = getCountryLabel(event.country).toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !cityMatch && !countryMatch) {
          return false;
        }
      }

      // 2. Country Match
      if (selectedCountry && event.country !== selectedCountry) {
        return false;
      }

      // 3. Event Type Match
      if (selectedType && event.type !== selectedType) {
        return false;
      }

      // 4. Month Match
      if (selectedMonth && !event.startDate.startsWith(selectedMonth)) {
        return false;
      }

      // 5. Happening Soon (next 14 days)
      if (soonOnly && !isSoon(event.startDate)) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCountry, selectedType, selectedMonth, soonOnly]);

  const handleCardClick = (eventId: string) => {
    setHighlightedEventId(eventId);
    // Switch to map view on mobile if user clicks on cards, so they see where it is
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView("map");
    }
  };

  const handleMarkerClick = (eventId: string) => {
    setHighlightedEventId(eventId);
    
    // Find the card element and scroll to it in the sidebar
    const cardElement = document.getElementById(`event-card-${eventId}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-3 pr-4 pl-11 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Toggle buttons for Mobile split view */}
          <div className="flex border-t border-slate-100 pt-3 sm:border-none sm:pt-0 lg:hidden">
            <button
              onClick={() => setMobileView("list")}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
                mobileView === "list"
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <List className="size-4" />
              List
            </button>
            <button
              onClick={() => setMobileView("map")}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
                mobileView === "map"
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Map className="size-4" />
              Map
            </button>
          </div>
        </div>

        {/* Extended filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 md:pt-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Country Selector */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-44"
            >
              <option value="">All Countries</option>
              {countryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Type Selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-44"
            >
              <option value="">All Event Types</option>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-44"
            >
              <option value="">All Months</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Soon checkbox */}
            <label className="flex items-center gap-2 py-1 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soonOnly}
                onChange={(e) => setSoonOnly(e.target.checked)}
                className="rounded border-slate-300 text-violet-600 outline-none transition focus:ring-violet-500/20"
              />
              <span>Happening soon (14 days)</span>
            </label>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 w-full justify-between sm:w-auto sm:justify-end border-t border-slate-50 pt-2 sm:border-none sm:pt-0">
            <span>
              {filteredEvents.length} of {events.length} events
            </span>
            {(searchQuery || selectedCountry || selectedType || selectedMonth || soonOnly) && (
              <button
                onClick={resetFilters}
                className="text-violet-600 hover:text-violet-800 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[500px]">
        {/* Event List (Left side on desktop - Col 5) */}
        <div
          className={`lg:col-span-4 h-full overflow-y-auto pr-1 space-y-3 ${
            mobileView === "list" ? "block" : "hidden lg:block"
          }`}
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                onClick={() => handleCardClick(event.id)}
                className={`cursor-pointer transition rounded-lg ${
                  highlightedEventId === event.id
                    ? "ring-2 ring-violet-500 ring-offset-2 scale-[0.99] shadow-sm"
                    : ""
                }`}
              >
                <EventCard event={event} compact />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/75 px-6 py-16 text-center">
              <p className="font-serif text-xl text-slate-900 font-medium">No gatherings found matching filters.</p>
              <p className="mt-2 text-sm text-slate-500">
                Try widening your parameters or clearing the search box.
              </p>
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="mt-4 border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {/* Map Panel (Right side on desktop - Col 7) */}
        <div
          className={`lg:col-span-8 h-full ${
            mobileView === "map" ? "block" : "hidden lg:block"
          }`}
        >
          <EventMap
            events={filteredEvents}
            highlightedEventId={highlightedEventId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>

      {/* Is your event missing? */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600 sm:flex-row sm:text-left">
        <span>Is your event missing?</span>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[--color-pine] underline decoration-[--color-pine]/35 underline-offset-4 transition hover:decoration-[--color-pine]"
          >
            Post it in our Telegram group
          </a>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <a
            href="mailto:hello@citreasurehunt.com"
            className="font-medium text-[--color-pine] underline decoration-[--color-pine]/35 underline-offset-4 transition hover:decoration-[--color-pine]"
          >
            hello@citreasurehunt.com
          </a>
        </div>
      </div>
    </div>
  );
}
