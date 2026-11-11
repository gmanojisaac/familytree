import "dotenv/config";
import {spawn} from "node:child_process";
import {prepare,testUrl} from "./test-database.mjs";
await prepare("grove_e2e");
const env={...process.env,DATABASE_URL:testUrl("grove_e2e"),BETTER_AUTH_URL:"http://localhost:3001",DEMO_MODE:"true",NEXT_DIST_DIR:".next-e2e",NODE_ENV:"development"};
delete env.FORCE_COLOR;delete env.NO_COLOR;
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--webpack","--port","3001"],{stdio:"inherit",env});
child.on("exit",code=>process.exit(code??1));process.on("SIGINT",()=>child.kill("SIGINT"));process.on("SIGTERM",()=>child.kill("SIGTERM"));
