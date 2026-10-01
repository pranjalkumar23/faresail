import { Deal } from "./types";

export interface BookingLink {
  label: string;
  url: string;
  /**
   * False when we could not confirm the portal accepts this deep-link shape.
   * The UI still offers it, but treat the format as needing a real-browser check.
   */
  verified: boolean;
}

// IATA codes for the destinations we track. Routes persist a human label
// ("Bangkok, Thailand") rather than a code, but booking portals need the code.
//
// Keep in sync with DESTINATIONS_BY_MARKET in services/ingest-flights/index.ts.
// An unknown label is not a correctness problem: linkers that need a code are
// skipped, and the ones that accept a city name fall back to the label.
const DESTINATION_CODES: Record<string, string> = {
  "Paris, France": "CDG",
  "Tokyo, Japan": "NRT",
  "Lisbon, Portugal": "LIS",
  "Barcelona, Spain": "BCN",
  "Cancun, Mexico": "CUN",
  "Dubai, UAE": "DXB",
  "Bangkok, Thailand": "BKK",
  "Cape Town, South Africa": "CPT",
  "New York, USA": "JFK",
  Singapore: "SIN",
  "London, UK": "LHR",
  "Bali, Indonesia": "DPS",
};

export function destinationCode(destination: string): string | null {
  return DESTINATION_CODES[destination] ?? null;
}

/** "2026-08-28" in UTC, or null when the deal has no exact departure date. */
function isoDate(deal: Deal): string | null {
  if (!deal.departureAt) return null;
  const date = new Date(deal.departureAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** "28/08/2026" - the day-first format MakeMyTrip's itinerary param expects. */
function dayFirstDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Alternative booking portals for a deal, for travellers who would rather book
 * somewhere they already have an account. These are plain search deep links -
 * they land on the right route and date, but the exact fare we found is only
 * guaranteed on the affiliate link the price came from.
 */
export function bookingLinks(deal: Deal): BookingLink[] {
  if (deal.mode !== "FLIGHT") return [];

  const iso = isoDate(deal);
  if (!iso) return [];

  const origin = deal.originAirportOrPort;
  const code = destinationCode(deal.destination);
  const links: BookingLink[] = [];

  // Google Flights resolves plain city names, so this works with or without a
  // known IATA code.
  const googleQuery = `flights from ${origin} to ${code ?? deal.destination} on ${iso}`;
  links.push({
    label: "Google Flights",
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(googleQuery)}`,
    verified: true,
  });

  if (code) {
    links.push({
      label: "Kayak",
      url: `https://www.kayak.com/flights/${origin}-${code}/${iso}`,
      verified: true,
    });

    // MakeMyTrip is the natural choice for Indian departures. Their bot
    // protection refused our verification request, so the deep-link shape is
    // unconfirmed - see the note in the README/handover before relying on it.
    if (deal.originCountry === "India") {
      const itinerary = `${origin}-${code}-${dayFirstDate(iso)}`;
      links.push({
        label: "MakeMyTrip",
        url:
          `https://www.makemytrip.com/flight/search?itinerary=${itinerary}` +
          `&tripType=O&paxType=A-1&cabinClass=E`,
        verified: false,
      });
    }
  }

  return links;
}
