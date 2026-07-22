import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="w-full space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-px sm:flex-row sm:items-center">
              <div className="flex gap-6 pt-2">
                <Skeleton className="mb-3 h-5 w-24" />
                <Skeleton className="mb-3 h-5 w-32" />
              </div>
              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>

              <div className="h-[calc(100vh-300px)] min-h-[400px] overflow-hidden rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="h-10 px-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="h-10 px-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="h-10 px-4 text-right align-middle">
                        <Skeleton className="ml-auto h-4 w-12" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </td>
                        <td className="p-4 text-right align-middle">
                          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
