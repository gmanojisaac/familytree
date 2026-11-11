import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { magicLink } from "better-auth/plugins/magic-link";
import { nextCookies } from "better-auth/next-js";
import nodemailer from "nodemailer";
import { db } from "./db";
import { isDemo } from "./env";

export const auth = betterAuth({
  appName: "Family Grove",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  user: { modelName: "Account" },
  account: { modelName: "AuthIdentity" },
  session: { modelName: "Session", expiresIn: 60 * 60 * 8, cookieCache: { enabled: false } },
  verification: { modelName: "Verification" },
  emailAndPassword: { enabled: isDemo(), disableSignUp: true },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 30, modelName: "RateLimit" },
  plugins: [
    magicLink({
      expiresIn: 300,
      storeToken: "hashed",
      async sendMagicLink({ email, url }) {
        if (!process.env.SMTP_HOST) throw new Error("Email delivery is not configured. Use an explicit local demo persona.");
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_PORT === "465",
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
        });
        await transport.sendMail({ from: process.env.SMTP_FROM, to: email, subject: "Your private Family Grove sign-in",
          text: "Use this one-time link within five minutes to sign in to Family Grove: " + url });
      }
    }),
    nextCookies()
  ],
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" }
});
