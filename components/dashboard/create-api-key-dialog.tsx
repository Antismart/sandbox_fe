"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Copy, CheckCircle } from "lucide-react"
import type { Environment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
})

type CreateKeyFormData = z.infer<typeof createKeySchema>

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment: Environment
  onKeyCreated: () => void
}

export function CreateApiKeyDialog({ open, onOpenChange, environment, onKeyCreated }: CreateApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateKeyFormData>({
    resolver: zodResolver(createKeySchema),
  })

  const onSubmit = async (data: CreateKeyFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          environment,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create API key")
      } else {
        setCreatedKey(result.key)
        toast({
          title: "API key created",
          description: "Your new API key has been generated successfully.",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
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

  const handleClose = () => {
    if (createdKey) {
      onKeyCreated()
    }
    setCreatedKey(null)
    setError("")
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Generate a new API key for the {environment} environment.</DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your API key has been created successfully. Make sure to copy it now as you won't be able to see it
                again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your new API key</Label>
              <div className="flex items-center space-x-2">
                <Input value={createdKey} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g., Production API Key" {...register("name")} disabled={isLoading} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this API key"
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create API Key
              </Button>
            </DialogFooter>
          </form>
        )}

        {createdKey && (
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
