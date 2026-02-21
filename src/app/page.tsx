
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, GraduationCap, School } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, UserRole } from "@/lib/auth-store"

export default function LandingPage() {
  const [role, setRole] = useState<UserRole>('student')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const setUser = useAuth((state) => state.setUser)

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated auth logic
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      role,
      name: email.split('@')[0],
    }
    setUser(mockUser)
    router.push(role === 'teacher' ? "/dashboard/teacher" : "/dashboard/student")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-primary">
          <Sparkles className="h-10 w-10 text-accent-foreground fill-accent" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">FocusFlow</h1>
        <p className="mt-2 text-muted-foreground">Elevate your learning experience with AI-powered focus.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Log in to your account to continue your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth}>
            <div className="grid w-full items-center gap-6">
              <Tabs defaultValue="student" className="w-full" onValueChange={(v) => setRole(v as UserRole)}>
                <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
                  <TabsTrigger value="student" className="flex items-center gap-2 rounded-md">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="flex items-center gap-2 rounded-md">
                    <School className="h-4 w-4" />
                    Teacher
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-6 rounded-xl">
                Get Started
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            By clicking continue, you agree to our Terms of Service.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
