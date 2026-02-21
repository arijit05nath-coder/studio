
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
  User,
  Settings2,
  ChevronUp,
  Sun,
  Moon,
  Trees,
  Coffee
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface DashboardNavProps {
  role?: 'Student' | 'Teacher'
  profile?: any
}

const THEMES = [
  { id: 'default', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'midnight', name: 'Midnight', icon: Sparkles },
  { id: 'forest', name: 'Forest', icon: Trees },
  { id: 'sunrise', name: 'Sunrise', icon: Coffee },
]

export function DashboardNav({ role, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user } = useUser()
  const { setOpenMobile } = useSidebar()
  const { toast } = useToast()

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
      title: "Curriculum",
      href: "/dashboard/courses",
      icon: Book,
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

  const handleThemeChange = (themeId: string) => {
    if (!user || !db) return
    updateDocumentNonBlocking(doc(db, "userProfiles", user.uid), {
      theme: themeId
    })
    toast({ title: `Theme changed to ${THEMES.find(t => t.id === themeId)?.name}` })
  }

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || "User")
  const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` : "U"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkles className="size-4 fill-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">FocusFlow</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold capitalize">{userName}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                      <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold capitalize">{userName}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <Settings2 className="mr-2 h-4 w-4" />
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="p-1 min-w-[120px]">
                        {THEMES.map((theme) => (
                          <DropdownMenuItem 
                            key={theme.id} 
                            onClick={() => handleThemeChange(theme.id)}
                            className={cn(
                              "cursor-pointer flex items-center justify-between",
                              profile?.theme === theme.id ? "bg-accent/10 text-accent font-medium" : ""
                            )}
                          >
                            <div className="flex items-center">
                              <theme.icon className="mr-2 h-4 w-4" />
                              <span>{theme.name}</span>
                            </div>
                            {profile?.theme === theme.id && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex w-full items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
