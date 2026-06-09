"use client"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROLES } from "@/constants/roles"
import { useState } from "react"
import { toast } from "sonner"
import { useInviteMember } from "../hooks/use-org"

export function InviteMemberModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const inviteMutation = useInviteMember()

  const handleInvite = () => {
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    inviteMutation.mutate(
      { email, role },
      {
        onSuccess: () => {
          toast.success("Invitation sent successfully")
          setEmail("")
          setRole("member")
          onOpenChange(false)
          onSuccess()
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to send invitation"
          )
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization. They will receive an email
            with a link to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Combobox
              items={ROLES}
              value={role}
              onValueChange={(value) => setRole(value || "")}
            >
              <ComboboxInput placeholder="Select a role" className="w-full" />

              <ComboboxContent>
                <ComboboxEmpty>No roles found.</ComboboxEmpty>

                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
