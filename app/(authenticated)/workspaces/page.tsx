import { WorkspaceList } from "@/features/org/components/workspace-list"

export default function WorkspacesPage() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-8">
        <div className="max-w-9xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization&apos;s workspaces, members, and access.
            </p>
          </div>
          <WorkspaceList />
        </div>
      </div>
    </div>
  )
}
