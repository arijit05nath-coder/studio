
"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { updateEmail } from "firebase/auth"
import { doc as firestoreDoc } from "firebase/firestore"
import { User, Mail, Sparkles, Loader2, Save, Moon, Sun, Trees, Coffee, GraduationCap, Camera, Upload, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n-store"

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
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

      toast({ title: t('save') })
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    toast({ title: t('updateProfilePic') })
  }

  const handleThemeChange = (themeId: string) => {
    if (!user || !db) return
    updateDocumentNonBlocking(firestoreDoc(db, "userProfiles", user.uid), {
      theme: themeId
    })
    toast({ title: t('theme') })
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
        <h1 className="text-3xl font-bold tracking-tight">{t('profile')}</h1>
        <p className="text-muted-foreground">{t('manageIdentity')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden text-center p-8 bg-card">
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogTrigger asChild>
                <div className="relative inline-block mb-4 cursor-pointer group">
                  <Avatar className="h-24 w-24 border-4 border-accent shadow-lg">
                    {formData.photoUrl && <AvatarImage src={formData.photoUrl} />}
                    <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-accent text-accent-foreground rounded-full border-2 border-background">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('updateProfilePic')}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div 
                      className="w-full h-40 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {tempPhotoUrl ? (
                        <img src={tempPhotoUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Click to select</span>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateAvatar} className="bg-accent text-accent-foreground">{t('savePhoto')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
            <Badge variant="secondary" className="bg-primary/20 text-accent-foreground px-4">
              {t('level')} {profile?.level || 1} {t('scholar')}
            </Badge>
          </Card>

          <Card className="border-none shadow-sm p-6 space-y-4 bg-card">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{t('accountInfo')}</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-accent" />
              <span className="truncate">{formData.email}</span>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>{t('personalDetails')}</CardTitle>
              <CardDescription>{t('personalDetailsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('firstName')}</Label>
                    <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" />
                </div>
                <Button disabled={loading} className="bg-accent text-accent-foreground rounded-xl px-8 shadow-sm">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>{t('studyEnvironments')}</CardTitle>
              <CardDescription>{t('studyEnvironmentsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                      profile?.theme === theme.id ? "border-accent bg-accent/5" : "border-muted"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl bg-muted", profile?.theme === theme.id ? "bg-accent text-accent-foreground" : "")}>
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
