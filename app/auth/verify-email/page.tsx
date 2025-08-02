import VerifyEmailForm from "@/components/auth/verify-email-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            A verification code has been sent to your email address. Please enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyEmailForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email?{" "}
            <Link href="#" className="underline">
              Resend code
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
