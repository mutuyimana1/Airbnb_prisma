// config/prisma.ts
import "dotenv/config"; 
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg"; // Use the native pg Pool

if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: DATABASE_URL environment variable is missing.");
}

// Initialize the standard driver pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for secure Neon connections
});

// Pass the pool directly into the native Prisma PostgreSQL adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const connectDb = async () => {
  // A quick query validates that the Neon string is functioning correctly
  await prisma.$queryRaw`SELECT 1`; 
  console.log("Connected to Neon database successfully via Prisma");
};

export default prisma;
