import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProd = process.env.NODE_ENV === "production";

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups",
  );

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Baseline CSP — allow Leaflet CDN/tiles, Next fonts, inline styles from Tailwind.
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.openstreetmap.org",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
    "worker-src 'self' blob:",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // Block obvious scanner probes on auth endpoints with oversized bodies via method gate.
  if (
    request.nextUrl.pathname.startsWith("/api/auth") &&
    request.method !== "GET" &&
    request.method !== "POST" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS"
  ) {
    return new NextResponse(null, { status: 405 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
