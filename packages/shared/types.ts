export type DealMode = "FLIGHT" | "CRUISE";

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | "INTERIOR" | "OCEANVIEW" | "BALCONY" | "SUITE";

export interface Deal {
  id: string;
  mode: DealMode;
  title: string;
  destination: string;
  originAirportOrPort: string;
  /** Display city for the origin, e.g. "New York" for JFK. */
  originCity: string;
  /** Market name the origin belongs to, e.g. "United States". */
  originCountry: string;
  cabinClass: CabinClass;
  stops?: number;
  nights?: number;
  baggageIncluded?: boolean;
  airline?: string;
  /** Departure month as "YYYY-MM" - the axis the month filter works on. */
  departureMonth?: string;
  /** Exact departure date, when the source provided one. */
  departureAt?: string;
  /**
   * The route's typical price for this departure month, when we have enough
   * tracked history to compute one. Absent for a fare we're still baselining.
   */
  originalPrice?: number;
  dealPrice: number;
  currency: string;
  /** Discount against originalPrice. Absent until a baseline exists. */
  discountPct?: number;
  affiliateUrl: string;
  imageUrl?: string;
  publishedAt: string;
}

export function computeDiscountPct(originalPrice: number, dealPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round((1 - dealPrice / originalPrice) * 100);
}
