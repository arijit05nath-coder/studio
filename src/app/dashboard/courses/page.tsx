
"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, getDoc, deleteDoc } from "firebase/firestore"
import { Book, Search, Loader2, GraduationCap, ChevronRight, Plus, FileText, ExternalLink, Video, UploadCloud, Globe, Trash2, LayoutGrid, List, Save, Settings2, X, FileUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n-store"

export default function CurriculumPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { t } = useI18n()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [newCourseName, setNewCourseName] = useState("")
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  const [editCourseName, setEditCourseName] = useState("")
  const [editCourseDescription, setEditCourseDescription] = useState("")
  const [newResource, setNewResource] = useState({ title: "", url: "", type: "PDF", fileName: "" })
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [isAddingResource, setIsAddingResource] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      if (user && db) {
        const snap = await getDoc(doc(db, "userProfiles", user.uid));
        if (snap.exists()) setIsTeacher(snap.data().role === 'Teacher');
      }
    };
    checkRole();
  }, [user, db]);

  useEffect(() => {
    if (selectedSubject) {
      setEditCourseName(selectedSubject.name || "")
      setEditCourseDescription(selectedSubject.description || "")
    }
  }, [selectedSubject])

  const subjectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "subjects"), orderBy("name", "asc"));
  }, [db, user]);
  const { data: subjects, isLoading: isSubjectsLoading } = useCollection(subjectsQuery);

  const materialsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "materials"), orderBy("uploadDate", "desc"));
  }, [db, user]);
  const { data: allMaterials, isLoading: isMaterialsLoading } = useCollection(materialsQuery);

  const filteredSubjects = subjects?.filter(subject => 
    subject.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddCourse = () => {
    if (!db || !newCourseName.trim()) return;
    addDocumentNonBlocking(collection(db, "subjects"), { 
      name: newCourseName.trim(),
      description: "" 
    });
    setNewCourseName("");
    setIsCreateCourseOpen(false);
    toast({ title: t('curriculum') });
  }

  const handleUpdateCourseDetails = () => {
    if (!db || !selectedSubject || !editCourseName.trim()) return;
    setIsSavingCourse(true);
    updateDocumentNonBlocking(doc(db, "subjects", selectedSubject.id), {
      name: editCourseName.trim(),
      description: editCourseDescription.trim()
    });
    setTimeout(() => {
      setIsSavingCourse(false);
      toast({ title: t('save') });
    }, 500);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewResource(prev => ({ 
          ...prev, 
          url: reader.result as string,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  const handleAddResourceToCourse = () => {
    if (!db || !user || !selectedSubject || !newResource.title || !newResource.url) return;
    setIsAddingResource(true);
    addDocumentNonBlocking(collection(db, "materials"), {
      title: newResource.title,
      linkUrl: newResource.url,
      type: newResource.type,
      subjectId: selectedSubject.id,
      teacherId: user.uid,
      author: user.email?.split('@')[0] || "Teacher",
      uploadDate: new Date().toISOString()
    });
    setTimeout(() => {
      setNewResource({ title: "", url: "", type: "PDF", fileName: "" });
      setIsAddingResource(false);
      toast({ title: "Resource added" });
    }, 500);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('curriculum')}</h1>
          <p className="text-muted-foreground">{t('manageCurriculum')}</p>
        </div>

        {isTeacher && (
          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                {t('newMaterial')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('newMaterial')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCourse} className="bg-accent text-accent-foreground">{t('save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 rounded-full bg-card border-none shadow-sm h-12" 
          placeholder={t('searchStudents')} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent" 
                onClick={() => setSelectedSubject(subject)}
              >
                {isTeacher ? t('edit') : t('viewDetails')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedSubject} onOpenChange={(o) => !o && setSelectedSubject(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSubject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('curriculum')}</Label>
              <div className="space-y-2">
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).map((m) => (
                  <div key={m.id} className="flex justify-between p-2 bg-muted/20 rounded-lg">
                    <span>{m.title}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={m.linkUrl} target="_blank"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {isTeacher && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="font-bold">{t('addNewResource')}</h4>
                <Input placeholder={t('resourceTitle')} value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
                <Button onClick={handleAddResourceToCourse} className="bg-accent text-accent-foreground">{t('save')}</Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubject(null)}>{t('cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
