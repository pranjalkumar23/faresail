import { prisma } from "./index";

// Local-testing fixture: seeds one flight route and one cruise route with
// ~10 days of "normal" price history, then a final snapshot that's a genuine
// price drop for each. Used to exercise services/detector end-to-end without
// needing real Travelpayouts/Amadeus/cruise-scraper data yet.
async function main() {
  const market = await prisma.market.upsert({
    where: { id: "test-market" },
    update: {},
    create: {
      id: "test-market",
      name: "Test Market",
      currency: "USD",
      originAirports: ["JFK"],
      originPorts: ["Miami, FL"],
    },
  });

  const flightRoute = await prisma.route.upsert({
    where: {
      marketId_mode_origin_destination_cabinClass: {
        marketId: market.id,
        mode: "FLIGHT",
        origin: "JFK",
        destination: "Tokyo, Japan",
        cabinClass: "ECONOMY",
      },
    },
    update: {},
    create: {
      marketId: market.id,
      mode: "FLIGHT",
      origin: "JFK",
      destination: "Tokyo, Japan",
      cabinClass: "ECONOMY",
    },
  });

  const cruiseRoute = await prisma.route.upsert({
    where: {
      marketId_mode_origin_destination_cabinClass: {
        marketId: market.id,
        mode: "CRUISE",
        origin: "Miami, FL",
        destination: "Eastern Caribbean",
        cabinClass: "BALCONY",
      },
    },
    update: {},
    create: {
      marketId: market.id,
      mode: "CRUISE",
      origin: "Miami, FL",
      destination: "Eastern Caribbean",
      cabinClass: "BALCONY",
    },
  });

  await prisma.deal.deleteMany({ where: { routeId: { in: [flightRoute.id, cruiseRoute.id] } } });
  await prisma.priceSnapshot.deleteMany({
    where: { routeId: { in: [flightRoute.id, cruiseRoute.id] } },
  });

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  // Normal fluctuation around ~$950, non-stop, bag included.
  const flightHistory = [980, 940, 960, 1000, 920, 955, 970, 930, 945, 990];
  for (let i = 0; i < flightHistory.length; i++) {
    await prisma.priceSnapshot.create({
      data: {
        routeId: flightRoute.id,
        observedAt: daysAgo(flightHistory.length - i),
        price: flightHistory[i],
        source: "seed-test",
        rawJson: { stops: 0, baggageIncluded: true },
      },
    });
  }
  // Synthetic drop: ~57% off, still non-stop with a bag - should pass every filter.
  await prisma.priceSnapshot.create({
    data: {
      routeId: flightRoute.id,
      observedAt: now,
      price: 410,
      source: "seed-test",
      rawJson: { stops: 0, baggageIncluded: true },
    },
  });

  // Normal fluctuation around ~$1800 for a 7-night balcony cabin.
  const cruiseHistory = [1780, 1820, 1795, 1810, 1760, 1830, 1790, 1805];
  for (let i = 0; i < cruiseHistory.length; i++) {
    await prisma.priceSnapshot.create({
      data: {
        routeId: cruiseRoute.id,
        observedAt: daysAgo(cruiseHistory.length - i),
        price: cruiseHistory[i],
        source: "seed-test",
        rawJson: { nights: 7 },
      },
    });
  }
  // Synthetic drop: ~50% off.
  await prisma.priceSnapshot.create({
    data: {
      routeId: cruiseRoute.id,
      observedAt: now,
      price: 899,
      source: "seed-test",
      rawJson: { nights: 7 },
    },
  });

  console.log("Seeded market, 2 routes, and price history (including one drop per route).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
