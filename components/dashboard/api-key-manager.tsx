"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Globe, TestTube } from "lucide-react"
import { ApiKeyTable } from "./api-key-table"
import { CreateApiKeyDialog } from "./create-api-key-dialog"
import type { ApiKey, Environment } from "@/lib/types"

export function ApiKeyManager() {
  const [activeTab, setActiveTab] = useState<Environment>("testnet")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const {
    data: apiKeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["api-keys", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/keys?environment=${activeTab}`)
      if (!response.ok) throw new Error("Failed to fetch API keys")
      return response.json() as Promise<ApiKey[]>
    },
  })

  const handleCreateKey = () => {
    setIsCreateDialogOpen(true)
  }

  const handleKeyCreated = () => {
    refetch()
    setIsCreateDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage your API keys for different environments</p>
        </div>
        <Button onClick={handleCreateKey}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Environment)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="testnet" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testnet
          </TabsTrigger>
          <TabsTrigger value="mainnet" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Mainnet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testnet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testnet Environment
                <Badge variant="secondary">Development</Badge>
              </CardTitle>
              <CardDescription>
                API keys for testing and development. These keys work with sandbox data only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyTable apiKeys={apiKeys || []} isLoading={isLoading} environment="testnet" onRefresh={refetch} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mainnet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Mainnet Environment
                <Badge variant="destructive">Production</Badge>
              </CardTitle>
              <CardDescription>
                API keys for production use. These keys work with live data and should be kept secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyTable apiKeys={apiKeys || []} isLoading={isLoading} environment="mainnet" onRefresh={refetch} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateApiKeyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        environment={activeTab}
        onKeyCreated={handleKeyCreated}
      />
    </div>
  )
}
