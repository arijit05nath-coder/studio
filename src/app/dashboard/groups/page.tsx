
"use client"

import { useState } from "react"
import { Users, Plus, MessageSquare, ArrowRight, Shield, TrendingUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  
  const groups = [
    { id: 1, name: "Math Enthusiasts", members: 12, sharedGoal: "Master Calculus", activeNow: 3, lastActivity: "2 mins ago" },
    { id: 2, name: "Physics Study Lab", members: 8, sharedGoal: "Prep for Finals", activeNow: 5, lastActivity: "Just now" },
    { id: 3, name: "Literature Review", members: 15, sharedGoal: "Book Analysis", activeNow: 0, lastActivity: "1 hour ago" },
  ]

  const chatMessages = [
    { id: 1, user: "Alice", text: "Has anyone finished chapter 5 notes?", time: "10:02 AM" },
    { id: 2, user: "Bob", text: "Working on it now! The derivative section is tricky.", time: "10:05 AM" },
    { id: 3, user: "Charlie", text: "I can help with that, I just finished my focus session.", time: "10:10 AM" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Study</h1>
          <p className="text-muted-foreground">Collaborate and stay focused with your peers.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Your Groups
          </h2>
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className={cn(
                "border-none shadow-sm cursor-pointer transition-all hover:translate-x-1",
                selectedGroup === group.id ? "ring-2 ring-accent bg-white" : "bg-white"
              )}
              onClick={() => setSelectedGroup(group.id)}
            >
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <Badge variant={group.activeNow > 0 ? "secondary" : "outline"} className="text-[10px]">
                    {group.activeNow} Active
                  </Badge>
                </div>
                <CardDescription className="text-xs">{group.members} members • {group.lastActivity}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedGroup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{groups.find(g => g.id === selectedGroup)?.name}</CardTitle>
                    <CardDescription>Goal: {groups.find(g => g.id === selectedGroup)?.sharedGoal}</CardDescription>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="border-2 border-white w-8 h-8">
                        <AvatarImage src={`https://picsum.photos/seed/${i + 10}/32/32`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] border-2 border-white">+8</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        Group Progress
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">68%</div>
                        <Progress value={68} className="h-2 bg-white" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Shield className="h-4 w-4 text-accent" />
                        Weekly Leader
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6"><AvatarImage src="https://picsum.photos/seed/leader/32/32" /></Avatar>
                        <span className="text-sm font-medium">Alice (24h Focus)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col h-[400px]">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-accent" />
                    Group Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold">{msg.user}</span>
                            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                          </div>
                          <p className="text-sm bg-muted/30 p-2 rounded-lg mt-1 inline-block max-w-[80%]">
                            {msg.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-muted/10 flex gap-2">
                    <Input placeholder="Type a message..." className="bg-white border-none shadow-inner" />
                    <Button size="icon" className="bg-accent text-accent-foreground"><Send className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-muted">
              <Users className="h-16 w-16 text-muted mb-4" />
              <h3 className="text-xl font-bold">Select a group to start collaborating</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Join a study group to share materials, track progress together, and stay motivated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
