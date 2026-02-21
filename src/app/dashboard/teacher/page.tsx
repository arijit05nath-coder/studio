
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, AlertCircle, TrendingUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TeacherDashboard() {
  const stats = [
    { title: "Active Students", value: "84", icon: Users, color: "text-blue-500" },
    { title: "Resources", value: "24 Shared", icon: BookOpen, color: "text-purple-500" },
    { title: "Avg. Focus Score", value: "78%", icon: TrendingUp, color: "text-accent-foreground" },
    { title: "At Risk", value: "3 Students", icon: AlertCircle, color: "text-destructive" },
  ]

  const students = [
    { name: "Alice Smith", focus: 95, progress: 88, status: "Excellent" },
    { name: "Bob Jones", focus: 45, progress: 32, status: "At Risk" },
    { name: "Charlie Day", focus: 72, progress: 65, status: "Improving" },
    { name: "Diana Prince", focus: 88, progress: 92, status: "Excellent" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Overview</h1>
        <p className="text-muted-foreground">Monitor class activity and student performance.</p>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Track individual student engagement metrics.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-8 h-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {students.map((student) => (
                <div key={student.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 w-40">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://picsum.photos/seed/${student.name}/32/32`} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{student.name}</span>
                  </div>
                  <div className="flex-1 px-8 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Focus Score</span>
                      <span>{student.focus}%</span>
                    </div>
                    <Progress value={student.focus} className="h-1.5" />
                  </div>
                  <Badge variant={student.status === 'Excellent' ? 'secondary' : student.status === 'At Risk' ? 'destructive' : 'outline'} className="w-24 justify-center">
                    {student.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Class Activity</CardTitle>
            <CardDescription>Recent group sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Math Group A", action: "Active focus session", time: "Now" },
                { title: "Physics Lab", action: "2 new uploads", time: "10m ago" },
                { title: "General Discussion", action: "15 new messages", time: "1h ago" },
              ].map((activity, i) => (
                <div key={i} className="flex flex-col border-b pb-2 last:border-0">
                  <span className="font-bold text-sm">{activity.title}</span>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{activity.action}</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
