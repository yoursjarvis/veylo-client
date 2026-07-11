"use client"

import React from "react"
import { useParams } from "next/navigation"
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard"

export default function PortfolioDetailPage() {
  const params = useParams()
  const portfolioId = params.portfolioId as string

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PortfolioDashboard portfolioId={portfolioId} />
    </div>
  )
}
