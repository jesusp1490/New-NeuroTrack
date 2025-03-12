import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check for Firebase auth cookie
  const authCookie = request.cookies.get("__session") || request.cookies.get("firebase-auth-token")
  const { pathname } = request.nextUrl

  // Paths that don't require authentication
  const publicPaths = ["/", "/login", "/signup", "/forgot-password"]
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api")

  // If not authenticated and trying to access protected route
  if (!authCookie && !isPublicPath) {
    console.log(`Redirecting unauthenticated user from ${pathname} to /login`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If authenticated and trying to access login/signup
  if (authCookie && (pathname === "/login" || pathname === "/signup")) {
    console.log(`Redirecting authenticated user from ${pathname} to /dashboard`)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

