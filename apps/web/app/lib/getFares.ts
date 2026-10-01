import { prisma } from "@travel-deals/db";
import { Deal, originCityLabel, toDepartureMonth } from "@travel-deals/shared";

// Seeded fixture market - real traveller-facing listings should never include it.
const EXCLUDED_MARKET_IDS = ["test-market"];

// How many days of history to baseline a fare against, matching the detector.
const BASELINE_WINDOW_DAYS = 90;

interface SnapshotMeta {
  stops?: number;
  airline?: string;
  affiliateUrl?: string;
  baggageIncluded?: boolean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Real fares from our own tracked price history, one per route per departure
 * month (the most recently observed price).
 *
 * This is deliberately broader than `getLiveDeals()`: a Deal only exists once a
 * fare drops >=40% below its baseline, which takes weeks of history to happen.
 * Browsing by month and budget is a fare-search question, so the feed lists
 * every real fare we track and marks up the ones that are genuine drops.
 */
export async function getTrackedFares(): Promise<Deal[]> {
  try {
    const routes = await prisma.route.findMany({
      where: {
        mode: "FLIGHT",
        marketId: { notIn: EXCLUDED_MARKET_IDS },
      },
      include: {
        market: true,
        snapshots: {
          where: { departureMonth: { not: null } },
          orderBy: { observedAt: "asc" },
        },
      },
    });

    const currentMonth = toDepartureMonth(new Date());
    const listings: Deal[] = [];

    for (const route of routes) {
      const byMonth = new Map<string, typeof route.snapshots>();
      for (const snapshot of route.snapshots) {
        const key = snapshot.departureMonth as string;
        const bucket = byMonth.get(key);
        if (bucket) bucket.push(snapshot);
        else byMonth.set(key, [snapshot]);
      }

      for (const [departureMonth, snapshots] of byMonth) {
        // Don't advertise months that have already departed.
        if (departureMonth < currentMonth) continue;

        const latest = snapshots[snapshots.length - 1];
        const meta = (latest.rawJson as SnapshotMeta | null) ?? {};

        // Baseline this fare against earlier observations of the same route and
        // departure month, so any discount shown is season-comparable.
        const windowStart = new Date(
          latest.observedAt.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        );
        const history = snapshots.filter(
          (s) => s.id !== latest.id && s.observedAt >= windowStart,
        );

        const baseline = history.length > 0 ? median(history.map((s) => s.price)) : null;
        const discountPct =
          baseline !== null && baseline > 0
            ? Math.round((1 - latest.price / baseline) * 100)
            : null;

        listings.push({
          id: latest.id,
          mode: "FLIGHT",
          title: `Flight to ${route.destination}`,
          destination: route.destination,
          originAirportOrPort: route.origin,
          originCity: originCityLabel(route.origin),
          originCountry: route.market.name,
          cabinClass: route.cabinClass as Deal["cabinClass"],
          stops: meta.stops,
          baggageIncluded: meta.baggageIncluded,
          airline: meta.airline,
          departureMonth,
          departureAt: latest.departureAt?.toISOString(),
          // Only claim a "was" price when there is real history behind it.
          originalPrice: discountPct !== null && discountPct > 0 ? (baseline as number) : undefined,
          dealPrice: latest.price,
          currency: route.market.currency,
          discountPct: discountPct !== null && discountPct > 0 ? discountPct : undefined,
          affiliateUrl: meta.affiliateUrl ?? "https://www.aviasales.com",
          publishedAt: latest.observedAt.toISOString(),
        });
      }
    }

    // Best discounts first, then cheapest - so the strongest value leads.
    return listings.sort(
      (a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0) || a.dealPrice - b.dealPrice,
    );
  } catch (err) {
    console.warn("getTrackedFares: could not reach DB.", err);
    return [];
  }
}
