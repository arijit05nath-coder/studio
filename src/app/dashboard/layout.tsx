
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { DashboardNav } from "@/components/dashboard-nav"
import { doc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // Real-time profile hook
  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const getThemeClass = () => {
    if (!profile?.theme) return "";
    if (profile.theme === 'dark') return "dark";
    if (profile.theme === 'midnight') return "theme-midnight";
    if (profile.theme === 'forest') return "theme-forest";
    if (profile.theme === 'sunrise') return "theme-sunrise";
    return "";
  }

  // Handle Authentication redirection
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/")
    }
  }, [user, isUserLoading, router]);

  // Apply theme class to body
  useEffect(() => {
    const themeClass = getThemeClass();
    const body = document.body;
    const themeClasses = ['dark', 'theme-midnight', 'theme-forest', 'theme-sunrise'];
    
    body.classList.remove(...themeClasses);
    if (themeClass) {
      body.classList.add(themeClass);
    }
    
    return () => {
      body.classList.remove(...themeClasses);
    };
  }, [profile?.theme]);

  // Show global loader if auth or initial profile is loading
  // We check profile data availability if the user is authenticated
  const isInitialLoading = isUserLoading || (user && isProfileLoading && !profile);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", getThemeClass())}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-500">
          <DashboardNav role={profile?.role as any} profile={profile} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-40">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </header>
            <main className="flex-1">
              <div className="max-w-6xl mx-auto p-4 md:p-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
