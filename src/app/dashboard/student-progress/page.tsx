
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"
import { 
  Users, 
  Search, 
  Loader2, 
  ChevronRight, 
  Clock, 
  Target, 
  TrendingUp,
  User as UserIcon,
  Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function StudentProgressPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Fetch all students - Only proceed if teacher is signed in
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "userProfiles"), where("role", "==", "Student"));
  }, [db, user, isUserLoading]);

  const { data: students, isLoading: studentsLoading } = useCollection(studentsQuery);

  // Fetch data for selected student
  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !selectedStudent || !user || isUserLoading) return null;
    return query(
      collection(db, "userProfiles", selectedStudent.id, "focusSessions"),
      orderBy("startTime", "desc"),
      limit(20)
    );
  }, [db, selectedStudent, user, isUserLoading]);

  const plansQuery = useMemoFirebase(() => {
    if (!db || !selectedStudent || !user || isUserLoading) return null;
    return query(
      collection(db, "userProfiles", selectedStudent.id, "studyPlans"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [db, selectedStudent, user, isUserLoading]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);
  const { data: plans, isLoading: plansLoading } = useCollection(plansQuery);

  const filteredStudents = students?.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const calculateTotalFocusTime = (sessions: any[]) => {
    return sessions?.reduce((acc, s) => acc + (s.actualDurationMinutes || 0), 0) || 0;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground">Track engagement and performance across your students.</p>
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-10 rounded-full bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studentsLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="border-none shadow-sm bg-white hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group" 
              onClick={() => setSelectedStudent(student)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={`https://picsum.photos/seed/${student.id}/48/48`} />
                    <AvatarFallback>{student.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold truncate">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No students found</h3>
            <p className="text-muted-foreground">Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-accent">
                <AvatarImage src={`https://picsum.photos/seed/${selectedStudent?.id}/60/60`} />
                <AvatarFallback>{selectedStudent?.firstName?.[0] || 'S'}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <DialogTitle className="text-2xl font-bold">{selectedStudent?.firstName} {selectedStudent?.lastName}</DialogTitle>
                <DialogDescription>{selectedStudent?.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30 border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Clock className="h-5 w-5 text-accent mb-2" />
                    <span className="text-2xl font-bold">{calculateTotalFocusTime(sessions || [])}m</span>
                    <span className="text-[10px] uppercase text-muted-foreground">Total Focus</span>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <TrendingUp className="h-5 w-5 text-primary mb-2" />
                    <span className="text-2xl font-bold">{sessions?.length || 0}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">Sessions</span>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-none col-span-2 md:col-span-1">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Target className="h-5 w-5 text-destructive mb-2" />
                    <span className="text-2xl font-bold">{plans?.length || 0}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">Active Plans</span>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Study Plan */}
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Latest AI Study Roadmap
                </h4>
                {plansLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : plans && plans.length > 0 ? (
                  <Card className="border border-accent/20 bg-accent/5">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Priority Focus</p>
                          <div className="flex flex-wrap gap-2">
                            {plans[0].planContent?.priorityTopics?.map((t: string, i: number) => (
                              <Badge key={i} variant="secondary" className="bg-white">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Strategy</p>
                          <p className="text-sm">{plans[0].planContent?.strategy}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No study plan generated yet.</p>
                )}
              </div>

              {/* Session History */}
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Focus Activity
                </h4>
                <div className="space-y-2">
                  {sessionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : sessions && sessions.length > 0 ? (
                    sessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                        <div>
                          <p className="text-sm font-semibold">{session.type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(session.startTime).toLocaleDateString()} • {session.actualDurationMinutes} mins
                          </p>
                        </div>
                        <Badge variant={session.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {session.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No sessions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setSelectedStudent(null)}>Close Profile</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
