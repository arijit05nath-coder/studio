
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, GraduationCap, School, Loader2, Eye, EyeOff, Languages, Sun, Moon, Trees, Coffee, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore, useUser, setDocumentNonBlocking } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'ml', name: 'മലയാളം' },
]

const THEMES = [
  { id: 'default', name: 'Light', icon: Sun, class: '' },
  { id: 'dark', name: 'Dark', icon: Moon, class: 'dark' },
  { id: 'midnight', name: 'Midnight', icon: Sparkles, class: 'theme-midnight' },
  { id: 'forest', name: 'Forest', icon: Trees, class: 'theme-forest' },
  { id: 'sunrise', name: 'Sunrise', icon: Coffee, class: 'theme-sunrise' },
]

export default function LandingPage() {
  const { language, setLanguage, t } = useI18n()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [qualification, setQualification] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('default')
  
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    const body = document.body;
    const themeClasses = ['dark', 'theme-midnight', 'theme-forest', 'theme-sunrise'];
    body.classList.remove(...themeClasses);
    
    const themeConfig = THEMES.find(t => t.id === currentTheme);
    if (themeConfig?.class) {
      body.classList.add(themeConfig.class);
    }
  }, [currentTheme]);

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
          theme: currentTheme
        }, { merge: true });

        await signOut(auth);
        setIsSignUp(false);
        setPassword("");
        
        toast({ 
          title: t('createAccount'), 
          description: "Account created successfully!" 
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const docSnap = await getDoc(doc(db, "userProfiles", userCredential.user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          router.push(userData.role === 'Teacher' ? "/dashboard/teacher" : "/dashboard/student");
        } else {
          router.push("/dashboard/student");
        }
        toast({ title: t('welcomeBack') });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Registration failed" : "Login failed",
        description: error.message || "An error occurred.",
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background transition-colors duration-500">
      <div className="absolute top-4 right-4 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full bg-card shadow-sm">
              <Palette className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {THEMES.map((theme) => (
              <DropdownMenuItem 
                key={theme.id} 
                onClick={() => setCurrentTheme(theme.id)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  currentTheme === theme.id ? "bg-accent/10 text-accent font-bold" : ""
                )}
              >
                <theme.icon className="h-4 w-4" />
                {theme.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full bg-card shadow-sm">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => setLanguage(lang.code as any)}
                className={cn(
                  "cursor-pointer",
                  language === lang.code ? "bg-accent/10 text-accent font-bold" : ""
                )}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-[#E6E6FA] shadow-sm border-2 border-[#A0D6B4]">
          <Sparkles className="h-10 w-10 text-[#6A5ACD] fill-current" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-accent-foreground">{t('appName')}</h1>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t('tagline')}</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? t('createAccount') : t('welcomeBack')}
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
                        {t('student')}
                      </TabsTrigger>
                      <TabsTrigger value="teacher" className="flex items-center gap-2 rounded-md">
                        <School className="h-4 w-4" />
                        {t('teacher')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="firstName">{t('firstName')}</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="lastName">{t('lastName')}</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="qualification">{t('qualification')}</Label>
                    <Input id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} required className="rounded-xl" />
                  </div>
                </>
              )}
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-6 rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? t('signup') : t('login'))}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button 
            variant="link" 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-accent font-bold text-base hover:text-accent/80 transition-all underline-offset-4 hover:underline bg-accent/5 px-6 py-2 rounded-full border border-accent/10"
          >
            {isSignUp ? t('login') : t('signup')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
