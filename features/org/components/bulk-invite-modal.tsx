"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkInvite } from "../hooks/use-org";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon } from "@hugeicons/core-free-icons";

export function BulkInviteModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const bulkInviteMutation = useBulkInvite();

  const handleUpload = () => {
    if (!file) return;

    bulkInviteMutation.mutate(file, {
      onSuccess: (data) => {
        toast.success(`Successfully invited ${data.data.successful} users.`);
        if (data.data.failed > 0) {
          toast.error(`Failed to invite ${data.data.failed} users. Check console for details.`);
          console.error(data.data.errors);
        }
        setFile(null);
        onOpenChange(false);
        onSuccess();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to process bulk invite.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Invite Members</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to invite multiple members at once.
            The file should contain at least two columns: <strong>email</strong> and <strong>role</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-8 border-2 border-dashed rounded-lg">
          <HugeiconsIcon icon={CloudUploadIcon} className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Drag and drop your file here, or click below to select a file.
          </p>
          <label htmlFor="file-upload">
            <Button variant="outline" render={<span />}>
              Select File
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {file && (
            <p className="text-sm font-medium text-primary">Selected: {file.name}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || bulkInviteMutation.isPending}
          >
            {bulkInviteMutation.isPending ? "Processing..." : "Upload & Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}