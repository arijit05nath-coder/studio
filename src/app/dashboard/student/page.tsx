"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Book, Clock, Trophy, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"

export default function StudentDashboard() {
  const { user } = useUser()
  const db = useFirestore()

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      limit(5)
    );
  }, [user, db]);

  const subjectsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "subjects");
  }, [db]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);
  const { data: subjects, isLoading: subjectsLoading } = useCollection(subjectsQuery);

  const stats = [
    { title: "Study Sessions", value: sessions?.length || 0, icon: Clock, color: "text-blue-500" },
    { title: "Courses", value: subjects?.length || 0, icon: Book, color: "text-purple-500" },
    { title: "Focus Score", value: "---", icon: Sparkles, color: "text-accent-foreground" },
    { title: "Achievements", value: "0", icon: Trophy, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your real-time study overview.</p>
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
                {subjectsLoading && stat.title === "Courses" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Daily Focus Goal</CardTitle>
            <CardDescription>Setup your focus goal to start tracking progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={0} className="h-3 bg-primary" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0 hours completed</span>
              <span>Goal: 4 hours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest focus sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : sessions && sessions.length > 0 ? (
                sessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex flex-col">
                      <span className="font-medium">{session.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {session.plannedDurationMinutes} mins • {session.status}
                      </span>
                    </div>
                    <Badge variant={session.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {session.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  No sessions recorded yet. Start focusing!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
