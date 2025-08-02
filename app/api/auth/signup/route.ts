import { NextResponse } from "next/server"
import { createUser } from "@/lib/mock-db"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = createUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json(
      { message: "User created successfully. Verification code sent to email." },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error during signup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
