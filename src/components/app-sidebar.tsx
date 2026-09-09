"use client"

import type { ComponentProps } from "react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  FrameIcon,
  GalleryVerticalEndIcon,
  ImportIcon,
  TagsIcon,
} from "lucide-react"
import type { Session } from "@/lib/auth-client"

const data = {
  teams: [
    {
      name: "Simple CRM",
      logo: <GalleryVerticalEndIcon />,
      plan: "Workspace",
    },
  ],
  nav: [
    {
      name: "Overview",
      url: "/overview",
      icon: <FrameIcon />,
    },
    {
      name: "Import",
      url: "/import",
      icon: <ImportIcon />,
    },
    {
      name: "Tags",
      url: "/tags",
      icon: <TagsIcon />,
    },
  ],
}

export function AppSidebar({
  session,
  ...props
}: ComponentProps<typeof Sidebar> & { session: Session }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
