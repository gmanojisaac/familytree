import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDemo, validateRuntime } from "@/lib/env";
import { sameOrigin, jsonBody, failure, requireThat } from "@/lib/http";
export async function POST(request: Request) {
  try {
    requireThat(isDemo(), 404, "Not found."); validateRuntime(); sameOrigin(request);
    const { persona } = z.object({ persona: z.enum(["maya", "arun", "lila", "moderator", "outsider"]) }).strict().parse(await jsonBody(request));
    return await auth.api.signInEmail({ body: { email: persona + "@example.invalid", password: "Fictional-demo-only!2026" }, asResponse: true, headers: request.headers });
  } catch(e) { return failure(e); }
}
