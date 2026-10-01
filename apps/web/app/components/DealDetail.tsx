"use client";

import { Deal, bookingLinks, monthLabel } from "@travel-deals/shared";
import { formatPrice } from "./DealCard";

function formatDate(iso: string | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

// The expanded view for a selected deal. Rendered inline as a full-width cell
// in the deals grid (rather than on its own route) so choosing a deal never
// takes the traveller away from the list they were browsing.
export default function DealDetail({
  deal,
  id,
  onClose,
}: {
  deal: Deal;
  id: string;
  onClose: () => void;
}) {
  const hasBaseline = deal.originalPrice !== undefined && deal.discountPct !== undefined;
  const savings = hasBaseline ? (deal.originalPrice as number) - deal.dealPrice : null;
  const departs = monthLabel(deal.departureMonth);
  const exactDate = formatDate(deal.departureAt);
  const alternatives = bookingLinks(deal);

  const facts: { label: string; value: string }[] = [
    { label: "Route", value: `${deal.originAirportOrPort} → ${deal.destination}` },
    { label: "Departing", value: exactDate ?? departs ?? "Dates flexible" },
    { label: "Cabin", value: deal.cabinClass.replace("_", " ").toLowerCase() },
  ];

  if (deal.mode === "FLIGHT") {
    facts.push({ label: "Stops", value: deal.stops === 0 ? "Non-stop" : `${deal.stops} stop` });
    if (deal.airline) facts.push({ label: "Airline", value: deal.airline });
    facts.push({
      label: "Checked bag",
      value: deal.baggageIncluded ? "Included" : "Not included",
    });
  } else if (deal.nights) {
    facts.push({ label: "Duration", value: `${deal.nights} nights` });
  }

  return (
    <div
      id={id}
      className="col-span-full rounded-2xl border border-teal-500/40 bg-teal-50/60 p-6 dark:border-teal-400/30 dark:bg-teal-950/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {deal.destination}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {deal.mode === "FLIGHT" ? "Flight" : "Cruise"} from {deal.originCity}
            {", "}
            {deal.originCountry}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-white dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Close
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatPrice(deal.dealPrice, deal.currency)}
        </span>
        {hasBaseline && (
          <>
            <span className="text-lg text-zinc-400 line-through">
              {formatPrice(deal.originalPrice as number, deal.currency)}
            </span>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {deal.discountPct}% off
            </span>
          </>
        )}
      </div>

      {hasBaseline ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Saves {formatPrice(savings as number, deal.currency)} against this route&apos;s typical
          {departs ? ` ${departs}` : ""} price of{" "}
          {formatPrice(deal.originalPrice as number, deal.currency)}, measured from our own
          tracked price history.
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          This is the cheapest fare we&apos;ve found for
          {departs ? ` ${departs}` : " this month"}. We&apos;re still building enough price
          history for this route and month to say whether it counts as a genuine drop.
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <Fact key={fact.label} label={fact.label} value={fact.value} />
        ))}
      </dl>

      <div className="mt-6 border-t border-teal-500/20 pt-5 dark:border-teal-400/20">
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={deal.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Go to this fare →
          </a>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Opens this exact itinerary at{" "}
            {formatPrice(deal.dealPrice, deal.currency)} on our booking partner, which lists
            the agencies selling it. Found on{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(deal.publishedAt))}
            {" — "}fares move fast, so the price can change.
          </span>
        </div>

        {alternatives.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Prefer to book elsewhere? Search this route and date on{" "}
            {alternatives.map((link, i) => (
              <span key={link.label}>
                {i > 0 && (i === alternatives.length - 1 ? " or " : ", ")}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                >
                  {link.label}
                </a>
              </span>
            ))}
            . These open a search rather than this exact fare, so prices may differ.
          </p>
        )}
      </div>
    </div>
  );
}
