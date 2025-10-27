import { type NextRequest, NextResponse } from "next/server"
import { getDataStore } from "@/lib/data-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataStore = getDataStore()
    const property = dataStore.getProperty(params.id)

    if (!property) {
      return NextResponse.json({ error: "Об'єкт не знайдено" }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("[v0] Get property error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const dataStore = getDataStore()

    const updatedProperty = dataStore.updateProperty(params.id, data)

    if (!updatedProperty) {
      return NextResponse.json({ error: "Об'єкт не знайдено" }, { status: 404 })
    }

    const username = request.headers.get("x-admin-username") || "Unknown"
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown"

    dataStore.logAdminAction({
      adminUsername: username,
      action: "Оновлено об'єкт",
      details: `Об'єкт ${params.id} - ${data.address || updatedProperty.address}`,
      ipAddress,
    })

    return NextResponse.json(updatedProperty)
  } catch (error) {
    console.error("[v0] Update property error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataStore = getDataStore()

    const property = dataStore.getProperty(params.id)
    const success = dataStore.deleteProperty(params.id)

    if (!success) {
      return NextResponse.json({ error: "Об'єкт не знайдено" }, { status: 404 })
    }

    const username = request.headers.get("x-admin-username") || "Unknown"
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown"

    dataStore.logAdminAction({
      adminUsername: username,
      action: "Видалено об'єкт",
      details: `Об'єкт ${params.id} - ${property?.address || "Unknown"}`,
      ipAddress,
    })

    return NextResponse.json({ message: "Об'єкт успішно видалено" })
  } catch (error) {
    console.error("[v0] Delete property error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
