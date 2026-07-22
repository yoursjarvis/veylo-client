import { WorkspaceMemberManagement } from "@/features/org/components/workspace-member-management"

export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <WorkspaceMemberManagement workspaceId={id} />
        </div>
      </div>
    </div>
  )
}
