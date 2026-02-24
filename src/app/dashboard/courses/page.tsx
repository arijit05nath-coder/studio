
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, getDoc } from "firebase/firestore"
import { Search, Plus, ExternalLink, Trash2, Loader2, Book, FileText, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-store"

export default function CurriculumPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { t, language } = useI18n()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  
  const [newCourseName, setNewCourseName] = useState("")
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  const [newResource, setNewResource] = useState({ title: "", type: "Link", linkUrl: "", description: "" })
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
    toast({ title: t('save') });
  }

  const handleDeleteSubject = (subjectId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, "subjects", subjectId));
    toast({ title: t('subjectDeleted') });
  }

  const handleDeleteMaterial = (materialId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, "materials", materialId));
    toast({ title: t('resourceDeleted') });
  }

  const handleAddResourceToCourse = async () => {
    if (!db || !user || !selectedSubject || !newResource.title || !newResource.linkUrl) return;
    setIsAddingResource(true);

    try {
      addDocumentNonBlocking(collection(db, "materials"), {
        title: newResource.title,
        description: newResource.description,
        linkUrl: newResource.linkUrl,
        type: newResource.type,
        subjectId: selectedSubject.id,
        teacherId: user.uid,
        author: user.email?.split('@')[0] || "Teacher",
        uploadDate: new Date().toISOString()
      });

      setNewResource({ title: "", type: "Link", linkUrl: "", description: "" });
      toast({ title: t('resourceAdded') });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setIsAddingResource(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('curriculum')}</h1>
          <p className="text-muted-foreground text-sm">{t('manageCurriculum')}</p>
        </div>

        {isTeacher && (
          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm h-9">
                <Plus className="h-4 w-4" />
                {t('create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('addNewResource')}</DialogTitle>
                <DialogDescription>{t('subjectsDescription')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('resourceTitle')}</Label>
                  <Input 
                    id="name"
                    placeholder="e.g. Organic Chemistry"
                    value={newCourseName} 
                    onChange={(e) => setNewCourseName(e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCourse} className="bg-accent text-accent-foreground rounded-xl px-6">
                  {t('save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 rounded-full bg-card border-none shadow-sm h-10" 
          placeholder={t('searchMaterials')} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isSubjectsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                <CardTitle className="text-lg truncate">{subject.name}</CardTitle>
                {isTeacher && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteSubjectTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteSubjectConfirm').replace('{name}', subject.name)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-destructive text-destructive-foreground">
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {allMaterials?.filter(m => m.subjectId === subject.id).length || 0} {t('materials')}
                  </span>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-accent/10 text-accent hover:bg-accent/20 text-xs h-8 rounded-full px-6 font-bold" 
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {t('viewDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredSubjects.length === 0 && (
            <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
              <Book className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-sm text-muted-foreground">{t('noSubjectsFound')}</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedSubject} onOpenChange={(o) => !o && setSelectedSubject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Book className="h-5 w-5 text-accent" />
              {selectedSubject?.name}
            </DialogTitle>
            <DialogDescription>
              {t('subjectResourcesDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('resources')}</Label>
              <div className="space-y-2">
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).map((m) => (
                  <div key={m.id} className="flex flex-col p-3 bg-muted/30 rounded-xl group transition-all hover:bg-muted/50 gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-background p-2 rounded-lg shrink-0">
                          <FileText className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{m.title}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {m.description || m.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                          <a href={m.linkUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        {isTeacher && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('deleteResourceTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('deleteResourceConfirm').replace('{name}', m.title)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMaterial(m.id)} className="bg-destructive text-destructive-foreground">
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(allMaterials?.filter(m => m.subjectId === selectedSubject?.id).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic text-xs">
                    {t('noResourcesFound')}
                  </div>
                )}
              </div>
            </div>

            {isTeacher && (
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-accent rounded-full" />
                  <h4 className="font-bold text-sm">{t('addNewResource')}</h4>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="resTitle" className="text-xs">{t('resourceTitle')}</Label>
                    <Input 
                      id="resTitle" 
                      placeholder="e.g. Chapter 1 Summary" 
                      value={newResource.title} 
                      onChange={e => setNewResource({...newResource, title: e.target.value})} 
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resUrl" className="text-xs">{t('resourceLink')}</Label>
                    <Input 
                      id="resUrl" 
                      placeholder="https://..." 
                      value={newResource.linkUrl} 
                      onChange={e => setNewResource({...newResource, linkUrl: e.target.value})} 
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resDesc" className="text-xs">{t('resourceDescription')}</Label>
                    <Textarea 
                      id="resDesc" 
                      placeholder={t('resourceDescriptionPlaceholder')} 
                      value={newResource.description} 
                      onChange={e => setNewResource({...newResource, description: e.target.value})} 
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <Button 
                    onClick={handleAddResourceToCourse} 
                    disabled={isAddingResource || !newResource.title || !newResource.linkUrl}
                    className="w-full bg-accent text-accent-foreground h-10 rounded-xl gap-2 mt-2 font-bold"
                  >
                    {isAddingResource ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {t('addLink')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 bg-background pt-2 border-t mt-4">
            <Button variant="outline" onClick={() => setSelectedSubject(null)} className="rounded-xl px-8">
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
