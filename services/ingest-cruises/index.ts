// Phase 2 stub. Will run a Playwright scraper against one cruise deal
// aggregator (e.g. Vacations To Go "last-minute deals" listing), normalize
// results into PriceSnapshot/Deal rows via @travel-deals/db.
//
// Runs on a separate always-on host (Railway/Fly.io), not Vercel, since
// headless-browser scraping exceeds serverless function time limits.

export async function ingestCruises(): Promise<void> {
  throw new Error("not implemented yet - Phase 2");
}
