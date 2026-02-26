
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Book, Clock, Trophy, Loader2, Settings2, Target, Calendar, ChevronRight, Lightbulb, TrendingUp, Info, GraduationCap, Zap } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
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
    d.setDate(d.getDate() - d.getDay());
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
  const todayTimeFormatted = `${Math.floor(totalMinutesToday / 60)}h ${totalMinutesToday % 60}m`;
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
    { title: t('focusScore'), value: profile?.focusScore || 0, icon: Zap, color: "text-accent-foreground" },
    { title: t('totalSessions'), value: todaySessions?.length || 0, icon: Trophy, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('dashboard')}</h1>
          <p className="text-muted-foreground text-sm">{t('welcomeMessage').replace('{name}', profile?.firstName || t('scholar'))}</p>
        </div>
        <div className="hidden md:block">
          <Badge variant="outline" className="px-3 py-1.5 rounded-full bg-accent border-accent text-accent-foreground flex items-center gap-2 font-bold shadow-sm text-xs">
            <GraduationCap className="h-3.5 w-3.5" />
            {t('level')} {profile?.level || 1} {t('scholar')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={cn("h-3.5 w-3.5 fill-current", stat.color)} />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-xl font-bold">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg">{t('dailyGoal')}</CardTitle>
                <CardDescription className="text-xs">{t('dailyGoalDesc')}</CardDescription>
              </div>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('dailyGoal')}</DialogTitle>
                  </DialogHeader>
                  <div className="py-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-bold">Target Hours</Label>
                      <Badge variant="secondary" className="text-lg px-4 py-1">{currentGoalHours}h</Badge>
                    </div>
                    <Input 
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
            <CardContent className="space-y-4 pb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-accent-foreground">{progressPercent}% {t('completed')}</span>
                  <span className="text-muted-foreground">{todayTimeFormatted} / {currentGoalHours}h</span>
                </div>
                <Progress value={progressPercent} className="h-2.5 bg-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-accent" />
                {t('weeklyTrends')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] w-full pt-2 pb-6">
              {weeklyLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="current" stroke="var(--color-current)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-current)" }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "var(--color-previous)" }} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-sm bg-card h-full">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">{t('todaysSessions')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-3">
                {sessionsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : todaySessions && todaySessions.length > 0 ? (
                  todaySessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{session.type}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.actualDurationMinutes || 0} {t('minutes')}
                        </span>
                      </div>
                      <Badge variant={session.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[9px] px-1.5 py-0 h-4 font-bold">
                        {session.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-muted/10 rounded-2xl border-2 border-dashed">
                    <p className="text-xs text-muted-foreground">{t('noSessionsToday')}</p>
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
