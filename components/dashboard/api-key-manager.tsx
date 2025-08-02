"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import ApiKeyTable from "./api-key-table"
import CreateApiKeyDialog from "./create-api-key-dialog"
import type { ApiKey } from "@/lib/types"

export default function ApiKeyManager() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const {
    data: apiKeys,
    isLoading,
    isError,
  } = useQuery<ApiKey[]>({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await fetch("/api/keys")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch API keys")
      }
      return response.json()
    },
  })

  const createApiKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create API key")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast({ title: "API Key Created", description: "Your new API key has been generated." })
      setIsCreateDialogOpen(false)
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/keys/${id}/regenerate`, {
        method: "POST",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to regenerate API key")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast({ title: "API Key Regenerated", description: "The API key has been successfully regenerated." })
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete API key")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast({ title: "API Key Deleted", description: "The API key has been successfully deleted." })
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  if (isLoading) return <div>Loading API keys...</div>
  if (isError) return <div>Error loading API keys.</div>

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create New API Key</Button>
      </div>
      <ApiKeyTable
        apiKeys={apiKeys || []}
        onRegenerate={regenerateApiKeyMutation.mutate}
        onDelete={deleteApiKeyMutation.mutate}
        isRegenerating={regenerateApiKeyMutation.isPending}
        isDeleting={deleteApiKeyMutation.isPending}
      />
      <CreateApiKeyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={createApiKeyMutation.mutate}
        isCreating={createApiKeyMutation.isPending}
      />
    </div>
  )
}
