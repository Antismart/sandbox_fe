import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-sm text-gray-600">We've sent a verification link to your email address</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Email verification</CardTitle>
            <CardDescription>Click the link in your email or enter the verification code below</CardDescription>
          </CardHeader>
          <CardContent>
            <VerifyEmailForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
