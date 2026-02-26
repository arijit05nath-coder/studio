
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Play, Pause, RotateCcw, ShieldCheck, ShieldAlert, Loader2, Timer, Settings2, Hash, Clock, ChevronRight, ListOrdered } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  
  const [selectedBlock, setSelectedBlock] = useState<any[] | null>(null)
  
  const startTimeRef = useRef<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "userProfiles", user.uid, "focusSessions"),
      orderBy("startTime", "desc"),
      limit(50)
    );
  }, [user, db]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery);

  const totalWorkMinutes = (customWorkHours * 60) + customWorkMinutes;

  // Grouping logic for history
  const groupedBlocks = useMemo(() => {
    if (!sessions) return [];
    
    const blocks: any[][] = [];
    sessions.forEach((session) => {
      if (blocks.length === 0) {
        blocks.push([session]);
        return;
      }
      
      const lastBlock = blocks[blocks.length - 1];
      const lastSession = lastBlock[0]; // blocks are sorted desc, so [0] is most recent in block
      const lastStart = new Date(lastSession.startTime).getTime();
      const currentEnd = new Date(session.endTime).getTime();
      const diffMinutes = (lastStart - currentEnd) / 60000;

      // If gap is less than 15 minutes, group them
      if (diffMinutes < 15) {
        lastBlock.push(session);
      } else {
        blocks.push([session]);
      }
    });
    return blocks;
  }, [sessions]);

  useEffect(() => {
    if (!isActive) {
      const mins = timerMode === 'pomodoro' 
        ? (sessionType === 'work' ? 25 : 5) 
        : (sessionType === 'work' ? totalWorkMinutes : customBreakMinutes);
      setTimeLeft(mins * 60);
    }
  }, [timerMode, totalWorkMinutes, customBreakMinutes, sessionType]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      if (!startTimeRef.current) startTimeRef.current = new Date();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current)
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
      actualDurationMinutes: Math.max(0, actualDuration),
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
        setSessionType('break');
        setTimeLeft(5 * 60);
        setIsActive(true); 
      } else {
        setSessionType('work');
        setIsActive(false);
      }
    } else {
      if (sessionType === 'work') {
        setSessionType('break');
        setTimeLeft(customBreakMinutes * 60);
        setIsActive(true);
      } else {
        if (currentSet < customSets) {
          setCurrentSet(prev => prev + 1);
          setSessionType('work');
          setTimeLeft(totalWorkMinutes * 60);
          setIsActive(true);
        } else {
          resetTimer();
        }
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.max(0, seconds) % 60
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
    startTimeRef.current = null;
    const mins = timerMode === 'pomodoro' ? 25 : totalWorkMinutes;
    setTimeLeft(mins * 60);
  }

  const totalSecondsForMode = timerMode === 'pomodoro'
    ? (sessionType === 'work' ? 25 : 5) * 60
    : (sessionType === 'work' ? totalWorkMinutes : customBreakMinutes) * 60;
    
  const progress = (timeLeft / totalSecondsForMode) * 100

  return (
    <div className="space-y-8 relative">
      {isStrict && isActive && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          {sessionType === 'work' ? (
            <>
              <ShieldAlert className="h-16 w-16 text-destructive mb-6 animate-pulse fill-destructive/20" />
              <h2 className="text-4xl font-bold mb-4">{t('strictFocusActive')}</h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-md">
                {t('stayFocused')}
              </p>
            </>
          ) : (
            <>
              <Clock className="h-16 w-16 text-accent mb-6 animate-bounce fill-accent/20" />
              <h2 className="text-4xl font-bold mb-4">{t('breakTime')}</h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-md">
                Take a deep breath. You've earned it!
              </p>
            </>
          )}
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
                <Tabs value={timerMode} onValueChange={(v) => { if(!isActive) setTimerMode(v as any); }} className="w-auto">
                  <TabsList className="grid w-48 grid-cols-2 rounded-full h-8 p-1">
                    <TabsTrigger value="pomodoro" className="rounded-full text-xs" disabled={isActive}>{t('pomodoro')}</TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-full text-xs" disabled={isActive}>{t('custom')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-center gap-2">
                {sessionType === 'work' ? t('todaysFocus') : t('breakTime')}
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {sessionsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  ) : groupedBlocks && groupedBlocks.length > 0 ? (
                    groupedBlocks.map((block, idx) => {
                      const totalMins = block.reduce((acc, s) => acc + (s.actualDurationMinutes || 0), 0);
                      const latest = block[0];
                      const status = block.every(s => s.status === 'Completed') ? 'Completed' : 'Mixed';
                      
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => setSelectedBlock(block)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                              <ListOrdered className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{t('studyBlock')}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                {new Date(latest.startTime).toLocaleDateString()} • {block.length} {t('segments')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold">{totalMins}m</p>
                              <Badge variant={status === 'Completed' ? 'secondary' : 'outline'} className="text-[8px] h-4 py-0">
                                {status === 'Completed' ? t('statusCompleted') : status}
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">{t('noSessionsFound')}</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedBlock} onOpenChange={(o) => !o && setSelectedBlock(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              {t('sessionDetails')}
            </DialogTitle>
            <DialogDescription>
              {t('studyBlock')}: {selectedBlock && new Date(selectedBlock[0].startTime).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/5 p-4 rounded-2xl border">
                <p className="text-xs text-muted-foreground uppercase font-bold">{t('totalTime')}</p>
                <p className="text-2xl font-bold">{selectedBlock?.reduce((acc, s) => acc + (s.actualDurationMinutes || 0), 0)}m</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-2xl border">
                <p className="text-xs text-muted-foreground uppercase font-bold">{t('segments')}</p>
                <p className="text-2xl font-bold">{selectedBlock?.length}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">{t('segments')}</Label>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {selectedBlock?.map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                      <div>
                        <p className="text-sm font-bold">{session.type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.actualDurationMinutes}m
                        </p>
                      </div>
                      <Badge variant={session.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[9px]">
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <Button onClick={() => setSelectedBlock(null)} className="w-full rounded-xl bg-accent text-accent-foreground">
            {t('close')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
