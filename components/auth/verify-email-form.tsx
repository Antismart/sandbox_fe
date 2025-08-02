"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const verifySchema = z.object({
  code: z.string().min(6, "Verification code must be 6 characters").max(6),
})

type VerifyFormData = z.infer<typeof verifySchema>

export function VerifyEmailForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  })

  const onSubmit = async (data: VerifyFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: data.code }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Invalid verification code.")
      } else {
        setSuccess(true)
        toast({
          title: "Email verified successfully",
          description: "You can now sign in to your account.",
        })
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async () => {
    setIsResending(true)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Verification email sent",
          description: "Please check your email for a new verification link.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to resend verification email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>Email verified successfully! Redirecting to login...</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Enter the 6-digit code sent to your email address</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            {...register("code")}
            disabled={isLoading}
            className="text-center text-lg tracking-widest"
          />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Didn't receive the email?{" "}
          <Button variant="link" className="p-0 h-auto font-normal" onClick={resendVerification} disabled={isResending}>
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        </p>
      </div>
    </div>
  )
}
