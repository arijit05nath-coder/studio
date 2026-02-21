
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Search, Loader2, Book } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useState } from "react"

export default function TeacherDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "userProfiles"), where("role", "==", "Student"));
  }, [db, user]);

  const materialsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "materials"), orderBy("uploadDate", "desc"));
  }, [db, user]);

  const subjectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "subjects"), orderBy("name", "asc"));
  }, [db, user]);

  const { data: students, isLoading: studentsLoading } = useCollection(studentsQuery);
  const { data: materials, isLoading: materialsLoading } = useCollection(materialsQuery);
  const { data: subjects, isLoading: subjectsLoading } = useCollection(subjectsQuery);

  const filteredStudents = students?.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = [
    { 
      title: "Active Students", 
      value: studentsLoading ? "..." : (students?.length || 0).toString(), 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: "Shared Resources", 
      value: materialsLoading ? "..." : (materials?.length || 0).toString(), 
      icon: BookOpen, 
      color: "text-indigo-600" 
    },
    { 
      title: "Total Courses", 
      value: subjectsLoading ? "..." : (subjects?.length || 0).toString(), 
      icon: Book, 
      color: "text-emerald-600" 
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Teacher Overview</h1>
        <p className="text-muted-foreground">Monitor class activity and student performance in real-time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>View all enrolled students and their contact info.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search students..." 
                  className="pl-8 h-9 rounded-full bg-muted/30 border-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between group border-b border-muted/50 pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-muted">
                        {student.photoUrl && <AvatarImage src={student.photoUrl} />}
                        <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                          {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{student.firstName} {student.lastName}</span>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary-foreground border-none">
                      Student
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic">No students found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Recent Shared Resources</CardTitle>
            <CardDescription>Latest materials uploaded across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materialsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : materials && materials.length > 0 ? (
                materials.slice(0, 6).map((material) => (
                  <div key={material.id} className="flex flex-col border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                    <span className="font-semibold text-sm truncate">{material.title}</span>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[9px] py-0 h-4">{material.type}</Badge>
                      <span>{material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm italic">No materials shared yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
