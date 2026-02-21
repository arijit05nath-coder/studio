
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Book, Clock, Trophy } from "lucide-react"

export default function StudentDashboard() {
  const stats = [
    { title: "Study Time", value: "12h 45m", icon: Clock, color: "text-blue-500" },
    { title: "Courses", value: "4 Active", icon: Book, color: "text-purple-500" },
    { title: "Focus Score", value: "92%", icon: Sparkles, color: "text-accent-foreground" },
    { title: "Achievements", value: "12", icon: Trophy, color: "text-yellow-500" },
  ]

  const upcomingTasks = [
    { topic: "Calculus", type: "Quiz", due: "Tomorrow", priority: "High" },
    { topic: "Physics", type: "Reading", due: "Friday", priority: "Medium" },
    { topic: "Literature", type: "Draft", due: "In 3 days", priority: "Low" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your study overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} fill-current`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Daily Focus Goal</CardTitle>
            <CardDescription>You're at 75% of your 4-hour daily goal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={75} className="h-3 bg-primary" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>3 hours completed</span>
              <span>1 hour left</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Priority tasks for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.topic} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium">{task.topic}</span>
                    <span className="text-xs text-muted-foreground">{task.type} • {task.due}</span>
                  </div>
                  <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
