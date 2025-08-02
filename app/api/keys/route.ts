import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import type { ApiKey } from "@/lib/types"

const createKeySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  environment: z.enum(["mainnet", "testnet"]),
})

// Mock data for demonstration
const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    description: "Main production key for our app",
    key: "sk_test_1234567890abcdef1234567890abcdef",
    environment: "testnet",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    lastUsed: "2024-01-20T14:30:00Z",
    userId: "1",
  },
  {
    id: "2",
    name: "Development Key",
    description: "Key for development and testing",
    key: "sk_test_abcdef1234567890abcdef1234567890",
    environment: "testnet",
    status: "active",
    createdAt: "2024-01-10T09:00:00Z",
    userId: "1",
  },
  {
    id: "3",
    name: "Live Production Key",
    description: "Live mainnet key",
    key: "sk_live_1234567890abcdef1234567890abcdef",
    environment: "mainnet",
    status: "active",
    createdAt: "2024-01-18T11:00:00Z",
    lastUsed: "2024-01-21T16:45:00Z",
    userId: "1",
  },
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const environment = searchParams.get("environment")

    let filteredKeys = mockApiKeys.filter((key) => key.userId === session.user.id)

    if (environment) {
      filteredKeys = filteredKeys.filter((key) => key.environment === environment)
    }

    return NextResponse.json(filteredKeys)
  } catch (error) {
    console.error("API Keys GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, environment } = createKeySchema.parse(body)

    // Generate a new API key (placeholder)
    const newKey = `sk_${environment === "mainnet" ? "live" : "test"}_${Math.random().toString(36).substring(2, 34)}`

    const apiKey: ApiKey = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      description,
      key: newKey,
      environment,
      status: "active",
      createdAt: new Date().toISOString(),
      userId: session.user.id,
    }

    // In a real app, you'd save this to your database
    mockApiKeys.push(apiKey)

    return NextResponse.json({
      message: "API key created successfully",
      key: newKey,
      id: apiKey.id,
    })
  } catch (error) {
    console.error("API Keys POST error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
