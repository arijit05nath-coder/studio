
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Redirection page as Materials is now merged into Courses/Curriculum.
 */
export default function MaterialsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/courses")
  }, [router])

  return (
    <div className="flex h-[60vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecting to Curriculum...
    </div>
  )
}
