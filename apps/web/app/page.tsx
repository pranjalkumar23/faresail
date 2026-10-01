import { Deal, mockDeals } from "@travel-deals/shared";
import { getLiveDeals } from "./lib/getDeals";
import { getTrackedFares } from "./lib/getFares";
import Header from "./components/Header";
import Hero from "./components/Hero";
import DealsFeed from "./components/DealsFeed";
import SavingsCalculator from "./components/SavingsCalculator";
import HowItWorks from "./components/HowItWorks";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

// The feed is read from Postgres, which changes with every ingestion run and
// may not even be reachable at build time. Without this the page would be
// prerendered once and serve a frozen (or mock-data) fare list forever.
export const revalidate = 3600;

// A curated LIVE deal supersedes the raw tracked fare for the same route and
// departure month, so a route never appears twice in the feed.
function dedupe(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  const result: Deal[] = [];
  for (const deal of deals) {
    const key = `${deal.originAirportOrPort}|${deal.destination}|${deal.departureMonth ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(deal);
  }
  return result;
}

export default async function Home() {
  const [liveDeals, trackedFares] = await Promise.all([getLiveDeals(), getTrackedFares()]);

  // Curated deals first so they win the dedupe against their own raw fare.
  const realListings = dedupe([...liveDeals, ...trackedFares]);

  // mockDeals remain the fallback for working on the UI with no database.
  const deals = realListings.length > 0 ? realListings : mockDeals;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <DealsFeed deals={deals} usingRealData={realListings.length > 0} />
        <SavingsCalculator />
        <HowItWorks />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
