import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Standard Next.js-safe singleton so dev hot-reload doesn't spawn new
// PrismaClient instances (and new DB connections) on every file edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
