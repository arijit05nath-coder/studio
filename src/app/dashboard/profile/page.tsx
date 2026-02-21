
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { updateEmail } from "firebase/auth"
import { doc as firestoreDoc } from "firebase/firestore"
import { User, Mail, Sparkles, Loader2, Save, Moon, Sun, Trees, Coffee, GraduationCap, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const THEMES = [
  { id: 'default', name: 'Default Light', icon: Sun, class: '' },
  { id: 'dark', name: 'Standard Dark', icon: Moon, class: 'dark' },
  { id: 'midnight', name: 'Midnight Scholar', icon: Sparkles, class: 'theme-midnight' },
  { id: 'forest', name: 'Forest Library', icon: Trees, class: 'theme-forest' },
  { id: 'sunrise', name: 'Sunrise Focus', icon: Coffee, class: 'theme-sunrise' },
]

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return firestoreDoc(db, "userProfiles", user.uid);
  }, [user, db]);

  const profileResult = useDoc(profileDocRef);
  const profile = profileResult.data;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    educationalQualification: "",
    photoUrl: "",
  })
  const [loading, setLoading] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [tempPhotoUrl, setTempPhotoUrl] = useState("")

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        educationalQualification: profile.educationalQualification || "",
        photoUrl: profile.photoUrl || "",
      })
      setTempPhotoUrl(profile.photoUrl || "")
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return
    setLoading(true)

    try {
      updateDocumentNonBlocking(firestoreDoc(db, "userProfiles", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        educationalQualification: formData.educationalQualification,
        photoUrl: formData.photoUrl,
      })

      if (formData.email !== user.email) {
        try {
          await updateEmail(user, formData.email)
        } catch (e) {}
      }

      toast({ title: "Profile updated successfully!" })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvatar = () => {
    setFormData(prev => ({ ...prev, photoUrl: tempPhotoUrl }))
    if (user && db) {
      updateDocumentNonBlocking(firestoreDoc(db, "userProfiles", user.uid), {
        photoUrl: tempPhotoUrl,
      })
    }
    setIsAvatarDialogOpen(false)
    toast({ title: "Profile picture updated!" })
  }

  const handleThemeChange = (themeId: string) => {
    if (!user || !db) return
    updateDocumentNonBlocking(firestoreDoc(db, "userProfiles", user.uid), {
      theme: themeId
    })
    toast({ title: `Theme changed to ${THEMES.find(t => t.id === themeId)?.name}` })
  }

  if (profileResult.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your identity and app appearance.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden text-center p-8 bg-card">
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogTrigger asChild>
                <div className="relative inline-block mb-4 cursor-pointer group">
                  <Avatar className="h-24 w-24 border-4 border-accent shadow-lg group-hover:opacity-80 transition-opacity">
                    <AvatarImage src={formData.photoUrl} />
                    <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-accent text-accent-foreground rounded-full border-2 border-background group-hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Update Profile Picture</DialogTitle>
                  <DialogDescription>
                    Provide a URL for your new profile picture.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Image URL</Label>
                    <Input 
                      id="photoUrl" 
                      placeholder="https://example.com/photo.jpg" 
                      value={tempPhotoUrl}
                      onChange={(e) => setTempPhotoUrl(e.target.value)}
                    />
                  </div>
                  {tempPhotoUrl && (
                    <div className="flex justify-center">
                      <Avatar className="h-24 w-24 border-2 border-accent">
                        <AvatarImage src={tempPhotoUrl} />
                        <AvatarFallback>Preview</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateAvatar} className="bg-accent text-accent-foreground">Save Photo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
            <p className="text-sm text-muted-foreground mb-4">{profile?.role || 'Student'}</p>
            <Badge variant="secondary" className="bg-primary/20 text-accent-foreground px-4">
              Level {profile?.level || 1} Scholar
            </Badge>
          </Card>

          <Card className="border-none shadow-sm p-6 space-y-4 bg-card">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Account Info</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-accent" />
              <span className="truncate">{formData.email}</span>
            </div>
            {profile?.role === 'Student' && profile?.educationalQualification && (
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-accent" />
                <span className="truncate">{profile.educationalQualification}</span>
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your name and primary email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formPhotoUrl">Profile Picture URL</Label>
                  <Input 
                    id="formPhotoUrl" 
                    value={formData.photoUrl} 
                    onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                    placeholder="https://example.com/photo.jpg"
                    className="rounded-xl"
                  />
                </div>
                {profile?.role === 'Student' && (
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Educational Qualification</Label>
                    <Input 
                      id="qualification" 
                      value={formData.educationalQualification} 
                      onChange={e => setFormData({...formData, educationalQualification: e.target.value})}
                      placeholder="e.g. High School Senior, Undergraduate"
                      className="rounded-xl"
                    />
                  </div>
                )}
                <Button disabled={loading} className="bg-accent text-accent-foreground rounded-xl px-8 shadow-sm hover:shadow-md transition-all">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Study Environments</CardTitle>
              <CardDescription>Choose a visual theme that matches your focus style.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                      profile?.theme === theme.id 
                        ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                        : "border-muted hover:border-accent/40 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl bg-muted group-hover:scale-110 transition-transform",
                      profile?.theme === theme.id ? "bg-accent text-accent-foreground" : ""
                    )}>
                      <theme.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold">{theme.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
