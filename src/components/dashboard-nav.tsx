
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  Sparkles, 
  LogOut,
  Book,
  BarChart3,
  User,
  Settings2,
  Sun,
  Moon,
  Trees,
  Coffee,
  Trophy,
  Languages,
  BrainCircuit
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"
import { useI18n } from "@/lib/i18n-store"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'ml', name: 'മലയാളം' },
]

export function DashboardNav({ role, profile }: DashboardNavProps) {
  const { setLanguage, t } = useI18n()
  const pathname = usePathname()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const navItems = [
    {
      title: t('dashboard'),
      href: role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      title: t('studentProgress'),
      href: "/dashboard/student-progress",
      icon: BarChart3,
      showOnlyFor: 'Teacher' as const,
    },
    {
      title: t('curriculum'),
      href: "/dashboard/courses",
      icon: Book,
    },
    {
      title: t('focusMode'),
      href: "/dashboard/focus",
      icon: Clock,
      hideFor: 'Teacher' as const,
    },
    {
      title: t('achievements'),
      href: "/dashboard/achievements",
      icon: Trophy,
      hideFor: 'Teacher' as const,
    },
    {
      title: t('groups'),
      href: "/dashboard/groups",
      icon: Users,
      hideFor: 'Teacher' as const,
    },
    {
      title: t('aiCoach'),
      href: "/dashboard/ai-coach",
      icon: BrainCircuit,
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
    const themeName = THEMES.find(t => t.id === themeId)?.name || themeId
    updateDocumentNonBlocking(doc(db, "userProfiles", user.uid), {
      theme: themeId
    })
    toast({ title: `Theme changed to ${themeName}` })
  }

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || "User")
  const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` : "U"

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="hidden md:flex flex-col items-center gap-3 p-2 bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl rounded-[2rem] fixed left-5 top-1/2 -translate-y-1/2 z-50 py-6 min-w-[60px]">
        <div className="mb-4">
          <Link href={role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student"}>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-sm text-accent-foreground border border-accent/20 shadow-sm transition-transform hover:scale-110 active:scale-95">
              <Sparkles className="size-4 fill-current" />
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          {filteredItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link 
                  href={item.href}
                  className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 group",
                    pathname === item.href ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pathname === item.href && (
                    <motion.div
                      layoutId="desktop-nav-pill"
                      className="absolute inset-0 bg-accent rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={cn("relative z-10 size-4", pathname === item.href && "fill-current")} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={15}>
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative transition-transform hover:scale-105 active:scale-95">
                <Avatar className="h-9 w-9 border-2 border-transparent hover:border-accent">
                  {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                  <AvatarFallback className="rounded-xl bg-accent text-accent-foreground font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="w-56 rounded-2xl mb-4 bg-popover/80 backdrop-blur-xl border-border/50 shadow-xl" align="end" sideOffset={15}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold capitalize">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings2 className="mr-2 h-4 w-4" />
                    <span>{t('theme')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="p-1 min-w-[140px] rounded-xl bg-popover/90 backdrop-blur-xl border-border/50">
                      {THEMES.map((theme) => (
                        <DropdownMenuItem key={theme.id} onClick={() => handleThemeChange(theme.id)}>
                          <theme.icon className="mr-2 h-4 w-4" />
                          <span>{theme.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>{t('language')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="p-1 min-w-[140px] rounded-xl bg-popover/90 backdrop-blur-xl border-border/50">
                      {languages.map((lang) => (
                        <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}>
                          <span>{lang.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    {t('profile')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm h-14 bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full flex items-center justify-around px-4">
        {filteredItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className={cn(
              "relative p-2.5 rounded-full transition-all duration-300",
              pathname === item.href ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pathname === item.href && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute inset-0 bg-accent rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon className={cn("relative z-10 size-4", pathname === item.href && "fill-current")} />
          </Link>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative">
              <Avatar className="h-9 w-9 border-2 border-transparent hover:border-accent">
                {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
                <AvatarFallback className="rounded-full bg-accent text-accent-foreground font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56 rounded-2xl mb-4 bg-popover/80 backdrop-blur-xl border-border/50 shadow-xl" align="center" sideOffset={12}>
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>{t('theme')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="p-1 min-w-[140px] rounded-xl bg-popover/90 backdrop-blur-xl border-border/50">
                    {THEMES.map((theme) => (
                      <DropdownMenuItem key={theme.id} onClick={() => handleThemeChange(theme.id)}>
                        <theme.icon className="mr-2 h-4 w-4" />
                        <span>{theme.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{t('language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="p-1 min-w-[140px] rounded-xl bg-popover/90 backdrop-blur-xl border-border/50">
                    {languages.map((lang) => (
                      <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}>
                        <span>{lang.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </TooltipProvider>
  )
}
