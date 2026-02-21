
"use client"

import { useState, useRef, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { Users, Plus, MessageSquare, Shield, TrendingUp, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { collection, query, where, serverTimestamp, orderBy, getDoc, doc, or } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function GroupsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: "", description: "" })
  const [userRole, setUserRole] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkRole = async () => {
      if (user && db) {
        const snap = await getDoc(doc(db, "userProfiles", user.uid));
        if (snap.exists()) setUserRole(snap.data().role);
      }
    };
    checkRole();
  }, [user, db]);

  // Real-time groups the user is a member of or monitoring (if teacher)
  const groupsQuery = useMemoFirebase(() => {
    if (!user || !db || !userRole) return null;
    
    return query(
      collection(db, "studyGroups"),
      or(
        where("memberIds", "array-contains", user.uid),
        where("teacherId", "==", user.uid)
      )
    );
  }, [user, db, userRole]);

  const { data: groups, isLoading: groupsLoading } = useCollection(groupsQuery);
  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  // Real-time messages for the selected group
  const messagesQuery = useMemoFirebase(() => {
    if (!selectedGroupId || !db || !user || !userRole) return null;
    
    // With revised security rules, we don't need the complex filter on the subcollection query
    // Access is granted based on the parent group's membership
    return query(
      collection(db, "studyGroups", selectedGroupId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [selectedGroupId, db, user, userRole]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedGroupId || !user || !selectedGroup) return;

    addDocumentNonBlocking(collection(db, "studyGroups", selectedGroupId, "messages"), {
      senderId: user.uid,
      senderName: user.email?.split('@')[0] || "User",
      text: message.trim(),
      timestamp: serverTimestamp()
    });

    setMessage("");
  }

  const handleCreateGroup = () => {
    if (!user || !db || !newGroup.name) return;

    addDocumentNonBlocking(collection(db, "studyGroups"), {
      name: newGroup.name,
      description: newGroup.description || "No description provided.",
      memberIds: [user.uid],
      teacherId: userRole === 'Teacher' ? user.uid : null,
      dateCreated: new Date().toISOString(),
      timestamp: serverTimestamp()
    });

    setNewGroup({ name: "", description: "" });
    setIsCreateDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Collaborate with your peers in real-time.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>
                Invite others later to collaborate on your learning goals.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced Calculus Prep"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this group focusing on?"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateGroup} 
                disabled={!newGroup.name}
                className="bg-accent text-accent-foreground"
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Your Groups
          </h2>
          {groupsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : groups && groups.length > 0 ? (
            groups.map((group) => (
              <Card 
                key={group.id} 
                className={cn(
                  "border-none shadow-sm cursor-pointer transition-all hover:translate-x-1",
                  selectedGroupId === group.id ? "ring-2 ring-accent bg-white" : "bg-white"
                )}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {group.memberIds?.length || 0} Members
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Created {new Date(group.dateCreated).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center p-8">No groups joined yet.</p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedGroup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedGroup.name}</CardTitle>
                    <CardDescription>{selectedGroup.description}</CardDescription>
                  </div>
                  <div className="flex -space-x-2">
                    {selectedGroup.memberIds?.slice(0, 5).map((id: string) => (
                      <Avatar key={id} className="border-2 border-white w-8 h-8">
                        <AvatarImage src={`https://picsum.photos/seed/${id}/32/32`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    ))}
                    {(selectedGroup.memberIds?.length || 0) > 5 && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] border-2 border-white">
                        +{(selectedGroup.memberIds?.length || 0) - 5}
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col h-[500px]">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-accent" />
                    Chat {userRole === 'Teacher' && <Badge variant="secondary" className="ml-2">Monitoring Mode</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages && messages.length > 0 ? (
                        messages.map((msg, i) => (
                          <div 
                            key={msg.id} 
                            className={cn(
                              "flex flex-col gap-1 max-w-[80%]",
                              msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                            )}
                          >
                            <span className="text-[10px] text-muted-foreground px-1">{msg.senderName}</span>
                            <div className={cn(
                              "px-3 py-2 rounded-2xl text-sm",
                              msg.senderId === user?.uid 
                                ? "bg-accent text-accent-foreground rounded-tr-none" 
                                : "bg-muted rounded-tl-none"
                            )}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50 py-20">
                          <MessageSquare className="h-8 w-8" />
                          <p className="text-sm italic">Start the conversation!</p>
                        </div>
                      )}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-muted/10 flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="bg-white" 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="icon" className="bg-accent text-accent-foreground shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
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
