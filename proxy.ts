import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication on the main domain
const publicRoutes = ["/login", "/sign-up", "/forgot-password", "/reset-password", "/verify-email", "/accept-invite"];

// Main domains that shouldn't be treated as subdomains
const MAIN_DOMAINS = new Set(["localhost:3000", "veylo.local:3000", "veylo.com", "www.veylo.com"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 1. Determine if we are on a tenant subdomain
  const isMainDomain = MAIN_DOMAINS.has(hostname);
  let subdomain = "";
  if (!isMainDomain) {
    const hostnameWithoutPort = hostname.split(":")[0];
    const parts = hostnameWithoutPort.split(".");
    
    // For localhost, we expect at least 2 parts (sub.localhost)
    // For other domains, we expect at least 3 parts (sub.domain.com) 
    // or we check against known main domains
    if (hostnameWithoutPort === "localhost") {
      subdomain = ""; // Main domain
    } else if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
      subdomain = parts[0];
    } else if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }

  const sessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");
  const isAuthenticated = !!sessionCookie;

  const isAuthRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 2. Handle routing for Subdomains (Tenant Context)
  if (subdomain) {
    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isAuthenticated && !isAuthRoute && pathname !== "/" && pathname !== "/unauthorized") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Pass the subdomain to the application via a header so components can use it
    const response = NextResponse.next();
    response.headers.set("x-tenant-slug", subdomain);
    return response;
  }

  // 3. Handle routing for Main Domain
  if (!isAuthenticated && !isAuthRoute && pathname !== "/" && pathname !== "/unauthorized") {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

