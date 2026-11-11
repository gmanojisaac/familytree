import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { groveDb?: PrismaClient };
export const db = globalDb.groveDb ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/familygrove" }, { schema: new URL(process.env.DATABASE_URL ?? "postgresql://localhost/familygrove").searchParams.get("schema") ?? "public" })
});
if (process.env.NODE_ENV !== "production") globalDb.groveDb = db;
