import { prisma } from "./index";

// Clears price history/deals for routes under the "test-market" fixture
// (leaves the Market/Route rows themselves) so real ingestion runs don't mix
// with the synthetic seed data used to test the detector in isolation.
async function main() {
  const routes = await prisma.route.findMany({ where: { marketId: "test-market" } });
  const routeIds = routes.map((r) => r.id);

  const deals = await prisma.deal.deleteMany({ where: { routeId: { in: routeIds } } });
  const snapshots = await prisma.priceSnapshot.deleteMany({ where: { routeId: { in: routeIds } } });

  console.log(`Cleared ${deals.count} deal(s) and ${snapshots.count} snapshot(s) across ${routeIds.length} route(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
