"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Book, Clock, Trophy, Loader2, Settings2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export default function StudentDashboard() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)

  // Get User Profile for the focus goal
  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Get today's start for filtering sessions
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  // Fetch today's focus sessions to calculate progress
  const todaySessionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      where("startTime", ">=", todayStart)
    );
  }, [user, db, todayStart]);

  const { data: todaySessions, isLoading: sessionsLoading } = useCollection(todaySessionsQuery);

  // Fetch all subjects for the count
  const subjectsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "subjects");
  }, [db]);
  const { data: subjects, isLoading: subjectsLoading } = useCollection(subjectsQuery);

  // Calculate today's total focus minutes
  const totalMinutesToday = useMemo(() => {
    if (!todaySessions) return 0;
    return todaySessions
      .filter(s => s.status === 'Completed')
      .reduce((acc, s) => acc + (s.actualDurationMinutes || 0), 0);
  }, [todaySessions]);

  const currentGoalHours = profile?.focusGoal || 4;
  const totalHoursToday = (totalMinutesToday / 60).toFixed(1);
  const progressPercent = Math.min(Math.round((parseFloat(totalHoursToday) / currentGoalHours) * 100), 100);

  const handleUpdateGoal = (newGoal: number) => {
    if (!user || !db) return;
    updateDocumentNonBlocking(doc(db, "userProfiles", user.uid), {
      focusGoal: newGoal
    });
  }

  const stats = [
    { title: "Today's Focus", value: `${totalHoursToday}h`, icon: Clock, color: "text-blue-500" },
    { title: "Courses", value: subjects?.length || 0, icon: Book, color: "text-purple-500" },
    { title: "Focus Score", value: profile?.focusScore || "N/A", icon: Sparkles, color: "text-accent-foreground" },
    { title: "Total Sessions", value: todaySessions?.length || 0, icon: Trophy, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.firstName || 'Student'}! Here's your real-time study overview.</p>
        </div>
        <div className="hidden md:block">
           <Badge variant="outline" className="px-4 py-2 rounded-full bg-white">
              Level {profile?.level || 1} Scholar
           </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4 fill-current", stat.color)} />
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
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Focus Goal</CardTitle>
              <CardDescription>Track your progress against your daily target.</CardDescription>
            </div>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Set Daily Goal</DialogTitle>
                  <DialogDescription>
                    How many hours do you want to focus today?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold">Target Hours</Label>
                    <Badge variant="secondary" className="text-lg px-4 py-1">{currentGoalHours}h</Badge>
                  </div>
                  <Slider 
                    value={[currentGoalHours]}
                    min={1}
                    max={12}
                    step={0.5}
                    onValueChange={([val]) => handleUpdateGoal(val)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsGoalDialogOpen(false)} className="bg-accent text-accent-foreground">
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-accent-foreground">{progressPercent}% of daily goal</span>
                <span className="text-muted-foreground">{totalHoursToday} / {currentGoalHours} hrs</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-primary/20" />
            </div>
            
            <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-3">
              <div className="bg-accent/20 p-2 rounded-xl">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {progressPercent >= 100 
                  ? "Amazing! You've reached your goal for today. Keep it up!" 
                  : `You're ${Math.max(0, currentGoalHours - parseFloat(totalHoursToday)).toFixed(1)} hours away from your daily goal. You've got this!`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
            <CardDescription>Your focus activity for the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : todaySessions && todaySessions.length > 0 ? (
                todaySessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{session.type}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.actualDurationMinutes || 0} mins
                      </span>
                    </div>
                    <Badge 
                      variant={session.status === 'Completed' ? 'secondary' : 'destructive'} 
                      className={cn(
                        "text-[10px] px-2 py-0",
                        session.status === 'Completed' ? "bg-accent/20 text-accent-foreground" : ""
                      )}
                    >
                      {session.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-4 bg-muted/10 rounded-2xl border-2 border-dashed">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No sessions recorded today.</p>
                  <Button variant="link" className="text-accent mt-1 text-xs" onClick={() => router.push('/dashboard/focus')}>
                    Start a focus session
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}