
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, GraduationCap, School, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !isUserLoading) {
      // Check user role from Firestore profile
      const checkRole = async () => {
        const docRef = doc(db, "userProfiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          router.push(userData.role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student");
        }
      };
      checkRole();
    }
  }, [user, isUserLoading, db, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user
        
        // Create user profile in Firestore
        const firstName = email.split('@')[0]
        await setDoc(doc(db, "userProfiles", newUser.uid), {
          id: newUser.uid,
          firstName,
          lastName: "",
          email,
          role: role === 'teacher' ? 'Teacher' : 'Student',
          dateCreated: serverTimestamp(),
        })

        toast({ title: "Account created successfully!" })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({ title: "Welcome back!" })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-primary">
          <Sparkles className="h-10 w-10 text-accent-foreground fill-accent" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground text-accent-foreground">FocusFlow</h1>
        <p className="mt-2 text-muted-foreground">Elevate your learning experience with AI-powered focus.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? "Join FocusFlow today" : "Log in to your account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth}>
            <div className="grid w-full items-center gap-6">
              {isSignUp && (
                <Tabs defaultValue="student" className="w-full" onValueChange={(v) => setRole(v as any)}>
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
              )}
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
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
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-6 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Log In")}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm">
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            By clicking continue, you agree to our Terms of Service.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
