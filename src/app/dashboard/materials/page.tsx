
"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Link as LinkIcon, Download, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function MaterialsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [materials, setMaterials] = useState([
    { id: 1, title: "Advanced Algebra Notes", type: "PDF", subject: "Math", date: "2024-03-20", author: "Dr. Smith", size: "2.4 MB" },
    { id: 2, title: "Chemistry Lab Guide", type: "Link", subject: "Science", date: "2024-03-18", author: "Prof. Johnson", size: "-" },
    { id: 3, title: "English Literature Syllabus", type: "PDF", subject: "Humanities", date: "2024-03-15", author: "Dr. Smith", size: "1.1 MB" },
  ])

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
          <p className="text-muted-foreground">Access shared resources and course documents.</p>
        </div>

        {user?.role === 'teacher' && (
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
                  <Input id="title" className="col-span-3" placeholder="Resource name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Input id="type" className="col-span-3" placeholder="PDF, Link, etc." />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">File</Label>
                  <Input id="file" type="file" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-accent text-accent-foreground">Save Material</Button>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((material) => (
          <Card key={material.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative h-32 bg-primary/20 flex items-center justify-center">
              {material.type === 'PDF' ? <FileText className="h-12 w-12 text-primary fill-primary/20" /> : <LinkIcon className="h-12 w-12 text-accent fill-accent/20" />}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                <Badge variant="outline">{material.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>Uploaded by {material.author}</p>
              <p>Date: {material.date} • {material.size}</p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              {user?.role === 'teacher' && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
