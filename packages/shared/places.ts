// Human-readable labels for the origins we track. Routes store an IATA code
// (flights) or a home port name (cruises); the UI needs a city name to offer a
// "flying from" filter, and the market name supplies the country.
const ORIGIN_CITIES: Record<string, string> = {
  JFK: "New York",
  LGA: "New York",
  EWR: "New York",
  LAX: "Los Angeles",
  ORD: "Chicago",
  SFO: "San Francisco",
  MIA: "Miami",
  LHR: "London",
  LGW: "London",
  MAN: "Manchester",
  EDI: "Edinburgh",
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  MAA: "Chennai",
  HYD: "Hyderabad",
};

// Resolves a Route.origin to a display city. Cruise origins are already stored
// as port names ("Miami, FL"), so anything that isn't a known IATA code is
// passed through unchanged rather than guessed at.
export function originCityLabel(origin: string): string {
  return ORIGIN_CITIES[origin.toUpperCase()] ?? origin;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-10" -> "October 2026". Returns null for anything unparseable so callers
// can fall back to "dates flexible" rather than rendering "Invalid Date".
export function monthLabel(departureMonth: string | undefined | null): string | null {
  if (!departureMonth) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(departureMonth);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

// "YYYY-MM" key for a date, in UTC to match how departure dates are stored.
export function toDepartureMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// The next `count` months starting from `from` (inclusive), as "YYYY-MM" keys.
// Used by ingestion to sweep a rolling window of departure months.
export function upcomingMonths(from: Date, count: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    months.push(toDepartureMonth(d));
  }
  return months;
}
