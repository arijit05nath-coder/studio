
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, getDoc, where, deleteDoc } from "firebase/firestore"
import { Book, Search, Loader2, GraduationCap, ChevronRight, Plus, FileText, ExternalLink, Edit, Video, UploadCloud, Globe, Trash2, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CurriculumPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  
  // Course State
  const [newCourseName, setNewCourseName] = useState("")
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editCourseName, setEditCourseName] = useState("")
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)

  // Resource State
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false)
  const [newResource, setNewResource] = useState({ title: "", url: "", type: "PDF", subjectId: "" })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      if (user && db) {
        const snap = await getDoc(doc(db, "userProfiles", user.uid));
        if (snap.exists()) setIsTeacher(snap.data().role === 'Teacher');
      }
    };
    checkRole();
  }, [user, db]);

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

  const filteredMaterials = allMaterials?.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Actions
  const handleAddCourse = () => {
    if (!db || !newCourseName.trim()) return;
    addDocumentNonBlocking(collection(db, "subjects"), { name: newCourseName.trim() });
    setNewCourseName("");
    setIsCreateCourseOpen(false);
  }

  const handleUpdateCourse = () => {
    if (!db || !editCourseName.trim() || !editingSubjectId) return;
    updateDocumentNonBlocking(doc(db, "subjects", editingSubjectId), { name: editCourseName.trim() });
    setIsEditDialogOpen(false);
    setEditingSubjectId(null);
  }

  const handleAddResource = () => {
    if (!db || !user || !newResource.title || !newResource.url || !newResource.subjectId) return;
    setIsUploading(true);
    addDocumentNonBlocking(collection(db, "materials"), {
      title: newResource.title,
      linkUrl: newResource.url,
      type: newResource.type,
      subjectId: newResource.subjectId,
      teacherId: user.uid,
      author: user.email?.split('@')[0] || "Teacher",
      uploadDate: new Date().toISOString()
    });
    setTimeout(() => {
      setNewResource({ title: "", url: "", type: "PDF", subjectId: "" });
      setIsUploading(false);
      setIsUploadResourceOpen(false);
    }, 500);
  }

  const handleDeleteMaterial = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "materials", id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Curriculum & Resources</h1>
          <p className="text-muted-foreground">Manage subjects and explore study materials in one place.</p>
        </div>

        {isTeacher && (
          <div className="flex gap-2">
            <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Course Name</Label>
                    <Input placeholder="e.g., Organic Chemistry" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCourse} disabled={!newCourseName.trim()} className="bg-accent text-accent-foreground">Create Course</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isUploadResourceOpen} onOpenChange={setIsUploadResourceOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                  <UploadCloud className="h-4 w-4" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload Material</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g., Midterm Study Guide" value={newResource.title} onChange={(e) => setNewResource({...newResource, title: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject / Course</Label>
                    <Select value={newResource.subjectId} onValueChange={(v) => setNewResource({...newResource, subjectId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={newResource.type} onValueChange={(v) => setNewResource({...newResource, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF Document</SelectItem>
                        <SelectItem value="Note">Study Note</SelectItem>
                        <SelectItem value="Video">Video Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>File URL / Link</Label>
                    <Input placeholder="https://..." value={newResource.url} onChange={(e) => setNewResource({...newResource, url: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddResource} disabled={!newResource.title || !newResource.url || !newResource.subjectId || isUploading} className="bg-accent text-accent-foreground">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Resource"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 rounded-full bg-card border-none shadow-sm h-12" 
          placeholder="Search courses or resources..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-card p-1 rounded-full w-fit">
          <TabsTrigger value="courses" className="rounded-full gap-2 px-6">
            <LayoutGrid className="h-4 w-4" /> By Course
          </TabsTrigger>
          <TabsTrigger value="materials" className="rounded-full gap-2 px-6">
            <List className="h-4 w-4" /> All Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
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
                      <Badge variant="secondary" className="bg-card/50">Core</Badge>
                    </div>
                    {isTeacher && (
                      <Button 
                        variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setEditingSubjectId(subject.id); setEditCourseName(subject.name); setIsEditDialogOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CardTitle className="text-xl mb-2">{subject.name}</CardTitle>
                    <CardDescription className="line-clamp-2">Comprehensive curriculum and curated resources for {subject.name}.</CardDescription>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        <span>Curriculum 2024</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-accent group-hover:translate-x-1 transition-transform" onClick={() => setSelectedSubject(subject)}>
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials">
          {isMaterialsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow bg-card">
                  <div className="relative h-24 bg-primary/20 flex items-center justify-center">
                    {material.type === 'PDF' ? <FileText className="h-10 w-10 text-primary" /> : material.type === 'Video' ? <Video className="h-10 w-10 text-accent" /> : <Globe className="h-10 w-10 text-accent" />}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg leading-tight truncate">{material.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{material.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-[10px] text-muted-foreground">
                    <p>Uploaded by {material.author}</p>
                    <p>{new Date(material.uploadDate).toLocaleDateString()}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="ghost" size="sm" className="gap-2 text-accent" asChild>
                      <a href={material.linkUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open</a>
                    </Button>
                    {isTeacher && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(material.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
              {filteredMaterials.length === 0 && <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">No materials found.</div>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedSubject} onOpenChange={(o) => !o && setSelectedSubject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Book className="h-6 w-6 text-accent" /> {selectedSubject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Course Resources</h4>
              <div className="grid gap-3">
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-3">
                      {m.type === 'Video' ? <Video className="h-4 w-4 text-accent" /> : <FileText className="h-4 w-4 text-accent" />}
                      <span className="text-sm font-medium">{m.title}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={m.linkUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  </div>
                ))}
                {allMaterials?.filter(m => m.subjectId === selectedSubject?.id).length === 0 && <p className="text-sm italic text-muted-foreground">No resources linked to this course yet.</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Course Name</Label>
              <Input value={editCourseName} onChange={(e) => setEditCourseName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCourse} disabled={!editCourseName.trim()} className="bg-accent text-accent-foreground">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
