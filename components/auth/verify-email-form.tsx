"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailForm() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const { toast } = useToast()

  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not provided. Please sign up again.",
        variant: "destructive",
      })
      router.push("/auth/signup")
    }
  }, [email, router, toast])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Email verification failed")
      }

      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified. You can now log in.",
      })
      router.push("/auth/login")
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code")
      }

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      })
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "An unexpected error occurred while resending.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleVerify} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="code" className="text-center">
          Verification Code
        </Label>
        <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)} disabled={isLoading}>
          <InputOTPGroup className="w-full justify-center">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-transparent"
        onClick={handleResend}
        disabled={isLoading}
      >
        Resend Code
      </Button>
    </form>
  )
}
