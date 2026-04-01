import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicRoutes } from "@/routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check for user_id cookie (new multi-user approach)
  const userId = request.cookies.get("user_id")?.value;

  // Fallback to is_authorized for backward compatibility during transition
  const isAuthorized = request.cookies.get("is_authorized")?.value === "true";

  if (!userId && !isAuthorized) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
