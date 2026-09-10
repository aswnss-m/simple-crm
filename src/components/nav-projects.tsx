"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: ReactNode
    action?: {
      href: string
      label: string
      icon: ReactNode
    }
  }[]
}) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={
                pathname === item.url || pathname.startsWith(`${item.url}/`)
              }
              tooltip={item.name}
              render={
                <Link href={item.url} onClick={() => setOpenMobile(false)} />
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
            {item.action ? (
              <SidebarMenuAction
                aria-label={item.action.label}
                title={item.action.label}
                render={
                  <Link
                    href={item.action.href}
                    onClick={() => setOpenMobile(false)}
                  />
                }
              >
                {item.action.icon}
              </SidebarMenuAction>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
