"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { axiosInstance } from "@/lib/axios"
import {
  Delete02FreeIcons,
  Download03Icon,
  File02Icon,
  Upload03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import React from "react"
import { toast } from "sonner"
import { useProject } from "../layout"

interface ProjectFile {
  id: string
  name: string
  fileName: string
  mimeType: string
  size: number
  createdAt: string
  url: string
}

const DANGEROUS_EXTENSIONS = [
  "exe",
  "dll",
  "so",
  "elf",
  "dmg",
  "pkg",
  "app",
  "deb",
  "rpm",
  "msi",
  "msp",
  "sh",
  "bash",
  "bat",
  "cmd",
  "vbs",
  "vbe",
  "js",
  "ts",
  "html",
  "htm",
  "php",
  "py",
  "pl",
  "rb",
  "ps1",
  "jar",
  "lnk",
  "sys",
  "com",
  "scr",
]

export default function FilesPage() {
  const { projectId } = useProject()
  const queryClient = useQueryClient()

  const { data: files, isLoading: isFilesLoading } = useQuery<ProjectFile[]>({
    queryKey: ["files", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/files`)
      return response.data.data
    },
    enabled: !!projectId,
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return axiosInstance.post(`/projects/${projectId}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
      toast.success("File uploaded and secured")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Upload failed")
    },
  })

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/files/${fileId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
      toast.success("File deleted successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete file")
    },
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext && DANGEROUS_EXTENSIONS.includes(ext)) {
      toast.error(
        "Blocked: Uploading executable or script files is prohibited for security.",
        {
          duration: 5000,
        }
      )
      return
    }

    uploadFileMutation.mutate(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <HugeiconsIcon icon={File02Icon} className="h-5 w-5 text-primary" />{" "}
            Project Drive
          </h3>
          <p className="mt-1 text-xs">
            Store and share documents, CSVs, PDFs, images, spreadsheets, and
            presentation files.
          </p>
        </div>

        <div className="relative">
          <input
            type="file"
            id="project-file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploadFileMutation.isPending}
          />
          <label htmlFor="project-file-upload">
            <Button
              disabled={uploadFileMutation.isPending}
              className="h-9 cursor-pointer rounded-lg bg-primary text-xs font-semibold hover:bg-primary/90"
            >
              {uploadFileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HugeiconsIcon icon={Upload03Icon} className="mr-2 h-4 w-4" />
              )}
              Upload File
            </Button>
          </label>
        </div>
      </div>

      {isFilesLoading ? (
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
      ) : files && files.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border-dashed p-6 text-center">
          <HugeiconsIcon icon={Upload03Icon} className="mb-3 h-10 w-10" />
          <h4 className="text-sm font-bold">No Files Uploaded</h4>
          <p className="mt-1 max-w-xs text-xs leading-relaxed">
            Upload images, PDFs, docs, spreadsheets, or CSVs. Executable/script
            files are automatically blocked.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uploaded</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-slate-850 divide-y">
                {files?.map((file) => (
                  <tr key={file.id} className="hover text-xs transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <HugeiconsIcon
                          icon={File02Icon}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="font-semibold">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[10px]">
                      {file.mimeType}
                    </td>
                    <td className="p-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="p-4">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={file.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className={`${buttonVariants({ variant: "ghost", size: "icon" })} h-8 w-8`}
                        >
                          <HugeiconsIcon
                            icon={Download03Icon}
                            className="h-4 w-4"
                          />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete the file "${file.name}" permanently?`
                              )
                            ) {
                              deleteFileMutation.mutate(file.id)
                            }
                          }}
                        >
                          <HugeiconsIcon
                            icon={Delete02FreeIcons}
                            className="h-4 w-4"
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
