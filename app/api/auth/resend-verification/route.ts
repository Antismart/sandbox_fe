import { NextResponse } from "next/server"
import { resendVerificationCode } from "@/lib/mock-db"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const success = resendVerificationCode(email)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to resend verification code. User not found or email already verified." },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Verification code resent successfully." }, { status: 200 })
  } catch (error) {
    console.error("Error resending verification code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
