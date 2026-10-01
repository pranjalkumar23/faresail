"use client";

import { Deal, monthLabel } from "@travel-deals/shared";

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DealCard({
  deal,
  isSelected,
  onSelect,
  detailId,
}: {
  deal: Deal;
  isSelected: boolean;
  onSelect: () => void;
  detailId: string;
}) {
  const detailBits: string[] = [];
  if (deal.mode === "FLIGHT") {
    detailBits.push(deal.stops === 0 ? "Non-stop" : `${deal.stops}-stop`);
    if (deal.baggageIncluded) detailBits.push("Bag included");
  } else {
    if (deal.nights) detailBits.push(`${deal.nights} nights`);
  }

  const departs = monthLabel(deal.departureMonth);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={isSelected}
      aria-controls={detailId}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-shadow hover:shadow-lg dark:bg-zinc-900 ${
        isSelected
          ? "border-teal-500 shadow-lg ring-2 ring-teal-500/40 dark:border-teal-400"
          : "border-black/[.08] dark:border-white/[.12]"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-800 dark:bg-teal-900 dark:text-teal-200">
          {deal.mode === "FLIGHT" ? "Flight" : "Cruise"}
        </span>
        {deal.discountPct !== undefined ? (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {deal.discountPct}% off
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Tracking price
          </span>
        )}
      </div>

      <div className="px-4 pt-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {deal.destination}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          from {deal.originCity} ({deal.originAirportOrPort}) ·{" "}
          {deal.cabinClass.replace("_", " ").toLowerCase()}
        </p>
      </div>

      <p className="px-4 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {[departs ?? "Dates flexible", ...detailBits].join(" · ")}
      </p>

      <div className="mt-3 flex items-baseline gap-2 px-4 pb-4">
        {deal.originalPrice !== undefined && (
          <span className="text-sm text-zinc-400 line-through">
            {formatPrice(deal.originalPrice, deal.currency)}
          </span>
        )}
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatPrice(deal.dealPrice, deal.currency)}
        </span>
      </div>

      <div className="mt-auto border-t border-black/[.06] px-4 py-3 text-sm font-medium text-teal-700 group-hover:underline dark:border-white/[.08] dark:text-teal-400">
        {isSelected ? "Hide details" : "See details"} {isSelected ? "↑" : "↓"}
      </div>
    </button>
  );
}
