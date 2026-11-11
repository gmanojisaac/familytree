import "dotenv/config";
import {defineConfig} from "vitest/config";
import path from "node:path";
import {testUrl} from "./scripts/test-database.mjs";
process.env.DATABASE_URL=testUrl("grove_tests");
export default defineConfig({resolve:{alias:{"@":path.resolve("src")}},test:{include:["tests/**/*.test.ts"],globalSetup:["tests/setup.ts"],fileParallelism:false,testTimeout:30000}});
