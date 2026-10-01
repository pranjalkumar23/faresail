"use client";

import { useState } from "react";

// Placeholder estimate for the pre-launch site. Once the ingestion pipeline
// (services/ingest-flights, services/ingest-cruises) is live, this should
// query real historical PriceSnapshot data for the selected destination
// instead of a flat multiplier.
const DESTINATIONS = [
  { label: "Tokyo, Japan (flight)", avgFullPrice: 950 },
  { label: "Lisbon, Portugal (flight)", avgFullPrice: 780 },
  { label: "Eastern Caribbean (cruise)", avgFullPrice: 1800 },
  { label: "Western Mediterranean (cruise)", avgFullPrice: 1200 },
];

export default function SavingsCalculator() {
  const [destinationIdx, setDestinationIdx] = useState<number | null>(null);
  const [travellers, setTravellers] = useState(1);

  const destination = destinationIdx !== null ? DESTINATIONS[destinationIdx] : null;
  const estimatedSavings = destination
    ? Math.round(destination.avgFullPrice * 0.45 * travellers)
    : null;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-black/[.08] bg-zinc-50 p-8 text-center dark:border-white/[.12] dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
          See how much you could save
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          We sift through countless flight and cruise fares to find the best options for you.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <select
            className="w-full max-w-xs rounded-lg border border-black/[.12] bg-white px-4 py-2.5 text-sm text-zinc-900 dark:border-white/[.16] dark:bg-zinc-800 dark:text-zinc-50"
            value={destinationIdx ?? ""}
            onChange={(e) =>
              setDestinationIdx(e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">Enter destination</option>
            {DESTINATIONS.map((d, i) => (
              <option key={d.label} value={i}>
                {d.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3 rounded-lg border border-black/[.12] bg-white px-4 py-2.5 dark:border-white/[.16] dark:bg-zinc-800">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Travellers</span>
            <button
              type="button"
              aria-label="Decrease travellers"
              onClick={() => setTravellers((t) => Math.max(1, t - 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {travellers}
            </span>
            <button
              type="button"
              aria-label="Increase travellers"
              onClick={() => setTravellers((t) => Math.min(8, t + 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
            >
              +
            </button>
          </div>
        </div>

        <p className="mt-6 text-lg font-medium text-zinc-700 dark:text-zinc-200">
          {estimatedSavings !== null
            ? `You could save roughly $${estimatedSavings.toLocaleString()}`
            : "Select a destination to see savings"}
        </p>

        <button
          type="button"
          className="mt-6 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Start saving
        </button>
      </div>
    </section>
  );
}
