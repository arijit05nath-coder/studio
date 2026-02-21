
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Users, 
  Sparkles, 
  LogOut,
  Book,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

interface DashboardNavProps {
  role?: 'Student' | 'Teacher'
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()
  const { user } = useUser()
  const { setOpenMobile } = useSidebar()

  const navItems = [
    {
      title: "Dashboard",
      href: role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      title: "Student Progress",
      href: "/dashboard/student-progress",
      icon: BarChart3,
      showOnlyFor: 'Teacher' as const,
    },
    {
      title: "Courses",
      href: "/dashboard/courses",
      icon: Book,
    },
    {
      title: "Materials",
      href: "/dashboard/materials",
      icon: BookOpen,
    },
    {
      title: "Focus Mode",
      href: "/dashboard/focus",
      icon: Clock,
      hideFor: 'Teacher' as const,
    },
    {
      title: "Groups",
      href: "/dashboard/groups",
      icon: Users,
      hideFor: 'Teacher' as const,
    },
    {
      title: "AI Coach",
      href: "/dashboard/ai-coach",
      icon: Sparkles,
      hideFor: 'Teacher' as const,
    },
  ]

  const filteredItems = navItems.filter(item => {
    if (item.hideFor === role) return false;
    if (item.showOnlyFor && item.showOnlyFor !== role) return false;
    return true;
  })

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="h-6 w-6 fill-accent text-accent shrink-0" />
          <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg leading-none">FocusFlow</span>
            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.title}
                onClick={() => setOpenMobile(false)}
              >
                <Link href={item.href}>
                  <item.icon className={cn(pathname === item.href && "fill-current")} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={handleLogout}
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
