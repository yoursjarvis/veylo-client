import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard"

export const metadata = {
  title: "Portfolio Dashboard - Veylo",
  description: "Cross-Project analytics and portfolio health",
}

export default function PortfolioPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PortfolioDashboard />
    </div>
  )
}
