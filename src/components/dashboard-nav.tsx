
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"

interface DashboardNavProps {
  role?: 'Student' | 'Teacher'
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()
  const { user } = useUser()

  const navItems = [
    {
      title: "Dashboard",
      href: role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student",
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
      hideFor: 'Teacher' as const,
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
      hideFor: 'Teacher' as const,
    },
  ]

  const filteredItems = navItems.filter(item => !item.hideFor || item.hideFor !== role)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  return (
    <nav className="flex flex-col h-full bg-white border-r px-4 py-8">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-accent-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 fill-accent text-accent" />
          FocusFlow
        </h1>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {user?.email}
        </p>
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
        className="mt-auto flex items-center justify-start gap-3 text-muted-foreground hover:text-destructive p-3"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  )
}
