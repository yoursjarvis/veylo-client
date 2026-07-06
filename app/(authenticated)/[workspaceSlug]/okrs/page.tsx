import { OkrsDashboard } from "@/features/okrs/components/okrs-dashboard"

export const metadata = {
  title: "OKRs & Goals - Veylo",
  description: "Company-wide Objectives and Key Results",
}

export default function OkrsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <OkrsDashboard />
    </div>
  )
}
