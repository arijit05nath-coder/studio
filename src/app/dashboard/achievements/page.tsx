
"use client"

import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Trophy, Medal, Star, Target, Zap, Clock, TrendingUp, Sparkles, GraduationCap, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n-store"

export default function AchievementsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { t } = useI18n()

  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);
  const { data: profile } = useDoc(profileRef);

  const levels = [
    { level: 1, title: "Novice Scholar", range: "0 - 10 Hours", icon: Star, color: "text-slate-400" },
    { level: 2, title: "Focused Apprentice", range: "11 - 25 Hours", icon: Medal, color: "text-amber-600" },
    { level: 3, title: "Dedicated Academic", range: "26 - 50 Hours", icon: Trophy, color: "text-slate-300" },
    { level: 4, title: "Master Thinker", range: "51 - 100 Hours", icon: Trophy, color: "text-yellow-500" },
    { level: 5, title: "Elite Polymath", range: "100+ Hours", icon: Sparkles, color: "text-accent" },
  ]

  const currentLevel = profile?.level || 1;
  const levelData = levels.find(l => l.level === currentLevel) || levels[0];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {t('achievements')} & {t('scholarRank')}
          </h1>
          <p className="text-muted-foreground">Track your academic journey and scholar progression.</p>
        </div>
        <Badge variant="outline" className="px-6 py-3 rounded-full text-lg font-bold bg-accent/10 border-accent/30 text-accent-foreground gap-2">
          <GraduationCap className="h-5 w-5" />
          {t('level')} {currentLevel} {levelData.title}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-accent/5">
              <CardTitle>The {t('scholarRank')} System</CardTitle>
              <CardDescription>How to advance your academic rank on StudyNest.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4">
                {levels.map((l) => (
                  <div 
                    key={l.level} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      l.level === currentLevel ? "bg-accent/10 border-accent ring-1 ring-accent/20" : "bg-muted/20 border-transparent",
                      l.level < currentLevel ? "opacity-60" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl bg-card shadow-sm", l.color)}>
                        <l.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-muted-foreground">{t('level')} {l.level}</span>
                          {l.level === currentLevel && <Badge className="text-[10px] bg-accent text-accent-foreground">Current Rank</Badge>}
                          {l.level < currentLevel && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <h3 className="font-bold text-lg">{l.title}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-muted-foreground">{l.range}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 p-6 rounded-2xl border space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Earning Experience (EXP)
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Focus Hours</p>
                    <p className="text-xs text-muted-foreground">Every hour of completed focus time earns you significant progress toward your next level.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Goal Completion</p>
                    <p className="text-xs text-muted-foreground">Hitting 100% of your daily focus goal provides a massive level-up bonus.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Daily Streaks</p>
                    <p className="text-xs text-muted-foreground">Studying multiple days in a row multipliers your earned experience by 1.5x.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Group Milestones</p>
                    <p className="text-xs text-muted-foreground">Participating in study group discussions and topping the weekly leaderboard.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Current Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{t('level')} {currentLevel}</span>
                  <span>{t('level')} {currentLevel + 1}</span>
                </div>
                <Progress value={45} className="h-3 bg-primary/20" />
                <p className="text-xs text-center text-muted-foreground italic">Approx. 4.5 hours until next level</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-bold">{t('dailyMilestone')}</h4>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Today's Goal</span>
                  </div>
                  <span className="text-xs font-bold text-accent">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">2h Focus Streak</span>
                  </div>
                  <span className="text-xs font-bold text-accent">Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card bg-gradient-to-br from-accent/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                {t('rewards')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                As you level up, you'll unlock exclusive rewards:
              </p>
              <ul className="space-y-2">
                <li className="text-xs flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Exclusive Profile Themes
                </li>
                <li className="text-xs flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Custom Avatar Frames
                </li>
                <li className="text-xs flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Advanced AI Coach Features
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
