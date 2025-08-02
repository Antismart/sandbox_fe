"use client"

import { Copy, Trash, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ApiKey } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  onRegenerate: (id: string) => void
  onDelete: (id: string) => void
  isRegenerating: boolean
  isDeleting: boolean
}

export function ApiKeyTable({ apiKeys, onRegenerate, onDelete, isRegenerating, isDeleting }: ApiKeyTableProps) {
  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No API keys found. Create one to get started!
              </TableCell>
            </TableRow>
          ) : (
            apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[150px] md:max-w-none">{key.key}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(key.key)} className="h-7 w-7">
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy API Key</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy API Key</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onRegenerate(key.id)}
                            disabled={isRegenerating}
                            className="h-7 w-7"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Regenerate</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate Key</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => onDelete(key.id)}
                            disabled={isDeleting}
                            className="h-7 w-7"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Key</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
