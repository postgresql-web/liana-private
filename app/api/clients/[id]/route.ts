import { type NextRequest, NextResponse } from "next/server"
import { getDataStore } from "@/lib/data-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataStore = getDataStore()
    const client = await dataStore.getClient(params.id)

    if (!client) {
      return NextResponse.json({ error: "Клієнт не знайдено" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("[v0] Get client error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const dataStore = getDataStore()

    const updatedClient = await dataStore.updateClient(params.id, {
      name: data.name,
      phone: data.phone,
      callStatus: data.callStatus,
      type: data.type,
      status: data.status,
      budget: data.budget,
      notes: data.notes,
    })

    if (!updatedClient) {
      return NextResponse.json({ error: "Клієнт не знайдено" }, { status: 404 })
    }

    const username = request.headers.get("x-admin-username") || "Unknown"
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "Unknown"

    await dataStore.logAdminAction({
      adminUsername: username,
      action: "Оновлено клієнта",
      details: `Клієнт ${data.name} - ${data.phone}`,
      ipAddress,
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("[v0] Update client error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataStore = getDataStore()
    const client = await dataStore.getClient(params.id)

    if (!client) {
      return NextResponse.json({ error: "Клієнт не знайдено" }, { status: 404 })
    }

    await dataStore.deleteClient(params.id)

    const username = request.headers.get("x-admin-username") || "Unknown"
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "Unknown"

    await dataStore.logAdminAction({
      adminUsername: username,
      action: "Видалено клієнта",
      details: `Клієнт ${client.name} - ${client.phone}`,
      ipAddress,
    })

    return NextResponse.json({ message: "Клієнт успішно видалено" })
  } catch (error) {
    console.error("[v0] Delete client error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
