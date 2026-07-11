"use client"

import { Inbox, Landmark, PieChart } from "lucide-react"
import { motion } from "motion/react"
import { useState, type FC, type ReactNode } from "react"

export interface TabItem {
  id: string
  label: string
  icon: ReactNode
}

interface FluidTabsProps {
  tabs?: TabItem[]
  defaultActive?: string
  onChange?: (id: string) => void
}

const DEFAULT_TABS: TabItem[] = [
  { id: "accounts", label: "Accounts", icon: <Landmark size={22} /> },
  { id: "deposits", label: "Deposits", icon: <Inbox size={22} /> },
  { id: "funds", label: "Funds", icon: <PieChart size={22} /> },
]

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs = DEFAULT_TABS,
  defaultActive = tabs[0]?.id,
  onChange,
}) => {
  const [active, setActive] = useState<string>(defaultActive)

  const handleChange = (id: string) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div className="relative flex items-center gap-1 rounded-full border-[1.6px] border-border bg-muted/50 px-1 py-1 transition-colors sm:gap-2 dark:border-border dark:bg-muted">
      {tabs.map((tab) => {
        const isActive = active === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="group relative rounded-full px-3 py-2.5 outline-none sm:px-4 sm:py-3.5"
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 25,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full border border-border/50 bg-background shadow-xs dark:border-border/50 dark:bg-card"
              />
            )}

            <motion.div
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              animate={{
                filter: isActive
                  ? ["blur(0px)", "blur(4px)", "blur(0px)"]
                  : "blur(0px)",
              }}
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 sm:gap-3 ${
                isActive
                  ? "font-bold text-foreground"
                  : "font-semibold text-muted-foreground group-hover:text-foreground transition-colors"
              }`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.03 : 1 }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 15 },
                }}
                className="flex shrink-0 items-center justify-center"
              >
                {tab.icon}
              </motion.div>

              <span className="text-sm tracking-tight whitespace-nowrap sm:text-base">
                {tab.label}
              </span>
            </motion.div>
          </button>
        )
      })}
    </div>
  )
}
