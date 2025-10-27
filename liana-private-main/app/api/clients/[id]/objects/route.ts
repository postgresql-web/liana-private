import { type NextRequest, NextResponse } from "next/server"
import { getDataStore } from "@/lib/data-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataStore = getDataStore()
    const allProperties = dataStore.getProperties()

    // Filter properties by owner (client ID is stored in notes or we need to add owner_id field)
    // For now, return empty array as the schema doesn't have owner_id for clients
    const objects = allProperties.filter((prop) => prop.owner === params.id)

    return NextResponse.json(objects)
  } catch (error) {
    console.error("[v0] Get client objects error:", error)
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 })
  }
}
