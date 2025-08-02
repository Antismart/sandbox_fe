import { NextResponse } from "next/server"
import { createApiKey as createApiKeyInDb, getApiKeysByUserId } from "@/lib/mock-db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKeys = getApiKeysByUserId(session.user.id)
  return NextResponse.json(apiKeys)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const newApiKey = createApiKeyInDb(session.user.id, name)
  return NextResponse.json(newApiKey, { status: 201 })
}
