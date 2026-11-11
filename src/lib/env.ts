import { z } from "zod";
export function isDemo() { return process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production" && !process.env.VERCEL; }
export function validateRuntime() {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    MEDIA_ENCRYPTION_KEY: z.string().regex(/^[a-f0-9]{64}$/i)
  });
  const result = schema.safeParse(process.env);
  if (!result.success) { console.error("Missing or invalid server configuration fields:", result.error.issues.map(i => i.path.join(".")).join(", ")); throw new Error("Server configuration is incomplete. See .env.example."); }
  if (process.env.NODE_ENV === "production") {
    if (process.env.DEMO_MODE === "true") { console.error("Production demo mode was blocked."); throw new Error("Demo authentication is prohibited in production."); }
    if (process.env.MEDIA_STORAGE !== "s3" || !process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.SMTP_HOST || !process.env.SMTP_FROM) throw new Error("Production requires private S3 storage and verified SMTP configuration.");
    if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) throw new Error("Production requires HTTPS.");
  }
}
