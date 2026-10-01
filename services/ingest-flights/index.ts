import "dotenv/config";
import { prisma } from "@travel-deals/db";
import { toDepartureMonth, upcomingMonths } from "@travel-deals/shared";

const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const TRAVELPAYOUTS_MARKER = process.env.TRAVELPAYOUTS_MARKER;

// How many departure months ahead to price each route for. Travellers browse
// by month, and seasonality means each month needs its own price history, so
// every run samples the cheapest fare in each of the next N months.
const MONTHS_AHEAD = 6;

// Courtesy pause between API calls. With 15 routes x 6 months a run issues ~90
// requests, so this keeps us comfortably inside Travelpayouts' rate limits.
const REQUEST_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MarketConfig {
  id: string;
  name: string;
  currency: string;
  originAirports: string[];
}

// Starter markets per the plan: a handful of seeded regions rather than
// hardcoding one home country, so adding more later is just another row +
// more destinations, not a code change.
const MARKETS: MarketConfig[] = [
  { id: "market-us", name: "United States", currency: "usd", originAirports: ["JFK"] },
  { id: "market-uk", name: "United Kingdom", currency: "gbp", originAirports: ["LHR"] },
  { id: "market-india", name: "India", currency: "inr", originAirports: ["DEL"] },
];

interface DestinationConfig {
  code: string;
  label: string;
}

// Curated per-market destination lists (popular leisure routes). Kept modest
// so a daily ingestion run stays well within Travelpayouts' rate limits.
const DESTINATIONS_BY_MARKET: Record<string, DestinationConfig[]> = {
  "market-us": [
    { code: "CDG", label: "Paris, France" },
    { code: "NRT", label: "Tokyo, Japan" },
    { code: "LIS", label: "Lisbon, Portugal" },
    { code: "BCN", label: "Barcelona, Spain" },
    { code: "CUN", label: "Cancun, Mexico" },
  ],
  "market-uk": [
    { code: "DXB", label: "Dubai, UAE" },
    { code: "BKK", label: "Bangkok, Thailand" },
    { code: "BCN", label: "Barcelona, Spain" },
    { code: "CPT", label: "Cape Town, South Africa" },
    { code: "JFK", label: "New York, USA" },
  ],
  "market-india": [
    { code: "BKK", label: "Bangkok, Thailand" },
    { code: "DXB", label: "Dubai, UAE" },
    { code: "SIN", label: "Singapore" },
    { code: "LHR", label: "London, UK" },
    { code: "DPS", label: "Bali, Indonesia" },
  ],
};

interface TravelpayoutsTicket {
  origin: string;
  destination: string;
  price: number;
  transfers: number;
  airline: string;
  departure_at: string;
  return_at?: string;
  link: string;
}

async function ensureMarkets(): Promise<void> {
  for (const m of MARKETS) {
    await prisma.market.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        currency: m.currency.toUpperCase(),
        originAirports: m.originAirports,
        originPorts: [],
      },
    });
  }
}

async function fetchCheapestFare(
  origin: string,
  destination: string,
  currency: string,
  departureMonth: string,
): Promise<TravelpayoutsTicket | null> {
  const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("currency", currency);
  // "YYYY-MM" asks for the cheapest departure anywhere within that month.
  url.searchParams.set("departure_at", departureMonth);
  url.searchParams.set("unique", "true");
  url.searchParams.set("sorting", "price");
  url.searchParams.set("one_way", "false");
  url.searchParams.set("limit", "1");
  url.searchParams.set("token", TRAVELPAYOUTS_TOKEN!);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Travelpayouts request failed (${res.status}): ${await res.text()}`);
  }
  const body = await res.json();
  if (!body.success || !body.data?.length) return null;
  return body.data[0];
}

function buildAffiliateLink(ticketLink: string): string {
  const url = new URL(`https://www.aviasales.com${ticketLink}`);
  url.searchParams.set("marker", TRAVELPAYOUTS_MARKER!);
  return url.toString();
}

export async function ingestFlights(): Promise<void> {
  if (!TRAVELPAYOUTS_TOKEN || !TRAVELPAYOUTS_MARKER) {
    throw new Error(
      "Missing TRAVELPAYOUTS_TOKEN or TRAVELPAYOUTS_MARKER env vars (expected in travel-deals/.env).",
    );
  }

  await ensureMarkets();

  const months = upcomingMonths(new Date(), MONTHS_AHEAD);

  for (const market of MARKETS) {
    const destinations = DESTINATIONS_BY_MARKET[market.id] ?? [];
    for (const origin of market.originAirports) {
      for (const dest of destinations) {
        const route = await prisma.route.upsert({
          where: {
            marketId_mode_origin_destination_cabinClass: {
              marketId: market.id,
              mode: "FLIGHT",
              origin,
              destination: dest.label,
              cabinClass: "ECONOMY",
            },
          },
          update: {},
          create: {
            marketId: market.id,
            mode: "FLIGHT",
            origin,
            destination: dest.label,
            cabinClass: "ECONOMY",
          },
        });

        for (const month of months) {
          const ticket = await fetchCheapestFare(origin, dest.code, market.currency, month);
          await sleep(REQUEST_DELAY_MS);

          if (!ticket) {
            console.log(`[${market.name}] No fare found for ${origin} -> ${dest.label} in ${month}`);
            continue;
          }

          const departureAt = ticket.departure_at ? new Date(ticket.departure_at) : null;
          const validDeparture = departureAt && !Number.isNaN(departureAt.getTime()) ? departureAt : null;
          const departureMonth = validDeparture ? toDepartureMonth(validDeparture) : month;

          // When a month has no fares the API answers with the nearest date it
          // does have, which would otherwise land a second snapshot in another
          // month's bucket - two same-day prices that then baseline against
          // each other and fabricate a discount. Treat a mismatch as "no fare
          // for the month we asked about".
          if (departureMonth !== month) {
            console.log(
              `[${market.name}] No fare found for ${origin} -> ${dest.label} in ${month} (nearest departs ${departureMonth})`,
            );
            continue;
          }

          await prisma.priceSnapshot.create({
            data: {
              routeId: route.id,
              price: ticket.price,
              source: "travelpayouts",
              departureAt: validDeparture,
              departureMonth,
              rawJson: {
                stops: ticket.transfers,
                affiliateUrl: buildAffiliateLink(ticket.link),
                airline: ticket.airline,
                departureAt: ticket.departure_at,
              },
            },
          });

          console.log(
            `[${market.name}] ${origin} -> ${dest.label} (${departureMonth}): ${ticket.price} ${market.currency.toUpperCase()} (${ticket.transfers} stop${ticket.transfers === 1 ? "" : "s"}, ${ticket.airline})`,
          );
        }
      }
    }
  }
}
