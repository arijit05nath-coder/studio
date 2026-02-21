
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, GraduationCap, School, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore, useUser, setDocumentNonBlocking } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [qualification, setQualification] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  // Initial check for existing session
  useEffect(() => {
    if (user && !isUserLoading) {
      const checkRoleAndRedirect = async () => {
        const docRef = doc(db, "userProfiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          router.replace(userData.role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student");
        }
      };
      checkRoleAndRedirect();
    }
  }, [user, isUserLoading, db, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return;
    
    setLoading(true)

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("First name and Last name are required.")
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user
        const mappedRole = role === 'teacher' ? 'Teacher' : 'Student';
        
        // Use non-blocking profile creation
        setDocumentNonBlocking(doc(db, "userProfiles", newUser.uid), {
          id: newUser.uid,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          role: mappedRole,
          educationalQualification: qualification.trim(),
          dateCreated: serverTimestamp(),
          level: 1,
          focusGoal: 4,
          focusScore: 0,
          theme: 'default'
        }, { merge: true });

        // Sign out immediately after sign up to force login
        await signOut(auth);
        
        // Reset state to show login form
        setIsSignUp(false);
        setPassword("");
        
        toast({ 
          title: "Account created successfully!", 
          description: "Please log in with your new credentials." 
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Fetch role immediately to redirect faster
        const docSnap = await getDoc(doc(db, "userProfiles", userCredential.user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          router.push(userData.role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student");
        } else {
          // Fallback if profile is missing
          router.push("/dashboard/student");
        }
        toast({ title: "Welcome back!" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Registration failed" : "Login failed",
        description: error.message || "An unexpected error occurred. Please try again.",
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
          <Sparkles className="h-10 w-10 text-accent-foreground fill-current" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-accent-foreground">StudyNest</h1>
        <p className="mt-2 text-muted-foreground">Elevate your learning experience with AI-powered focus.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardTitle className="text-center font-normal text-muted-foreground text-sm mt-2">
            {isSignUp ? "Join StudyNest today" : "Log in to your account to continue"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth}>
            <div className="grid w-full items-center gap-6">
              {isSignUp && (
                <>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Jane" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="qualification">Educational Qualification</Label>
                    <Input 
                      id="qualification" 
                      placeholder={role === 'student' ? "e.g. High School Senior, Undergraduate" : "e.g. PhD in Physics, Math Professor"}
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>
                </>
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
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 bg-background"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-6 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Log In")}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button 
            variant="link" 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-sm font-bold text-accent-foreground hover:text-accent transition-colors underline-offset-4"
          >
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
