import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: ["three"],
  poweredByHeader: false,
  outputFileTracingExcludes: { "*": [".private-media/**/*", ".env*", ".git/**/*", ".local/**/*", "src/family-grove-codex-starter-kit/**/*"] },
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` }
    ] }, { source: "/api/:path*", headers: [
      { key: "Cache-Control", value: "no-store, private" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" }
    ] }, ...["/grove/:path*", "/invite", "/login"].map(source => ({ source, headers: [ { key: "Cache-Control", value: "no-store, private" }, { key: "X-Robots-Tag", value: "noindex, nofollow" } ] }))];
  }
};
export default config;
