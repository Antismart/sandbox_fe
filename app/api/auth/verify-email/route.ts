import { NextResponse } from "next/server"
import { verifyUserEmail } from "@/lib/mock-db"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 })
    }

    const success = verifyUserEmail(email, code)

    if (!success) {
      return NextResponse.json({ error: "Invalid verification code or email already verified" }, { status: 400 })
    }

    return NextResponse.json({ message: "Email verified successfully." }, { status: 200 })
  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
