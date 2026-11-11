import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import catalogue from "../data/occasion_templates.json";
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!},{schema:new URL(process.env.DATABASE_URL!).searchParams.get("schema")??"public"})});
for(const t of catalogue.greetings)await db.greetingTemplate.upsert({where:{id:t.id},create:t,update:t});
for(const t of catalogue.replies)await db.greetingReplyTemplate.upsert({where:{id:t.id},create:t,update:t});
await db.$disconnect();
