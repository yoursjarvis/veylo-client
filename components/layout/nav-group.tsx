import type { SidebarNavGroup, SidebarNavItem } from "@/components/layout/app-shared"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"

function NavGroupItem({ item, pathname }: { item: SidebarNavItem; pathname: string }) {
  const isActive = !!(item.path === pathname || item.subItems?.some((sub: SidebarNavItem) => sub.path === pathname))
  const [isOpen, setIsOpen] = useState<boolean>(isActive)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing collapse state with active route
    setIsOpen(isActive)
  }, [isActive])

  return (
    <Collapsible
      className="group/collapsible"
      open={isOpen}
      onOpenChange={setIsOpen}
      key={item.title}
      render={<SidebarMenuItem />}
    >
      {item.subItems?.length ? (
        <>
          <CollapsibleTrigger
            render={<SidebarMenuButton isActive={isActive} />}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems?.map((subItem: SidebarNavItem) => {
                const isSubActive = subItem.path === pathname

                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      isActive={isSubActive}
                      render={<Link href={subItem.path || "#"} />}
                    >
                      {subItem.icon}
                      <span className="flex-1">{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      ) : (
        <SidebarMenuButton
          isActive={isActive}
          render={<Link href={item.path || "#"} />}
        >
          {item.icon}
          <span className="flex-1">{item.title}</span>
        </SidebarMenuButton>
      )}
    </Collapsible>
  )
}

export function NavGroup({ label, items }: SidebarNavGroup) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavGroupItem key={item.title} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
