
"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, ShieldCheck, ShieldAlert, Loader2, Timer, Settings2, Hash, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useI18n } from "@/lib/i18n-store"

export default function FocusPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { t } = useI18n()
  
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro')
  const [customWorkHours, setCustomWorkHours] = useState(0)
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25)
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5)
  const [customSets, setCustomSets] = useState(1)
  
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work')
  const [currentSet, setCurrentSet] = useState(1)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isStrict, setIsStrict] = useState(false)
  const [interruptionCount, setInterruptionCount] = useState(0)
  
  const startTimeRef = useRef<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      orderBy("startTime", "desc"),
      limit(10)
    );
  }, [user, db]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);

  const totalWorkMinutes = (customWorkHours * 60) + customWorkMinutes;

  useEffect(() => {
    if (!isActive) {
      const mins = timerMode === 'pomodoro' 
        ? (sessionType === 'work' ? 25 : 5) 
        : (sessionType === 'work' ? totalWorkMinutes : customBreakMinutes);
      setTimeLeft(mins * 60);
    }
  }, [timerMode, customWorkHours, customWorkMinutes, customBreakMinutes, sessionType, isActive, totalWorkMinutes]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      if (!startTimeRef.current) startTimeRef.current = new Date();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      handleSessionComplete()
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, timeLeft])

  const saveSession = (status: 'Completed' | 'Interrupted' | 'Abandoned') => {
    if (!user || !db || !startTimeRef.current) return;

    const actualDuration = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
    const plannedDuration = timerMode === 'pomodoro'
      ? (sessionType === 'work' ? 25 : 5)
      : (sessionType === 'work' ? totalWorkMinutes : customBreakMinutes);

    addDocumentNonBlocking(collection(db, "userProfiles", user.uid, "focusSessions"), {
      studentId: user.uid,
      type: timerMode === 'pomodoro' ? (sessionType === 'work' ? 'Pomodoro' : 'Break') : (sessionType === 'work' ? 'Custom Focus' : 'Custom Break'),
      plannedDurationMinutes: plannedDuration,
      actualDurationMinutes: actualDuration,
      startTime: startTimeRef.current.toISOString(),
      endTime: new Date().toISOString(),
      status,
      interruptionCount,
      strictModeUsed: isStrict,
      dateCreated: serverTimestamp()
    });

    startTimeRef.current = null;
    setInterruptionCount(0);
  }

  const handleSessionComplete = () => {
    saveSession('Completed');
    
    if (timerMode === 'pomodoro') {
      if (sessionType === 'work') {
        setSessionType('break')
      } else {
        setSessionType('work')
      }
    } else {
      // Custom mode with sets
      if (sessionType === 'work') {
        setSessionType('break')
      } else {
        // Break finished, increment set
        if (currentSet < customSets) {
          setCurrentSet(prev => prev + 1);
          setSessionType('work');
          setIsActive(true); // Automatically start next work session if sets remain
        } else {
          // All sets finished
          resetTimer();
        }
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsActive(!isActive)
  
  const resetTimer = () => {
    if (isActive) {
      saveSession('Abandoned');
    }
    setIsActive(false)
    setSessionType('work')
    setCurrentSet(1)
    const mins = timerMode === 'pomodoro'
      ? 25
      : totalWorkMinutes;
    setTimeLeft(mins * 60)
    startTimeRef.current = null;
  }

  const totalSeconds = timerMode === 'pomodoro'
    ? (sessionType === 'work' ? 25 : 5) * 60
    : (sessionType === 'work' ? totalWorkMinutes : customBreakMinutes) * 60;
    
  const progress = (timeLeft / totalSeconds) * 100

  return (
    <div className="space-y-8 relative">
      {isStrict && isActive && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <ShieldAlert className="h-16 w-16 text-destructive mb-6 animate-pulse fill-destructive/20" />
          <h2 className="text-4xl font-bold mb-4">{t('strictFocusActive')}</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-md">
            {t('stayFocused')}
          </p>
          <div className="text-8xl font-mono font-bold text-accent-foreground mb-12 tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full px-12"
            onClick={() => {
                const confirmed = confirm(t('confirmEndSession'))
                if (confirmed) {
                    setInterruptionCount(prev => prev + 1);
                    saveSession('Interrupted');
                    setIsActive(false);
                    setIsStrict(false);
                }
            }}
          >
            {t('endSessionEarly')}
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('focusMode')}</h1>
        <p className="text-muted-foreground">{t('focusModeDesc')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className={cn(
              "text-center pb-8 transition-colors",
              sessionType === 'work' ? "bg-primary/20" : "bg-accent/20"
            )}>
              <div className="flex justify-center mb-4">
                <Tabs value={timerMode} onValueChange={(v) => { setTimerMode(v as any); resetTimer(); }} className="w-auto">
                  <TabsList className="grid w-48 grid-cols-2 rounded-full h-8 p-1">
                    <TabsTrigger value="pomodoro" className="rounded-full text-xs" disabled={isActive}>{t('pomodoro')}</TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-full text-xs" disabled={isActive}>{t('custom')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-center gap-2">
                {sessionType === 'work' ? t('todaysFocus') : t('rewards')}
                {timerMode === 'custom' && customSets > 1 && (
                  <Badge variant="outline" className="ml-2 bg-background/50 border-accent/20">
                    {t('set')} {currentSet}/{customSets}
                  </Badge>
                )}
              </div>
              <div className="text-7xl font-mono font-bold text-accent-foreground">
                {formatTime(timeLeft)}
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-12 text-center">
              <div className="flex justify-center gap-4 mb-8">
                <Button 
                  onClick={toggleTimer} 
                  size="lg" 
                  className="rounded-full w-24 h-24 p-0 bg-accent text-accent-foreground hover:bg-accent/80"
                >
                  {isActive ? <Pause className="h-10 w-10 fill-current" /> : <Play className="h-10 w-10 fill-current ml-1" />}
                </Button>
                <Button 
                  onClick={resetTimer} 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full w-12 h-12 mt-6"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>
              <Progress value={100 - progress} className="h-2 bg-primary mb-2" />
              <p className="text-xs text-muted-foreground">{Math.round(100-progress)}% {t('completed')}</p>
            </CardContent>
          </Card>

          {timerMode === 'custom' && (
            <Card className="border-none shadow-sm animate-in slide-in-from-top-4 duration-300 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-accent" />
                  {t('timerSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Clock className="h-3 w-3 text-accent" /> {t('focusDuration')}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="work-hours" className="text-[10px] text-muted-foreground uppercase">{t('hours')}</Label>
                      <Input 
                        id="work-hours"
                        type="number"
                        value={customWorkHours} 
                        min={0} 
                        max={24} 
                        onChange={(e) => setCustomWorkHours(parseInt(e.target.value) || 0)}
                        disabled={isActive}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="work-mins" className="text-[10px] text-muted-foreground uppercase">{t('minutes')}</Label>
                      <Input 
                        id="work-mins"
                        type="number"
                        value={customWorkMinutes} 
                        min={0} 
                        max={59} 
                        onChange={(e) => setCustomWorkMinutes(parseInt(e.target.value) || 0)}
                        disabled={isActive}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="break-mins" className="text-xs font-medium">{t('breakDuration')} ({t('minutes')})</Label>
                  <Input 
                    id="break-mins"
                    type="number"
                    value={customBreakMinutes} 
                    min={1} 
                    max={60} 
                    onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 1)}
                    disabled={isActive}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sets" className="text-xs font-medium flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {t('numSets')}
                  </Label>
                  <Input 
                    id="sets"
                    type="number"
                    value={customSets} 
                    min={1} 
                    max={10} 
                    onChange={(e) => setCustomSets(parseInt(e.target.value) || 1)}
                    disabled={isActive}
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent fill-accent/20" />
                {t('strictMode')}
              </CardTitle>
              <CardDescription>
                {t('strictModeDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="strict-mode" 
                  checked={isStrict} 
                  onCheckedChange={setIsStrict} 
                />
                <Label htmlFor="strict-mode">{t('enableStrict')}</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>{t('sessionHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{log.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.actualDurationMinutes}m
                        </p>
                      </div>
                      <Badge variant={log.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {log.status === 'Completed' ? t('statusCompleted') : log.status === 'Interrupted' ? t('statusInterrupted') : t('statusAbandoned')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">{t('noSessionsFound')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
