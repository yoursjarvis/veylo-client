"use client"

import React, { useState } from "react"
import { useProject } from "../../layout"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Shield,
  Plus,
  Trash,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
} from "lucide-react"

interface VaultItem {
  id: string
  serviceId: string
  key: string
  value: string
  note: string | null
  createdAt: string
}

interface VaultService {
  id: string
  vaultId: string
  name: string
  items: VaultItem[]
}

interface Vault {
  id: string
  projectId: string
  services: VaultService[]
}

export default function VaultSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject()
  const queryClient = useQueryClient()

  // Add Service State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [newServiceName, setNewServiceName] = useState("")

  // Add Vault Item State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newNote, setNewNote] = useState("")

  // Masking state for Vault Items
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>(
    {}
  )
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)

  const { data: vault, isLoading: isVaultLoading } = useQuery<Vault>({
    queryKey: ["vault", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/vault`)
      return response.data.data
    },
    enabled: !!projectId,
  })

  const addServiceMutation = useMutation({
    mutationFn: async (name: string) => {
      return axiosInstance.post(`/projects/${projectId}/vault/services`, {
        name,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] })
      toast.success("Service added to vault")
      setIsAddServiceOpen(false)
      setNewServiceName("")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to add service")
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return axiosInstance.delete(
        `/projects/${projectId}/vault/services/${serviceId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] })
      toast.success("Service deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete service")
    },
  })

  const saveVaultItemMutation = useMutation({
    mutationFn: async (data: {
      serviceId: string
      key: string
      value: string
      note?: string
    }) => {
      return axiosInstance.post(
        `/projects/${projectId}/vault/services/${data.serviceId}/items`,
        {
          key: data.key,
          value: data.value,
          note: data.note,
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] })
      toast.success("Secret saved securely")
      setIsAddItemOpen(false)
      setNewKey("")
      setNewValue("")
      setNewNote("")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to save secret")
    },
  })

  const deleteVaultItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return axiosInstance.delete(
        `/projects/${projectId}/vault/items/${itemId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] })
      toast.success("Secret deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete secret")
    },
  })

  const handleCopy = (itemId: string, val: string) => {
    navigator.clipboard.writeText(val)
    setCopiedItemId(itemId)
    toast.success("Value copied to clipboard")
    setTimeout(() => setCopiedItemId(null), 2000)
  }

  const toggleReveal = (itemId: string) => {
    setRevealedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  if (!isWorkspaceAdmin) {
    return (
      <div className="p-8 text-center">
        You do not have administrative permissions to view settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Shield className="h-5 w-5" /> Credentials & Keys Vault
          </h3>
          <p className="mt-1 text-xs">
            AES-256 encrypted server-side storage. Values are protected and
            decrypted only when requested.
          </p>
        </div>
        <Button onClick={() => setIsAddServiceOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Service
        </Button>
      </div>

      {isVaultLoading ? (
        <div className="flex flex-col space-y-6 p-6 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="border-b border-border p-4 flex gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 border-b border-border last:border-0">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
      ) : vault?.services && vault.services.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
          <Lock className="mb-3 h-10 w-10" />
          <h4 className="text-sm font-bold">Vault Empty</h4>
          <p className="mt-1 max-w-xs text-xs leading-relaxed">
            Securely store credentials for chatgpt, aws, stripe, github, or
            other tools.
          </p>
          <Button
            onClick={() => setIsAddServiceOpen(true)}
            variant="secondary"
            className="mt-4 h-8 text-xs font-semibold"
          >
            Add First Service
          </Button>
        </div>
      ) : (
        <div className="grid max-w-4xl grid-cols-1 gap-6">
          {vault?.services?.map((service) => (
            <Card
              key={service.id}
              className="border-border overflow-hidden border shadow-lg"
            >
              <CardHeader className="border-border flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-3.5">
                <CardTitle className="text-xs font-bold tracking-wider uppercase">
                  {service.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveServiceId(service.id)
                      setIsAddItemOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Secret
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete the service "${service.name}" and all of its secrets permanently?`
                        )
                      ) {
                        deleteServiceMutation.mutate(service.id)
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {service.items.length === 0 ? (
                  <div className="p-6 text-center text-xs italic">
                    No credentials stored. Click &quot;Add Secret&quot; above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-border border-b bg-muted/20 font-semibold">
                          <th className="p-3.5 pl-6">Key / Name</th>
                          <th className="p-3.5">Secret Value</th>
                          <th className="p-3.5">Notes</th>
                          <th className="p-3.5 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {service.items.map((item) => {
                          const isRevealed = !!revealedItems[item.id]
                          const isCopied = copiedItemId === item.id
                          return (
                            <tr
                              key={item.id}
                              className="transition-colors hover:bg-muted/10"
                            >
                              <td className="p-3.5 pl-6 font-mono text-[11px] font-semibold">
                                {item.key}
                              </td>
                              <td className="max-w-xs truncate p-3.5 font-mono text-[11px]">
                                {isRevealed ? (
                                  <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 break-all whitespace-normal text-primary">
                                    {item.value}
                                  </span>
                                ) : (
                                  <span className="font-sans text-[8px] font-black tracking-widest select-none">
                                    ••••••••••••••••
                                  </span>
                                )}
                              </td>
                              <td className="max-w-xs truncate p-3.5 text-[11px] leading-normal whitespace-pre-wrap">
                                {item.note || "—"}
                              </td>
                              <td className="p-3.5 pr-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleReveal(item.id)}
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleCopy(item.id, item.value)
                                    }
                                  >
                                    {isCopied ? (
                                      <Check className="text-success h-3.5 w-3.5" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Delete this secret credential?"
                                        )
                                      ) {
                                        deleteVaultItemMutation.mutate(item.id)
                                      }
                                    }}
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="p-6 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Vault Service
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a category like ChatGPT, AWS, or Stripe to group secret
              keys.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid gap-2">
              <label htmlFor="service-name" className="font-semibold">
                Service Name
              </label>
              <Input
                id="service-name"
                placeholder="e.g. OpenAI / ChatGPT"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="border-border flex gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsAddServiceOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newServiceName.trim() || addServiceMutation.isPending}
              onClick={() => addServiceMutation.mutate(newServiceName)}
            >
              {addServiceMutation.isPending ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Secret Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="border p-6 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Secret Credential
            </DialogTitle>
            <DialogDescription className="text-xs">
              Securely store keys, login usernames, passwords, or urls under
              this service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid gap-2">
              <label htmlFor="secret-key" className="font-semibold">
                Key Name
              </label>
              <Input
                id="secret-key"
                placeholder="e.g. API_SECRET_KEY, DB_PASSWORD"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="secret-value" className="font-semibold">
                Value (Confidential)
              </label>
              <Input
                id="secret-value"
                type="password"
                placeholder="Paste credential value here"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="secret-note" className="font-semibold">
                Note / Description (Optional)
              </label>
              <Textarea
                id="secret-note"
                placeholder="Additional details, connection notes, usage details..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !newKey.trim() ||
                !newValue.trim() ||
                saveVaultItemMutation.isPending
              }
              onClick={() =>
                saveVaultItemMutation.mutate({
                  serviceId: activeServiceId!,
                  key: newKey,
                  value: newValue,
                  note: newNote,
                })
              }
            >
              {saveVaultItemMutation.isPending ? "Saving..." : "Save Secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
