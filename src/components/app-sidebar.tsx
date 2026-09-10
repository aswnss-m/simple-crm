"use client"

import type { ComponentProps } from "react"
import Link from "next/link"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Session } from "@/lib/auth-client"
import {
  ContactRoundIcon,
  DownloadIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  ImportIcon,
  PlusIcon,
  TagsIcon,
} from "lucide-react"

const nav = [
  {
    name: "Overview",
    url: "/overview",
    icon: <FrameIcon />,
  },
  {
    name: "Contacts",
    url: "/leads",
    icon: <ContactRoundIcon />,
    action: {
      href: "/leads/new",
      label: "New contact",
      icon: <PlusIcon />,
    },
  },
  {
    name: "Import",
    url: "/import",
    icon: <ImportIcon />,
  },
  {
    name: "Export",
    url: "/export",
    icon: <DownloadIcon />,
  },
  {
    name: "Tags",
    url: "/tags",
    icon: <TagsIcon />,
  },
]

export function AppSidebar({
  session,
  ...props
}: ComponentProps<typeof Sidebar> & { session: Session }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="SimpleCRM"
              render={<Link href="/overview" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon />
              </div>
              <span className="truncate font-bold tracking-tight">SimpleCRM</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
