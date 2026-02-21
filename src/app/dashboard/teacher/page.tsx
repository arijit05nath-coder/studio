"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, AlertCircle, TrendingUp, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function TeacherDashboard() {
  const db = useFirestore()

  const studentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "userProfiles"), where("role", "==", "Student"));
  }, [db]);

  const materialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "materials");
  }, [db]);

  const { data: students, isLoading: studentsLoading } = useCollection(studentsQuery);
  const { data: materials, isLoading: materialsLoading } = useCollection(materialsQuery);

  const stats = [
    { 
      title: "Active Students", 
      value: studentsLoading ? "..." : (students?.length || 0).toString(), 
      icon: Users, 
      color: "text-blue-500" 
    },
    { 
      title: "Resources", 
      value: materialsLoading ? "..." : `${materials?.length || 0} Shared`, 
      icon: BookOpen, 
      color: "text-purple-500" 
    },
    { title: "Avg. Focus Score", value: "78%", icon: TrendingUp, color: "text-accent-foreground" },
    { title: "At Risk", value: "3 Students", icon: AlertCircle, color: "text-destructive" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Overview</h1>
        <p className="text-muted-foreground">Monitor class activity and student performance in real-time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} fill-current`} />
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
        <Card className="md:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>View all enrolled students and their basic info.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-8 h-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {studentsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : students && students.length > 0 ? (
                students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between group border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${student.id}/40/40`} />
                        <AvatarFallback>{student.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{student.firstName} {student.lastName}</span>
                        <span className="text-xs text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Active
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">No students found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Recent Shared Resources</CardTitle>
            <CardDescription>Latest materials uploaded by teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materialsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : materials && materials.length > 0 ? (
                materials.slice(0, 5).map((material) => (
                  <div key={material.id} className="flex flex-col border-b pb-2 last:border-0">
                    <span className="font-bold text-sm">{material.title}</span>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{material.type}</span>
                      <span>{material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No materials shared yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
