
"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, ShieldCheck, ShieldAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isStrict, setIsStrict] = useState(false)
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && timeLeft > 0) {
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

  const handleSessionComplete = () => {
    if (sessionType === 'work') {
      alert("Great job! Time for a break.")
      setSessionType('break')
      setTimeLeft(5 * 60)
    } else {
      alert("Break's over! Let's focus.")
      setSessionType('work')
      setTimeLeft(25 * 60)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(sessionType === 'work' ? 25 * 60 : 5 * 60)
  }

  const progress = (timeLeft / (sessionType === 'work' ? 25 * 60 : 5 * 60)) * 100

  return (
    <div className="space-y-8 relative">
      {/* Strict Mode Overlay */}
      {isStrict && isActive && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <ShieldAlert className="h-16 w-16 text-destructive mb-6 animate-pulse fill-destructive/20" />
          <h2 className="text-4xl font-bold mb-4">Strict Focus Mode Active</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-md">
            All other navigation is locked. Stay focused on your task until the timer finishes.
          </p>
          <div className="text-8xl font-mono font-bold text-accent-foreground mb-12 tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full px-12"
            onClick={() => {
                const confirmed = confirm("Are you sure you want to end your focus session early? This will be logged as an interruption.")
                if (confirmed) {
                    setIsActive(false)
                    setIsStrict(false)
                }
            }}
          >
            End Session
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
        <p className="text-muted-foreground">Boost your productivity with timed focus sessions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className={cn(
            "text-center pb-8",
            sessionType === 'work' ? "bg-primary/20" : "bg-accent/20"
          )}>
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

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent fill-accent/20" />
                Strict Mode
              </CardTitle>
              <CardDescription>
                Locks the UI to prevent distractions. Interruption logs will be generated if closed early.
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
                {[
                  { time: "10:30 AM", duration: "25m", label: "Math focus", status: "Completed" },
                  { time: "09:15 AM", duration: "15m", label: "Biology prep", status: "Interrupted" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{log.label}</p>
                      <p className="text-xs text-muted-foreground">{log.time} • {log.duration}</p>
                    </div>
                    <Badge variant={log.status === 'Completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
