import "dotenv/config";
import {Pool} from "pg";
import {spawnSync} from "node:child_process";
export function testUrl(schema){if(!["grove_tests","grove_e2e"].includes(schema))throw new Error("Invalid test schema");const u=new URL(process.env.DATABASE_URL);if(!["localhost","127.0.0.1"].includes(u.hostname))throw new Error("Tests only reset a dedicated schema on loopback PostgreSQL. Never use a live family database.");u.searchParams.set("schema",schema);return u.toString();}
export async function prepare(schema){
 const url=testUrl(schema),pool=new Pool({connectionString:url});await pool.query('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');await pool.query('CREATE SCHEMA "'+schema+'"');await pool.end();
 const env={...process.env,DATABASE_URL:url,DEMO_MODE:"true"};
 for(const args of [["node_modules/prisma/build/index.js","migrate","deploy"],["node_modules/tsx/dist/cli.mjs","prisma/seed.ts"]]){const r=spawnSync(process.execPath,args,{stdio:"inherit",env});if(r.status!==0)throw new Error("Test database setup failed");}
}
