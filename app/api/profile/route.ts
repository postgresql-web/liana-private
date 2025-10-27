import { type NextRequest, NextResponse } from "next/server"
import { getDataStore } from "@/lib/data-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value || request.cookies.get("authToken")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const dataStore = getDataStore()
    const decoded = Buffer.from(authToken, "base64").toString("utf-8")
    const parsed = JSON.parse(decoded)
    const username = parsed.username

    const user = dataStore.getUser(username)

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    return NextResponse.json({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value || request.cookies.get("authToken")?.value

    if (!authToken) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const data = await request.json()
    const decoded = Buffer.from(authToken, "base64").toString("utf-8")
    const parsed = JSON.parse(decoded)
    const username = parsed.username

    const dataStore = getDataStore()
    const updatedUser = dataStore.updateUser(username, {
      fullName: data.fullName,
      email: data.email,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    return NextResponse.json({
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
