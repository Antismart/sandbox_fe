import VerifyEmailForm from "@/components/auth/verify-email-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>Enter the 6-digit code sent to your email address to verify your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyEmailForm />
          <div className="mt-4 text-center text-sm">
            Didn&apos;t receive the code?{" "}
            <Link href="#" className="underline">
              Resend
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
