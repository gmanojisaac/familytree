import "dotenv/config";
import {defineConfig} from "@playwright/test";
import {testUrl} from "./scripts/test-database.mjs";
const env={...process.env,DATABASE_URL:testUrl("grove_e2e"),BETTER_AUTH_URL:"http://localhost:3001",DEMO_MODE:"true",NEXT_DIST_DIR:".next-e2e"};
export default defineConfig({testDir:"./e2e",fullyParallel:false,workers:1,timeout:90000,expect:{timeout:20000},use:{baseURL:"http://localhost:3001",channel:"chrome",launchOptions:{args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]},permissions:["microphone"],headless:true,viewport:{width:1440,height:1000},trace:"retain-on-failure"},webServer:{command:"node scripts/e2e-server.mjs",url:"http://localhost:3001/api/auth/ok",reuseExistingServer:false,timeout:120000,env:env as Record<string,string>},reporter:[["list"],["html",{open:"never"}]]});
