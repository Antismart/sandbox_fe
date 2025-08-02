"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { ApiKey } from "@/lib/types"
import { format } from "date-fns"

interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  onRegenerate: (id: string) => void
  onDelete: (id: string) => void
  isRegenerating: boolean
  isDeleting: boolean
}

export default function ApiKeyTable({ apiKeys, onRegenerate, onDelete, isRegenerating, isDeleting }: ApiKeyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apiKeys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-medium">{key.name}</TableCell>
            <TableCell className="font-mono text-sm">
              {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
            </TableCell>
            <TableCell>{format(new Date(key.createdAt), "PPP")}</TableCell>
            <TableCell>{key.lastUsed ? format(new Date(key.lastUsed), "PPP") : "Never"}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRegenerate(key.id)} disabled={isRegenerating}>
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(key.id)} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
