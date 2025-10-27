import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth"
import { getDataStore } from "@/lib/data-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const authToken =
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("authToken")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    if (!authToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const tokenData = verifyAuthToken(authToken)

    if (!tokenData) {
      return NextResponse.json({ authenticated: false, error: "Invalid or expired token" }, { status: 401 })
    }

    const dataStore = getDataStore()
    const user = dataStore.getUser(tokenData.username)

    if (!user) {
      return NextResponse.json({ authenticated: false, error: "User not found" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    })
  } catch (error) {
    console.error("[v0] Verify auth error:", error)
    return NextResponse.json({ authenticated: false, error: "Server error" }, { status: 500 })
  }
}
