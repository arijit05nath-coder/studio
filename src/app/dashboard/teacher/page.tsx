
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Search, Loader2, Book } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useState } from "react"
import { useI18n } from "@/lib/i18n-store"

export default function TeacherDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  const { t } = useI18n()
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
      title: t('activeStudents'), 
      value: studentsLoading ? "..." : (students?.length || 0).toString(), 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: t('sharedResources'), 
      value: materialsLoading ? "..." : (materials?.length || 0).toString(), 
      icon: BookOpen, 
      color: "text-indigo-600" 
    },
    { 
      title: t('totalCourses'), 
      value: subjectsLoading ? "..." : (subjects?.length || 0).toString(), 
      icon: Book, 
      color: "text-emerald-600" 
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('appName')}</h1>
        <p className="text-muted-foreground">{t('welcomeBack')}! Monitor class activity in real-time.</p>
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

      <div className="grid gap-6">
        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('studentRoster')}</CardTitle>
                <CardDescription>{t('enrolledStudents')}</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('searchStudents')} 
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
      </div>
    </div>
  )
}
