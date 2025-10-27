import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuthTokenFormat } from "@/lib/auth-edge"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/") {
    const authToken = request.cookies.get("auth_token")?.value || request.cookies.get("authToken")?.value

    if (authToken) {
      const tokenData = await verifyAuthTokenFormat(authToken)
      if (tokenData) {
        // User is authenticated, redirect to home
        const homeUrl = new URL("/home", request.url)
        return NextResponse.redirect(homeUrl)
      }
    }

    return NextResponse.next()
  }

  // Allow API routes without auth check
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get("auth_token")?.value || request.cookies.get("authToken")?.value

  // If no token, redirect to login
  if (!authToken) {
    const loginUrl = new URL("/", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const tokenData = await verifyAuthTokenFormat(authToken)

  if (!tokenData) {
    const loginUrl = new URL("/", request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete("authToken")
    response.cookies.delete("auth_token")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (API routes)
     * - /_next/* (Next.js internals)
     * - /static/* (static files)
     * - /*.* (files with extensions like .ico, .jpg, etc.)
     */
    "/((?!api|_next|static|.*\\..*).*)",
  ],
}
