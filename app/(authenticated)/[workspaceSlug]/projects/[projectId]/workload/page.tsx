import { WorkloadView } from "@/features/tasks/components/workload-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workload | Project",
  description: "View team workload and capacity",
}

export default function WorkloadPage() {
  return <WorkloadView />
}
