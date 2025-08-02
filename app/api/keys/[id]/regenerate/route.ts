import { NextResponse } from "next/server"
import { generateApiKey, getApiKeyById, updateApiKey } from "@/lib/mock-db"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  const existingKey = getApiKeyById(id)
  if (!existingKey || existingKey.userId !== session.user.id) {
    return NextResponse.json({ error: "API Key not found or unauthorized" }, { status: 404 })
  }

  const newKey = generateApiKey()
  const updatedKey = { ...existingKey, key: newKey, createdAt: new Date().toISOString(), lastUsed: undefined }
  updateApiKey(updatedKey)

  return NextResponse.json(updatedKey)
}
