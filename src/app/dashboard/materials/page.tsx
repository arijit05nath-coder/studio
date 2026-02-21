"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Globe, Download, Plus, Trash2, Loader2, UploadCloud } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, orderBy, doc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore"

export default function MaterialsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: "", type: "PDF", subjectId: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      if (user && db) {
        const snap = await getDoc(doc(db, "userProfiles", user.uid));
        if (snap.exists()) setIsTeacher(snap.data().role === 'Teacher');
      }
    };
    checkRole();
  }, [user, db]);

  const materialsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "materials"), orderBy("uploadDate", "desc"));
  }, [db, user]);

  const { data: materials, isLoading } = useCollection(materialsQuery);

  const subjectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "subjects"), orderBy("name", "asc"));
  }, [db, user]);

  const { data: subjects } = useCollection(subjectsQuery);

  const filtered = materials?.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpload = async () => {
    if (!user || !db || !newMaterial.title || !selectedFile || !newMaterial.subjectId) return;
    
    setIsUploading(true);
    
    // For this prototype, we'll simulate the upload with a placeholder URL
    const simulatedUrl = `https://placeholder-storage.com/${selectedFile.name}`;

    addDocumentNonBlocking(collection(db, "materials"), {
      teacherId: user.uid,
      subjectId: newMaterial.subjectId,
      title: newMaterial.title,
      description: "Shared resource",
      type: newMaterial.type,
      linkUrl: simulatedUrl,
      uploadDate: new Date().toISOString(),
      dateCreated: serverTimestamp(),
      author: user.email?.split('@')[0] || "Unknown"
    });
    
    setNewMaterial({ title: "", type: "PDF", subjectId: "" });
    setSelectedFile(null);
    setIsUploading(false);
  }

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "materials", id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
          <p className="text-muted-foreground">Access shared resources and course documents.</p>
        </div>

        {isTeacher && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Material</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Advanced Calculus Notes" 
                    value={newMaterial.title}
                    onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Course / Subject</Label>
                  <Select 
                    value={newMaterial.subjectId} 
                    onValueChange={v => setNewMaterial({...newMaterial, subjectId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Material Type</Label>
                  <Select 
                    value={newMaterial.type} 
                    onValueChange={v => setNewMaterial({...newMaterial, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF Document</SelectItem>
                      <SelectItem value="Note">Study Note</SelectItem>
                      <SelectItem value="Video">Video Resource</SelectItem>
                      <SelectItem value="Sheet">Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">{selectedFile ? selectedFile.name : "Click to upload"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {newMaterial.type} (MAX. 50MB)
                        </p>
                      </div>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleUpload} 
                  disabled={!newMaterial.title || !selectedFile || !newMaterial.subjectId || isUploading}
                  className="bg-accent text-accent-foreground w-full"
                >
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Material"}
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
          placeholder="Search materials by title..." 
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
          {filtered.map((material) => (
            <Card key={material.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative h-32 bg-primary/20 flex items-center justify-center">
                {material.type.toUpperCase() === 'PDF' ? <FileText className="h-12 w-12 text-primary fill-primary/20" /> : <Globe className="h-12 w-12 text-accent fill-accent/20" />}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{material.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Uploaded by {material.author}</p>
                <p>Date: {material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}</p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="gap-2 text-accent-foreground hover:bg-accent/10" asChild>
                  <a href={material.linkUrl || "#"} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Access
                  </a>
                </Button>
                {(isTeacher || user?.uid === material.teacherId) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
              No materials found. Start by uploading one!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
