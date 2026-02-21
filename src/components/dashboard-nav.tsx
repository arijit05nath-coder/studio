
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Users, 
  Sparkles, 
  LogOut,
  Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    {
      title: "Dashboard",
      href: user?.role === 'teacher' ? "/dashboard/teacher" : "/dashboard/student",
      icon: LayoutDashboard,
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
      hideFor: 'teacher' as const,
    },
    {
      title: "Group Study",
      href: "/dashboard/groups",
      icon: Users,
    },
    {
      title: "AI Coach",
      href: "/dashboard/ai-coach",
      icon: Sparkles,
      hideFor: 'teacher' as const,
    },
  ]

  const filteredItems = navItems.filter(item => !item.hideFor || item.hideFor !== user?.role)

  return (
    <nav className="flex flex-col h-full bg-white border-r px-4 py-8">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-accent-foreground flex items-center gap-2">
          <Sparkles className="fill-accent text-accent" />
          FocusFlow
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Hello, {user?.name}</p>
      </div>

      <div className="space-y-1 flex-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", pathname === item.href ? "fill-current" : "")} />
            {item.title}
          </Link>
        ))}
      </div>

      <Button 
        variant="ghost" 
        className="mt-auto flex items-center justify-start gap-3 text-muted-foreground hover:text-destructive"
        onClick={() => {
            logout()
            window.location.href = "/"
        }}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  )
}
