import { prisma } from "./index";
import { toDepartureMonth } from "@travel-deals/shared";

// One-off migration helper: snapshots ingested before month-aware tracking
// stored their departure date only inside rawJson. This lifts it into the
// departureAt / departureMonth columns so the detector can group that existing
// history by departure month instead of lumping it under "unknown".
async function main() {
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { departureMonth: null },
    select: { id: true, rawJson: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const snapshot of snapshots) {
    const raw = snapshot.rawJson as { departureAt?: string } | null;
    const rawDeparture = raw?.departureAt;
    const parsed = rawDeparture ? new Date(rawDeparture) : null;

    if (!parsed || Number.isNaN(parsed.getTime())) {
      skipped++;
      continue;
    }

    await prisma.priceSnapshot.update({
      where: { id: snapshot.id },
      data: { departureAt: parsed, departureMonth: toDepartureMonth(parsed) },
    });
    updated++;
  }

  console.log(
    `Backfilled ${updated} snapshot(s); skipped ${skipped} with no usable departure date in rawJson.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
