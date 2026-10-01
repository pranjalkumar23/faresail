import { prisma } from "@travel-deals/db";
import { Deal, originCityLabel, toDepartureMonth } from "@travel-deals/shared";

// Reads published deals straight from Postgres. Falls back to an empty list
// (page.tsx then shows the mock deals instead) if the DB isn't reachable -
// keeps local UI work possible even without DATABASE_URL set.
export async function getLiveDeals(): Promise<Deal[]> {
  try {
    const rows = await prisma.deal.findMany({
      where: { status: "LIVE" },
      include: { route: { include: { market: true } } },
      orderBy: { publishedAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      mode: row.mode,
      title: `${row.mode === "FLIGHT" ? "Flight" : "Cruise"} deal to ${row.route.destination}`,
      destination: row.route.destination,
      originAirportOrPort: row.route.origin,
      originCity: originCityLabel(row.route.origin),
      originCountry: row.route.market.name,
      cabinClass: row.route.cabinClass as Deal["cabinClass"],
      stops: row.stops ?? undefined,
      nights: row.nights ?? undefined,
      baggageIncluded: row.baggageIncluded ?? undefined,
      airline: row.airline ?? undefined,
      departureMonth: row.departureMonth ?? (row.departureAt ? toDepartureMonth(row.departureAt) : undefined),
      departureAt: row.departureAt?.toISOString(),
      originalPrice: row.baselinePrice,
      dealPrice: row.price,
      currency: row.route.market.currency,
      discountPct: row.discountPct,
      affiliateUrl: row.affiliateUrl,
      publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    }));
  } catch (err) {
    console.warn("getLiveDeals: could not reach DB, falling back to mock deals.", err);
    return [];
  }
}
