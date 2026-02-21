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
import { useI18n } from "@/lib/i18n-store"

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
  const { t } = useI18n()
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
    { title: t('todayFocus'), value: todayTimeFormatted, icon: Clock, color: "text-blue-500" },
    { title: t('curriculum'), value: subjects?.length || 0, icon: Book, color: "text-purple-500" },
    { title: t('focusScore'), value: profile?.focusScore || 0, icon: Sparkles, color: "text-accent-foreground" },
    { title: t('totalSessions'), value: todaySessions?.length || 0, icon: Trophy, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{t('dashboard')}</h1>
          <p className="text-muted-foreground">{t('welcomeBack')}, {profile?.firstName || 'Student'}!</p>
        </div>
        <div className="hidden md:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="px-4 py-2 rounded-full bg-card cursor-help border-accent text-accent-foreground flex items-center gap-2 font-bold shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                  {t('level')} {profile?.level || 1} {t('scholar')}
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
                {stat.value}
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
                <CardTitle>{t('dailyGoal')}</CardTitle>
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
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsGoalDialogOpen(false)} className="bg-accent text-accent-foreground">
                      {t('save')}
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
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                {t('weeklyTrends')}
              </CardTitle>
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
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="current" stroke="var(--color-current)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-current)" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "var(--color-previous)" }} />
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
                      <Badge variant={session.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0">
                        {session.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 bg-muted/10 rounded-2xl border-2 border-dashed">
                    <p className="text-sm text-muted-foreground">No sessions recorded today.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
