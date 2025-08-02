import { NextResponse } from "next/server"
import { createApiKey, getApiKeysByUserId } from "@/lib/mock-db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = getApiKeysByUserId(session.user.id)
    return NextResponse.json(apiKeys, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const newKey = createApiKey(session.user.id, name)
    return NextResponse.json(newKey, { status: 201 })
  } catch (error: any) {
    console.error("Error creating API key:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
