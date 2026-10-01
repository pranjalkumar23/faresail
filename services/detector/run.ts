import { detectDeals } from "./index";
import { prisma } from "@travel-deals/db";

detectDeals()
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
