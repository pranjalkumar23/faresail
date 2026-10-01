import { prisma } from "./index";

// Stands in for the Phase 3 admin review queue, which doesn't exist yet:
// flips every PENDING deal to LIVE so it shows up on the public feed.
async function main() {
  const result = await prisma.deal.updateMany({
    where: { status: "PENDING" },
    data: { status: "LIVE", publishedAt: new Date() },
  });
  console.log(`Published ${result.count} deal(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
