
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, getDoc, where } from "firebase/firestore"
import { Book, Search, Loader2, GraduationCap, ChevronRight, Plus, FileText, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { addDocumentNonBlocking } from "@/firebase"

export default function CoursesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  const [newCourseName, setNewCourseName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

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
    if (!db) return null;
    return query(collection(db, "subjects"), orderBy("name", "asc"));
  }, [db]);

  const { data: subjects, isLoading } = useCollection(subjectsQuery);

  const materialsQuery = useMemoFirebase(() => {
    if (!db || !selectedSubject) return null;
    return query(collection(db, "materials"), where("subjectId", "==", selectedSubject.id));
  }, [db, selectedSubject]);

  const { data: relatedMaterials, isLoading: isMaterialsLoading } = useCollection(materialsQuery);

  const filteredSubjects = subjects?.filter(subject => 
    subject.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddCourse = () => {
    if (!db || !newCourseName.trim()) return;
    
    addDocumentNonBlocking(collection(db, "subjects"), {
      name: newCourseName.trim(),
    });

    setNewCourseName("");
    setIsDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Available Courses</h1>
          <p className="text-muted-foreground">Explore subjects and manage your curriculum.</p>
        </div>

        {isTeacher && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Create a new subject for students to explore.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    placeholder="e.g., Organic Chemistry"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCourse} disabled={!newCourseName.trim()} className="bg-accent text-accent-foreground">
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 rounded-full bg-white border-none shadow-sm h-12" 
          placeholder="Search for a course or subject..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="bg-primary/10 pb-4">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Book className="h-5 w-5 text-accent" />
                  </div>
                  <Badge variant="secondary" className="bg-white/50">Core</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <CardTitle className="text-xl mb-2">{subject.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  Comprehensive curriculum covering fundamental concepts and advanced applications in {subject.name}.
                </CardDescription>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GraduationCap className="h-3 w-3" />
                    <span>Academic Year 2024</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 text-accent group-hover:translate-x-1 transition-transform"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    View Details <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredSubjects.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <Book className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or contact your administrator.</p>
            </div>
          )}
        </div>
      )}

      {/* Course Details Dialog */}
      <Dialog open={!!selectedSubject} onOpenChange={(open) => !open && setSelectedSubject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Book className="h-6 w-6 text-accent" />
              {selectedSubject?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information and related study materials for this course.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Description</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This course provides an in-depth exploration of {selectedSubject?.name}. 
                Students will engage with core principles, practical applications, and 
                advanced theoretical frameworks essential for mastering the subject matter.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Related Materials</h4>
              {isMaterialsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                </div>
              ) : relatedMaterials && relatedMaterials.length > 0 ? (
                <div className="grid gap-3">
                  {relatedMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{material.title}</p>
                          <p className="text-[10px] text-muted-foreground">{material.type} • {material.author}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={material.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No materials linked to this course yet.</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubject(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
