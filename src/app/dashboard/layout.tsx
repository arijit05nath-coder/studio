
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { DashboardNav } from "@/components/dashboard-nav"
import { doc, getDoc } from "firebase/firestore"
import { Loader2, Sparkles } from "lucide-react"
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    } else if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, "userProfiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
        setProfileLoading(false);
      };
      fetchProfile();
    }
  }, [user, isUserLoading, db, router]);

  if (isUserLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardNav role={role as any} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-40">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent fill-accent" />
              <span className="font-bold text-lg hidden sm:inline-block">FocusFlow</span>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
