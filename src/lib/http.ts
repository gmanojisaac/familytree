import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function requireThat(condition: unknown, status = 403, message = "This action is not permitted."): asserts condition {
  if (!condition) throw new ApiError(status, message);
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 20000) throw new ApiError(413, "Request is too large.");
  const text = await request.text();
  if (text.length > 20000) throw new ApiError(413, "Request is too large.");
  try { return JSON.parse(text); } catch { throw new ApiError(400, "Invalid JSON."); }
}
export function sameOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").origin;
  requireThat(request.headers.get("origin") === expected, 403, "A same-origin request is required.");
}
export function failure(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError) return Response.json({ error: "Check the selected values. Unrecognized fields and free text messages are rejected." }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034", "P2003"].includes(error.code)) return Response.json({ error: "This record changed or already exists. Refresh and try again." }, { status: 409 });
  return Response.json({ error: "The request could not be completed. Please try again." }, { status: 500 });
}
