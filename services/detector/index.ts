import { prisma } from "@travel-deals/db";

const DISCOUNT_THRESHOLD_PCT = 40;
const MAX_FLIGHT_STOPS = 1;
const BASELINE_WINDOW_DAYS = 90;

interface SnapshotMeta {
  stops?: number;
  baggageIncluded?: boolean;
  nights?: number;
  affiliateUrl?: string;
  airline?: string;
}

// Snapshots with no departure month recorded (pre-dating month-aware
// ingestion) are baselined together under this key rather than being dropped.
const UNKNOWN_MONTH = "unknown";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface DetectionResult {
  routeId: string;
  destination: string;
  departureMonth: string;
  created: boolean;
  discountPct?: number;
  reason?: string;
}

// For each route *and departure month*, compares the latest PriceSnapshot
// against the median of that month's trailing price history (the "baseline").
// Anything >=40% below baseline, and passing the flight stops filter, becomes a
// PENDING Deal awaiting the curation step (Phase 3 - not built yet, so deals
// stay PENDING until manually flipped to LIVE).
//
// Baselining per departure month matters: off-season fares can sit far below
// peak-season ones on the same route, so a single blended baseline would
// report every cheap month as a "price drop".
export async function detectDeals(): Promise<DetectionResult[]> {
  const routes = await prisma.route.findMany({
    include: { snapshots: { orderBy: { observedAt: "asc" } } },
  });

  const results: DetectionResult[] = [];

  for (const route of routes) {
    const byMonth = new Map<string, typeof route.snapshots>();
    for (const snapshot of route.snapshots) {
      const key = snapshot.departureMonth ?? UNKNOWN_MONTH;
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(snapshot);
      else byMonth.set(key, [snapshot]);
    }

    if (byMonth.size === 0) {
      results.push({
        routeId: route.id,
        destination: route.destination,
        departureMonth: UNKNOWN_MONTH,
        created: false,
        reason: "not enough price history",
      });
      continue;
    }

    for (const [departureMonth, snapshots] of [...byMonth.entries()].sort()) {
      const base = { routeId: route.id, destination: route.destination, departureMonth };

      if (snapshots.length < 2) {
        results.push({ ...base, created: false, reason: "not enough price history" });
        continue;
      }

      const candidate = snapshots[snapshots.length - 1];
      const windowStart = new Date(
        candidate.observedAt.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
      const history = snapshots.filter(
        (s) => s.id !== candidate.id && s.observedAt >= windowStart,
      );

      if (history.length === 0) {
        results.push({ ...base, created: false, reason: "no history in baseline window" });
        continue;
      }

      const baseline = median(history.map((s) => s.price));
      const discountPct = Math.round((1 - candidate.price / baseline) * 100);
      const meta = (candidate.rawJson as SnapshotMeta | null) ?? {};
      const passesQualityFilter = route.mode !== "FLIGHT" || (meta.stops ?? 0) <= MAX_FLIGHT_STOPS;

      if (discountPct < DISCOUNT_THRESHOLD_PCT) {
        results.push({ ...base, created: false, discountPct, reason: "below discount threshold" });
        continue;
      }
      if (!passesQualityFilter) {
        results.push({
          ...base,
          created: false,
          discountPct,
          reason: "fails quality filter (too many stops)",
        });
        continue;
      }

      const existing = await prisma.deal.findFirst({
        where: { routeId: route.id, price: candidate.price, departureMonth: candidate.departureMonth },
      });
      if (existing) {
        results.push({
          ...base,
          created: false,
          discountPct,
          reason: "deal already exists for this price",
        });
        continue;
      }

      await prisma.deal.create({
        data: {
          routeId: route.id,
          mode: route.mode,
          price: candidate.price,
          baselinePrice: baseline,
          discountPct,
          stops: meta.stops,
          nights: meta.nights,
          baggageIncluded: meta.baggageIncluded,
          airline: meta.airline,
          departureAt: candidate.departureAt,
          departureMonth: candidate.departureMonth,
          affiliateUrl:
            meta.affiliateUrl ?? (route.mode === "FLIGHT" ? "https://www.google.com/travel/flights" : "#"),
          status: "PENDING",
        },
      });

      results.push({ ...base, created: true, discountPct });
    }
  }

  return results;
}
