import fs from "node:fs";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
if(process.env.NODE_ENV==="production"||process.env.VERCEL)throw new Error("Local demo setup is forbidden in production.");
if(!fs.existsSync(".env")){
 const values={DATABASE_URL:"postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable",BETTER_AUTH_URL:"http://localhost:3000",BETTER_AUTH_SECRET:crypto.randomBytes(48).toString("hex"),MEDIA_ENCRYPTION_KEY:crypto.randomBytes(32).toString("hex"),MEDIA_STORAGE:"local",MEDIA_LOCAL_DIR:".private-media",DEMO_MODE:"true"};
 fs.writeFileSync(".env",Object.entries(values).map(([k,v])=>k+"="+v).join("\n")+"\n",{flag:"wx"});
}else if(!fs.readFileSync(".env","utf8").includes("DEMO_MODE=true"))throw new Error("An existing non-demo .env was found. Use db:migrate and your own bootstrap; it has not been changed.");
function run(args){const r=spawnSync(process.execPath,["node_modules/prisma/build/index.js",...args],{stdio:"inherit",env:process.env});if(r.status!==0)process.exit(r.status??1);}
run(["dev","--name","familygrove","--detach","--port","51213","--db-port","51214","--shadow-db-port","51215"]);
run(["generate"]);run(["migrate","deploy"]);run(["db","seed"]);
console.log("Demo setup complete. Run npm run dev, then visit http://localhost:3000.");
