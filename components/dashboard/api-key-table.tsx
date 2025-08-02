"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, EyeOff, MoreHorizontal, Copy, RotateCcw, Trash2, CheckCircle, XCircle } from "lucide-react"
import type { ApiKey, Environment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  isLoading: boolean
  environment: Environment
  onRefresh: () => void
}

export function ApiKeyTable({ apiKeys, isLoading, environment, onRefresh }: ApiKeyTableProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; keyId: string | null }>({
    open: false,
    keyId: null,
  })
  const [regenerateDialog, setRegenerateDialog] = useState<{ open: boolean; keyId: string | null }>({
    open: false,
    keyId: null,
  })
  const { toast } = useToast()

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "API key has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy API key to clipboard.",
        variant: "destructive",
      })
    }
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  const handleDelete = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete API key")

      toast({
        title: "API key deleted",
        description: "The API key has been permanently deleted.",
      })
      onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key.",
        variant: "destructive",
      })
    }
    setDeleteDialog({ open: false, keyId: null })
  }

  const handleRegenerate = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys/${keyId}/regenerate`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to regenerate API key")

      toast({
        title: "API key regenerated",
        description: "A new API key has been generated. The old key is no longer valid.",
      })
      onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key.",
        variant: "destructive",
      })
    }
    setRegenerateDialog({ open: false, keyId: null })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        ))}
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No API keys found for {environment}. Create your first API key to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>API Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}</span>
                  <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                    {visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>{apiKey.name}</TableCell>
              <TableCell>
                <Badge variant={apiKey.status === "active" ? "default" : "destructive"}>
                  {apiKey.status === "active" ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {apiKey.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(apiKey.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>{apiKey.lastUsed ? format(new Date(apiKey.lastUsed), "MMM d, yyyy") : "Never"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setRegenerateDialog({ open: true, keyId: apiKey.id })}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialog({ open: true, keyId: apiKey.id })}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, keyId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the API key and any applications using it will
              stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.keyId && handleDelete(deleteDialog.keyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={regenerateDialog.open} onOpenChange={(open) => setRegenerateDialog({ open, keyId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key and invalidate the current one. Any applications using the current key
              will need to be updated with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => regenerateDialog.keyId && handleRegenerate(regenerateDialog.keyId)}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
