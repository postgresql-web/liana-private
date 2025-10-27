import { type NextRequest, NextResponse } from "next/server"
import { getDataStore } from "@/lib/data-store"
import { createAuthToken } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Ім'я користувача та пароль обов'язкові" }, { status: 400 })
    }

    const dataStore = getDataStore()
    const user = dataStore.getUser(username)

    if (!user || !dataStore.verifyUserPassword(username, password)) {
      return NextResponse.json({ error: "Невірне ім'я користувача або пароль" }, { status: 401 })
    }

    const token = createAuthToken(username)

    dataStore.logAdminAction({
      adminUsername: username,
      action: "Вхід в систему",
      details: `Адміністратор ${user.fullName} увійшов в систему`,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown",
    })

    const response = NextResponse.json({
      success: true,
      token,
      username: user.username,
      name: user.fullName,
    })

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
