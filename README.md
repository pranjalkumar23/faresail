# Faresail (working name)

A Zomunk-style deal-alert site for flights *and* cruises: continuously track prices, detect genuine
drops against each route's own price history, and publish only the ones that clear a quality bar.
We never handle booking or payment — every deal links out to the airline/cruise line/OTA via an
affiliate link.

## Status: Phase 0 (scaffold) complete

- `apps/web` — Next.js 16 + Tailwind site. Currently rendering the full landing page (hero, deal
  feed with flight/cruise filter, savings calculator, how-it-works, FAQ) against **mock data** from
  `packages/shared/mockDeals.ts`. No real pricing pipeline is wired up yet.
- `packages/db` — Prisma schema (`Market`, `Route`, `PriceSnapshot`, `Deal`, `EmailSubscriber`).
  Not yet connected to a real database — needs `DATABASE_URL`.
- `packages/shared` — shared `Deal` types + mock data used by the web app for now.
- `services/ingest-flights`, `services/ingest-cruises`, `services/detector` — stubs only, throw
  "not implemented yet". These are Phase 1/2 work.

## Run it locally

```bash
cd travel-deals
npm install
npm run dev:web
```

Then open http://localhost:3000. With no database configured, the page falls back to mock deals
from `packages/shared/mockDeals.ts`.

## Local testing of the real pipeline (no external API keys needed)

This exercises the actual DB schema and detector logic — not the UI mock data — using synthetic
price history instead of live Travelpayouts/Amadeus/cruise-scraper data:

```bash
npm run db:up             # starts local Postgres via docker-compose (needs Docker running)
npm run db:migrate        # applies packages/db/schema.prisma
npm run db:seed           # seeds 1 flight + 1 cruise route with ~10 days of price history
                           # plus one genuine price drop each (57% and 50% off)
npm run detect             # runs services/detector against that history — should report both
                           # routes as "created": true with their discount %
npm run publish:pending    # flips PENDING deals to LIVE (stands in for the Phase 3 admin
                           # review queue, which doesn't exist yet)
```

Then run the dev server with `DATABASE_URL` pointed at local Postgres (the `faresail-web` launch
config in `.claude/launch.json` already does this) and reload — the feed should now show the 2
seeded deals instead of the mock ones. `apps/web/app/lib/getDeals.ts` reads `Deal` rows with
`status: LIVE` straight from Postgres and falls back to mock data if the DB is empty/unreachable.

Re-running `npm run detect` is idempotent — it won't create duplicate deals for a price it's
already flagged.

## What's needed from you before Phase 1 (flights) can start

I can't create third-party accounts on your behalf — please sign up for these and share the
resulting keys/connection strings when ready:

1. **Travelpayouts** (free) — https://www.travelpayouts.com/ — primary flight data source, and its
   deep links already carry your affiliate tracking so bookings from the site earn you commission.
2. **Amadeus for Developers** (free tier) — https://developers.amadeus.com/ — secondary flight data
   source for richer fare-family data (stops, baggage) where Travelpayouts coverage is thin.
3. **Supabase** (free tier) — https://supabase.com/ — Postgres database. Once created, copy the
   connection string into `packages/db/.env` (see `packages/db/.env.example`) as `DATABASE_URL`.
4. **Vercel** — https://vercel.com/ — hosting for `apps/web` when we're ready to deploy.

Phase 2 (cruises) will additionally need a decision on which specific cruise deal
aggregator(s) to scrape first, and Phase 4 (email alerts) will need a Resend or SendGrid account —
neither is needed yet.

## Monorepo layout

```
apps/web            Next.js site (public pages + will host the admin review queue later)
services/           scheduled ingestion + deal-detection jobs (currently stubs)
packages/db         Prisma schema + client, shared by web and services
packages/shared     Deal types + mock data
```
