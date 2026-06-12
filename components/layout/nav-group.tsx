import type { SidebarNavGroup } from "@/components/layout/app-shared"
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

function NavGroupItem({ item, pathname }: { item: any; pathname: string }) {
  const isActive = item.path === pathname || item.subItems?.some((sub: any) => sub.path === pathname)
  const [isOpen, setIsOpen] = useState(isActive)

  useEffect(() => {
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
            <span>{item.title}</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems?.map((subItem: any) => {
                const isSubActive = subItem.path === pathname

                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      isActive={isSubActive}
                      render={<Link href={subItem.path || "#"} />}
                    >
                      {subItem.icon}
                      <span>{subItem.title}</span>
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
          <span>{item.title}</span>
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
