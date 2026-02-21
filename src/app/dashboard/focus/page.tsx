"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, ShieldCheck, ShieldAlert, Loader2, Timer, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function FocusPage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro')
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25)
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5)
  
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isStrict, setIsStrict] = useState(false)
  const [interruptionCount, setInterruptionCount] = useState(0)
  
  const startTimeRef = useRef<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time session history
  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      orderBy("startTime", "desc"),
      limit(10)
    );
  }, [user, db]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);

  // Update timer when mode or custom settings change (only if timer is not active)
  useEffect(() => {
    if (!isActive) {
      const mins = timerMode === 'pomodoro' 
        ? (sessionType === 'work' ? 25 : 5) 
        : (sessionType === 'work' ? customWorkMinutes : customBreakMinutes);
      setTimeLeft(mins * 60);
    }
  }, [timerMode, customWorkMinutes, customBreakMinutes, sessionType, isActive]);

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
      : (sessionType === 'work' ? customWorkMinutes : customBreakMinutes);

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
    if (sessionType === 'work') {
      setSessionType('break')
    } else {
      setSessionType('work')
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
    const mins = timerMode === 'pomodoro'
      ? (sessionType === 'work' ? 25 : 5)
      : (sessionType === 'work' ? customWorkMinutes : customBreakMinutes);
    setTimeLeft(mins * 60)
    startTimeRef.current = null;
  }

  const totalSeconds = timerMode === 'pomodoro'
    ? (sessionType === 'work' ? 25 : 5) * 60
    : (sessionType === 'work' ? customWorkMinutes : customBreakMinutes) * 60;
    
  const progress = (timeLeft / totalSeconds) * 100

  return (
    <div className="space-y-8 relative">
      {/* Strict Mode Overlay */}
      {isStrict && isActive && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <ShieldAlert className="h-16 w-16 text-destructive mb-6 animate-pulse fill-destructive/20" />
          <h2 className="text-4xl font-bold mb-4">Strict Focus Mode Active</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-md">
            Stay focused on your task. Navigating away will be logged as an interruption.
          </p>
          <div className="text-8xl font-mono font-bold text-accent-foreground mb-12 tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full px-12"
            onClick={() => {
                const confirmed = confirm("End session early? This will be logged as an interruption.")
                if (confirmed) {
                    setInterruptionCount(prev => prev + 1);
                    saveSession('Interrupted');
                    setIsActive(false);
                    setIsStrict(false);
                }
            }}
          >
            End Session
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
        <p className="text-muted-foreground">Boost your productivity with custom timers and strict tracking.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className={cn(
              "text-center pb-8 transition-colors",
              sessionType === 'work' ? "bg-primary/20" : "bg-accent/20"
            )}>
              <div className="flex justify-center mb-4">
                <Tabs value={timerMode} onValueChange={(v) => setTimerMode(v as any)} className="w-auto">
                  <TabsList className="grid w-48 grid-cols-2 rounded-full h-8 p-1">
                    <TabsTrigger value="pomodoro" className="rounded-full text-xs" disabled={isActive}>Pomodoro</TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-full text-xs" disabled={isActive}>Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
                {sessionType === 'work' ? "Focus Session" : "Short Break"}
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
              <p className="text-xs text-muted-foreground">{Math.round(100-progress)}% complete</p>
            </CardContent>
          </Card>

          {timerMode === 'custom' && (
            <Card className="border-none shadow-sm bg-white animate-in slide-in-from-top-4 duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-accent" />
                  Timer Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Focus Duration</span>
                    <span>{customWorkMinutes} mins</span>
                  </div>
                  <Slider 
                    value={[customWorkMinutes]} 
                    min={1} 
                    max={120} 
                    step={1} 
                    onValueChange={([val]) => setCustomWorkMinutes(val)}
                    disabled={isActive}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Break Duration</span>
                    <span>{customBreakMinutes} mins</span>
                  </div>
                  <Slider 
                    value={[customBreakMinutes]} 
                    min={1} 
                    max={60} 
                    step={1} 
                    onValueChange={([val]) => setCustomBreakMinutes(val)}
                    disabled={isActive}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent fill-accent/20" />
                Strict Mode
              </CardTitle>
              <CardDescription>
                Locks the UI during sessions to prevent distractions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="strict-mode" 
                  checked={isStrict} 
                  onCheckedChange={setIsStrict} 
                />
                <Label htmlFor="strict-mode">Enable Strict Focus</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Session History</CardTitle>
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
                        <p className="font-medium">{log.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.actualDurationMinutes}m
                        </p>
                      </div>
                      <Badge variant={log.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {log.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No recent sessions found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
