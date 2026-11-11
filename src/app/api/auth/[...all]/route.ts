import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { validateRuntime } from "@/lib/env";
import { failure } from "@/lib/http";
const handler = toNextJsHandler(auth);
export async function GET(request: Request) { try { validateRuntime(); return await handler.GET(request); } catch (e) { return failure(e); } }
export async function POST(request: Request) { try { validateRuntime(); return await handler.POST(request); } catch (e) { console.error("Auth route error:", e instanceof Error ? e.message.split("\n")[0] : "Unknown"); return failure(e); } }
