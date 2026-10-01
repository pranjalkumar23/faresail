import { ingestFlights } from "./index";
import { prisma } from "@travel-deals/db";

ingestFlights()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
