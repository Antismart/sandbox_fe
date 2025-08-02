import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ApiKeyManager } from "@/components/dashboard/api-key-manager"

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect("/auth/login")
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session.user} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">API Key Management</h1>
              <p className="mt-2 text-gray-600">
                Generate and manage your API keys for Mainnet and Testnet environments
              </p>
            </div>
            <ApiKeyManager />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/auth/login")
  }
}
