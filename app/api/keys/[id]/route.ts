import { NextResponse } from "next/server"
import { getApiKeyById, deleteApiKey as deleteApiKeyFromDb } from "@/lib/mock-db"
import { auth } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  const existingKey = getApiKeyById(id)
  if (!existingKey || existingKey.userId !== session.user.id) {
    return NextResponse.json({ error: "API Key not found or unauthorized" }, { status: 404 })
  }

  deleteApiKeyFromDb(id)
  return new NextResponse(null, { status: 204 })
}
