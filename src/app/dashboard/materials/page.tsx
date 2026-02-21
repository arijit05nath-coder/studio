"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Link as LinkIcon, Download, Plus, Trash2, Loader2, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, orderBy, doc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useEffect } from "react"

export default function MaterialsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: "", type: "PDF", linkUrl: "" })

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
    if (!db) return null;
    return query(collection(db, "materials"), orderBy("uploadDate", "desc"));
  }, [db]);

  const { data: materials, isLoading } = useCollection(materialsQuery);

  const filtered = materials?.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpload = () => {
    if (!user || !db || !newMaterial.title) return;
    
    addDocumentNonBlocking(collection(db, "materials"), {
      teacherId: user.uid,
      subjectId: "General",
      topicId: "General",
      title: newMaterial.title,
      description: "Shared resource",
      type: newMaterial.type,
      linkUrl: newMaterial.linkUrl,
      uploadDate: new Date().toISOString(),
      dateCreated: serverTimestamp(),
      author: user.email?.split('@')[0] || "Unknown"
    });
    
    setNewMaterial({ title: "", type: "PDF", linkUrl: "" });
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
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Material</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input 
                    id="title" 
                    className="col-span-3" 
                    placeholder="Resource name" 
                    value={newMaterial.title}
                    onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <div className="col-span-3">
                    <Select 
                      value={newMaterial.type} 
                      onValueChange={v => setNewMaterial({...newMaterial, type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF Document</SelectItem>
                        <SelectItem value="Link">Web Link</SelectItem>
                        <SelectItem value="Note">Study Note</SelectItem>
                        <SelectItem value="Video">Video Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">URL</Label>
                  <Input 
                    id="url" 
                    className="col-span-3" 
                    placeholder="https://..." 
                    value={newMaterial.linkUrl}
                    onChange={e => setNewMaterial({...newMaterial, linkUrl: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpload} className="bg-accent text-accent-foreground">Save Material</Button>
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
                  <Badge variant="outline">{material.subjectId}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Uploaded by {material.author}</p>
                <p>Date: {material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}</p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="gap-2" asChild>
                  <a href={material.linkUrl || "#"} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Access
                  </a>
                </Button>
                {(isTeacher || user?.uid === material.teacherId) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No materials found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
