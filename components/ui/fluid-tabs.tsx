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
  active?: string
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
  active: controlledActive,
  defaultActive = tabs[0]?.id,
  onChange,
}) => {
  const [internalActive, setInternalActive] = useState<string>(defaultActive)
  const active = controlledActive !== undefined ? controlledActive : internalActive

  const handleChange = (id: string) => {
    if (controlledActive === undefined) {
      setInternalActive(id)
    }
    onChange?.(id)
  }

  return (
    <div className="relative flex items-center gap-0.5 rounded-lg border border-border bg-background p-1 transition-colors dark:bg-muted select-none">
      {tabs.map((tab) => {
        const isActive = active === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="group relative rounded-md px-3 py-1 outline-none transition-all"
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
                className="absolute inset-0 rounded-md bg-primary shadow-xs"
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
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                isActive
                  ? "font-bold text-primary-foreground animate-none"
                  : "font-semibold text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {tab.icon && (
                <motion.div
                  animate={{ scale: isActive ? 1.03 : 1 }}
                  transition={{
                    scale: { type: "spring", stiffness: 300, damping: 15 },
                  }}
                  className="flex shrink-0 items-center justify-center animate-none"
                >
                  {tab.icon}
                </motion.div>
              )}

              <span className="text-2xs tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </motion.div>
          </button>
        )
      })}
    </div>
  )
}
