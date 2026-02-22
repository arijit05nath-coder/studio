
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
  
  // Course State
  const [newCourseName, setNewCourseName] = useState("")
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  // Unified Management State
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

  // Queries
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

  // Actions
  const handleAddCourse = () => {
    if (!db || !newCourseName.trim()) return;
    addDocumentNonBlocking(collection(db, "subjects"), { 
      name: newCourseName.trim(),
      description: "" 
    });
    setNewCourseName("");
    setIsCreateCourseOpen(false);
    toast({ title: "Material folder created successfully" });
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
      toast({ title: "Details updated" });
    }, 500);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Firestore storage (Base64 is ~33% larger)
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 1MB."
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

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
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAddingResource(false);
      toast({ title: "Resource added successfully" });
    }, 500);
  }

  const handleDeleteMaterial = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "materials", id));
    toast({ title: "Resource removed" });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('curriculum')}</h1>
          <p className="text-muted-foreground">Manage subjects and explore study materials in one place.</p>
        </div>

        {isTeacher && (
          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                New Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Material Name</Label>
                  <Input placeholder="e.g., Organic Chemistry" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCourse} disabled={!newCourseName.trim()} className="bg-accent text-accent-foreground">Create Material</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 rounded-full bg-card border-none shadow-sm h-12" 
          placeholder="Search materials..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {isSubjectsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <Card key={subject.id} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all">
                <CardHeader className="bg-primary/20 pb-4 relative">
                  <div className="flex justify-between items-center">
                    <div className="p-2 bg-card rounded-lg shadow-sm">
                      <Book className="h-5 w-5 text-accent" />
                    </div>
                    <Badge variant="secondary" className="bg-card/50">Curriculum</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardTitle className="text-xl mb-2">{subject.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {subject.description || `Comprehensive resources for ${subject.name}.`}
                  </CardDescription>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      <span>Curriculum 2024</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-accent group-hover:translate-x-1 transition-transform font-bold" 
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {isTeacher ? <><Settings2 className="h-4 w-4" /> Manage</> : <>View Details <ChevronRight className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSubjects.length === 0 && <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">No materials found.</div>}
          </div>
        )}
      </div>

      {/* Unified Course Management / Detail Dialog */}
      <Dialog open={!!selectedSubject} onOpenChange={(o) => !o && setSelectedSubject(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Book className="h-6 w-6 text-accent" /> 
              {isTeacher ? "Manage Material" : selectedSubject?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {isTeacher ? (
              <div className="space-y-6 border-b pb-8">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="font-bold">Material Name</Label>
                    <Input 
                      placeholder="e.g., Organic Chemistry" 
                      value={editCourseName} 
                      onChange={(e) => setEditCourseName(e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold">Description</Label>
                    <Textarea 
                      placeholder="Enter a brief overview..." 
                      value={editCourseDescription} 
                      onChange={(e) => setEditCourseDescription(e.target.value)} 
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateCourseDetails} 
                    disabled={isSavingCourse || !editCourseName.trim()} 
                    className="bg-accent text-accent-foreground rounded-xl w-fit gap-2"
                  >
                    {isSavingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground italic leading-relaxed">
                  {selectedSubject?.description || "No description available."}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Resources</h4>
                <Badge variant="outline">{allMaterials?.filter(m => m.subjectId === selectedSubject?.id).length || 0} items</Badge>
              </div>
              
              <div className="grid gap-3">
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 group hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-3">
                      {m.type === 'Video' ? <Video className="h-4 w-4 text-accent" /> : <FileText className="h-4 w-4 text-accent" />}
                      <span className="text-sm font-medium">{m.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-full">
                        <a href={m.linkUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                      {isTeacher && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(m.id)} className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-2xl opacity-50">
                    <p className="text-sm italic">No resources linked yet.</p>
                  </div>
                )}
              </div>
            </div>

            {isTeacher && (
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add New Resource
                </h4>
                <div className="grid gap-4 bg-muted/20 p-6 rounded-2xl border">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Resource Title</Label>
                      <Input 
                        placeholder="e.g., Midterm Study Guide" 
                        value={newResource.title} 
                        onChange={(e) => setNewResource({...newResource, title: e.target.value})} 
                        className="rounded-xl h-9"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Resource Type</Label>
                      <Select value={newResource.type} onValueChange={(v) => setNewResource({...newResource, type: v})}>
                        <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF Document</SelectItem>
                          <SelectItem value="Note">Study Note</SelectItem>
                          <SelectItem value="Video">Video Resource</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Upload File</Label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                        newResource.url ? "bg-accent/5 border-accent/40" : "bg-background hover:bg-muted/50 border-muted-foreground/20"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newResource.fileName ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-5 w-5 text-accent" />
                            <span className="text-sm font-medium truncate">{newResource.fileName}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewResource(prev => ({ ...prev, url: "", fileName: "" }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <FileUp className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Click to upload (PDF, Video, etc.)</p>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddResourceToCourse} 
                    disabled={!newResource.title || !newResource.url || isAddingResource} 
                    className="bg-accent text-accent-foreground rounded-xl w-full md:w-fit gap-2"
                  >
                    {isAddingResource ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    Add Resource
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubject(null)} className="rounded-xl">{t('cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
