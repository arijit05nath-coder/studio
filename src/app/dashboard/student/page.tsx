
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Book, Clock, Trophy, Loader2, Settings2, Target, Calendar, ChevronRight, Lightbulb, TrendingUp, Info, GraduationCap } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const chartConfig = {
  current: {
    label: "This Week",
    color: "hsl(var(--accent))",
  },
  previous: {
    label: "Last Week",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

export default function StudentDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const startOfPreviousWeek = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Find current Sunday
    d.setDate(d.getDate() - d.getDay());
    // Go back 7 more days to start of previous week
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  const todaySessionsQuery = useMemoFirebase(() => {
    if (!user || !db || isUserLoading) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      where("startTime", ">=", todayStart)
    );
  }, [user, db, todayStart, isUserLoading]);

  const { data: todaySessions, isLoading: sessionsLoading } = useCollection(todaySessionsQuery);

  const weeklySessionsQuery = useMemoFirebase(() => {
    if (!user || !db || isUserLoading) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      where("startTime", ">=", startOfPreviousWeek),
      where("status", "==", "Completed")
    );
  }, [user, db, startOfPreviousWeek, isUserLoading]);

  const { data: weeklySessions, isLoading: weeklyLoading } = useCollection(weeklySessionsQuery);

  const subjectsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return collection(db, "subjects");
  }, [db, user, isUserLoading]);
  const { data: subjects, isLoading: subjectsLoading } = useCollection(subjectsQuery);

  const plansQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(
      collection(db, "userProfiles", user.uid, "studyPlans"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, user, isUserLoading]);
  const { data: savedPlans, isLoading: plansLoading } = useCollection(plansQuery);

  const totalMinutesToday = useMemo(() => {
    if (!todaySessions) return 0;
    return todaySessions
      .filter(s => s.status === 'Completed')
      .reduce((acc, s) => acc + (s.actualDurationMinutes || 0), 0);
  }, [todaySessions]);

  const chartData = useMemo(() => {
    if (!weeklySessions) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setHours(0, 0, 0, 0);
    startOfThisWeek.setDate(now.getDate() - now.getDay());

    const stats = days.map((day, index) => ({
      day,
      current: 0,
      previous: 0,
    }));

    weeklySessions.forEach(s => {
      const sDate = new Date(s.startTime);
      const dayIndex = sDate.getDay();
      const mins = s.actualDurationMinutes || 0;
      
      if (sDate >= startOfThisWeek) {
        stats[dayIndex].current += mins;
      } else {
        stats[dayIndex].previous += mins;
      }
    });

    return stats;
  }, [weeklySessions]);

  const currentGoalHours = profile?.focusGoal || 4;
  const todayTimeFormatted = `${Math.floor(totalMinutesToday / 60)}h ${totalMinutesToday % 60}min`;
  const progressPercent = Math.min(Math.round(((totalMinutesToday / 60) / currentGoalHours) * 100), 100);

  const handleUpdateGoal = (newGoal: number) => {
    if (!user || !db) return;
    updateDocumentNonBlocking(doc(db, "userProfiles", user.uid), {
      focusGoal: newGoal
    });
  }

  const stats = [
    { title: "Today's Focus", value: todayTimeFormatted, icon: Clock, color: "text-blue-500" },
    { title: "Courses", value: subjects?.length || 0, icon: Book, color: "text-purple-500" },
    { title: "Focus Score", value: profile?.focusScore || 0, icon: Sparkles, color: "text-accent-foreground" },
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="px-4 py-2 rounded-full bg-card cursor-help border-accent/30 text-accent-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Level {profile?.level || 1} Scholar
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] text-center p-4">
                <div className="space-y-2">
                  <p className="font-bold text-accent">How to Level Up:</p>
                  <ul className="text-xs text-left list-disc list-inside space-y-1">
                    <li>Complete focus sessions in Focus Mode.</li>
                    <li>Achieve 100% of your daily focus goal.</li>
                    <li>Maintain a daily study streak.</li>
                    <li>Every 10 hours of focused study grants level progress.</li>
                  </ul>
                  <p className="text-[10px] text-muted-foreground pt-2">Visit the Achievements tab for full details.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-card">
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
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-card">
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
                      <Label className="text-lg font-bold" htmlFor="goal-input">Target Hours</Label>
                      <Badge variant="secondary" className="text-lg px-4 py-1">{currentGoalHours}h</Badge>
                    </div>
                    <Input 
                      id="goal-input"
                      type="number"
                      value={currentGoalHours}
                      min={0.5}
                      max={24}
                      step={0.5}
                      onChange={(e) => handleUpdateGoal(parseFloat(e.target.value) || 0)}
                      className="rounded-xl text-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Enter the number of hours you aim to focus each day.
                    </p>
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
                  <span className="text-muted-foreground">{todayTimeFormatted} / {currentGoalHours}h</span>
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
                    : `You're ${Math.max(0, currentGoalHours - (totalMinutesToday / 60)).toFixed(1)} hours away from your daily goal. You've got this!`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Weekly Focus Trends
              </CardTitle>
              <CardDescription>Comparing focus time (mins) with last week.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              {weeklyLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12 }} 
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="var(--color-current)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-current)" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="previous"
                      stroke="var(--color-previous)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "var(--color-previous)" }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card">
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

          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-accent/5">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Your AI Roadmap
                </CardTitle>
              </div>
              <CardDescription>Your recently saved personalized study plans.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {plansLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : savedPlans && savedPlans.length > 0 ? (
                <div className="space-y-4">
                  {savedPlans.map((plan: any) => (
                    <div 
                      key={plan.id} 
                      className="group p-4 rounded-2xl border bg-muted/20 hover:bg-accent/5 hover:border-accent/30 transition-all cursor-pointer"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">
                            {plan.assessment?.subjects?.join(", ") || "General Study Plan"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Generated {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {plan.planContent?.priorityTopics?.slice(0, 3).map((topic: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px] bg-background border-none">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl">
                  <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-muted-foreground mb-4">You haven't saved any AI study plans yet.</p>
                  <Button className="bg-accent text-accent-foreground rounded-full" onClick={() => router.push('/dashboard/ai-coach')}>
                    Create Your First Roadmap
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Detail Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Study Roadmap
            </DialogTitle>
            <DialogDescription>
              Saved on {selectedPlan && new Date(selectedPlan.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-bold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                      <Target className="h-4 w-4" /> Priority Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.planContent?.priorityTopics?.map((t: string, i: number) => (
                        <Badge key={i} className="bg-destructive/10 text-destructive border-none px-3 py-1">{t}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-4 w-4" /> Weekly Plan
                    </h4>
                    <div className="bg-muted/30 p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border">
                      {selectedPlan.planContent?.weeklyPlan}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Strategy</h4>
                    <p className="text-sm leading-relaxed">{selectedPlan.planContent?.strategy}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Next Steps</h4>
                    <ul className="space-y-2">
                      {selectedPlan.planContent?.actionableSteps?.map((s: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2 bg-muted/20 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
