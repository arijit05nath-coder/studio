
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Users, Plus, MessageSquare, Send, Loader2, Trophy, Hash, Copy, Check, LogIn, Clock, Medal, LogOut, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { collection, query, where, serverTimestamp, orderBy, getDoc, doc, or, updateDoc, arrayUnion, arrayRemove, getDocs } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"

export default function GroupsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [joinId, setJoinId] = useState("")
  const [newGroup, setNewGroup] = useState({ name: "", description: "" })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
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

  const messagesQuery = useMemoFirebase(() => {
    if (!selectedGroupId || !db || !user || !userRole) return null;
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

  // Leaderboard Calculation
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedGroup || !db) return;
      setLoadingLeaderboard(true);
      try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const memberStats = await Promise.all(
          (selectedGroup.memberIds || []).map(async (memberId: string) => {
            // Get profile
            const profileSnap = await getDoc(doc(db, "userProfiles", memberId));
            const profile = profileSnap.data();
            
            // Get weekly sessions
            const sessionsQuery = query(
              collection(db, "userProfiles", memberId, "focusSessions"),
              where("status", "==", "Completed"),
              where("startTime", ">=", startOfWeek.toISOString())
            );
            const sessionsSnap = await getDocs(sessionsQuery);
            const totalMinutes = sessionsSnap.docs.reduce((acc, d) => acc + (d.data().actualDurationMinutes || 0), 0);
            
            return {
              id: memberId,
              name: profile ? `${profile.firstName} ${profile.lastName}` : "Unknown Student",
              totalMinutes
            };
          })
        );

        setLeaderboard(memberStats.sort((a, b) => b.totalMinutes - a.totalMinutes));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    if (selectedGroupId) {
      fetchLeaderboard();
    }
  }, [selectedGroupId, selectedGroup, db]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedGroupId || !user || !selectedGroup || !db) return;

    addDocumentNonBlocking(collection(db, "studyGroups", selectedGroupId, "messages"), {
      senderId: user.uid,
      senderName: user.email?.split('@')[0] || "User",
      text: message.trim(),
      timestamp: serverTimestamp()
    });

    setMessage("");
  }

  const generateGroupId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateGroup = () => {
    if (!user || !db || !newGroup.name) return;

    const customId = generateGroupId();
    const groupRef = doc(db, "studyGroups", customId);

    setDocumentNonBlocking(groupRef, {
      name: newGroup.name,
      description: newGroup.description || "No description provided.",
      memberIds: [user.uid],
      teacherId: user.uid,
      dateCreated: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });

    setNewGroup({ name: "", description: "" });
    setIsCreateDialogOpen(false);
    setSelectedGroupId(customId);
    toast({ title: "Group created!", description: `Share ID: ${customId}` });
  }

  const handleJoinGroup = async () => {
    if (!user || !db || !joinId.trim()) return;

    try {
      const groupRef = doc(db, "studyGroups", joinId.trim().toUpperCase());
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        toast({ variant: "destructive", title: "Group not found", description: "Please check the Group ID." });
        return;
      }

      await updateDoc(groupRef, {
        memberIds: arrayUnion(user.uid)
      });

      setJoinId("");
      setIsJoinDialogOpen(false);
      setSelectedGroupId(groupSnap.id);
      toast({ title: "Joined group successfully!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to join", description: error.message });
    }
  }

  const handleLeaveGroup = () => {
    if (!user || !db || !selectedGroupId) return;
    
    const groupRef = doc(db, "studyGroups", selectedGroupId);
    updateDocumentNonBlocking(groupRef, {
      memberIds: arrayRemove(user.uid)
    });
    
    setSelectedGroupId(null);
    toast({ title: "Left group", description: "You are no longer a member of this group." });
  }

  const handleDeleteGroup = () => {
    if (!user || !db || !selectedGroupId) return;
    
    const groupRef = doc(db, "studyGroups", selectedGroupId);
    deleteDocumentNonBlocking(groupRef);
    
    setSelectedGroupId(null);
    toast({ title: "Group deleted", description: "The study group has been permanently removed." });
  }

  const copyGroupId = () => {
    if (selectedGroupId) {
      navigator.clipboard.writeText(selectedGroupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "ID copied to clipboard" });
    }
  }

  const isCreator = selectedGroup?.teacherId === user?.uid;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Groups</h1>
          <p className="text-muted-foreground">Collaborate with your peers and build healthy competition.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2">
                <LogIn className="h-4 w-4" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Join a Study Group</DialogTitle>
                <DialogDescription>Enter the 6-character Group ID to join your peers.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="joinId">Group ID</Label>
                <Input
                  id="joinId"
                  placeholder="e.g. A1B2C3"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  className="mt-2 font-mono"
                  maxLength={6}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleJoinGroup} disabled={!joinId.trim()} className="bg-accent text-accent-foreground">
                  Join Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>A unique 6-character code will be generated for your group.</DialogDescription>
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
                <Button onClick={handleCreateGroup} disabled={!newGroup.name} className="bg-accent text-accent-foreground">
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                  "border-none shadow-sm cursor-pointer transition-all hover:translate-x-1 bg-card",
                  selectedGroupId === group.id ? "ring-2 ring-accent" : ""
                )}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">{group.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                      {group.memberIds?.length || 0} Members
                    </Badge>
                  </div>
                  <CardDescription className="text-xs truncate">
                    {group.description || "No description"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-3xl opacity-50">
              <p className="text-sm">No groups yet.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-2xl truncate">{selectedGroup.name}</CardTitle>
                    <CardDescription className="truncate">{selectedGroup.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Group ID</span>
                      <code className="text-[14px] bg-muted px-3 py-1 rounded font-mono font-bold tracking-wider">{selectedGroupId}</code>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={copyGroupId}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    
                    {isCreator ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Delete Study Group?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. All messages and rankings for this group will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Group
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="rounded-full">
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave Study Group?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will no longer be able to see messages or rankings for this group. You can rejoin later using the Group ID.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Leave Group
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="bg-card rounded-full p-1 border">
                  <TabsTrigger value="chat" className="rounded-full gap-2 px-6">
                    <MessageSquare className="h-4 w-4" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="rounded-full gap-2 px-6">
                    <Medal className="h-4 w-4" /> Leaderboard
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-4">
                  <Card className="border-none shadow-sm overflow-hidden flex flex-col h-[500px] bg-card">
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
                          className="bg-background" 
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
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-4">
                  <Card className="border-none shadow-sm bg-card h-[500px]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Weekly Focus Rankings
                      </CardTitle>
                      <CardDescription>Healthy competition build habits. Who focused the most this week?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingLeaderboard ? (
                        <div className="flex justify-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        </div>
                      ) : (
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-3">
                            {leaderboard.map((item, index) => (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                  index === 0 ? "bg-yellow-500/5 border-yellow-500/30 ring-1 ring-yellow-500/20" : "bg-muted/20",
                                  item.id === user?.uid ? "border-accent ring-1 ring-accent/20" : ""
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                    index === 0 ? "bg-yellow-500 text-white" : 
                                    index === 1 ? "bg-slate-300 text-slate-700" :
                                    index === 2 ? "bg-amber-600/80 text-white" : "bg-muted text-muted-foreground"
                                  )}>
                                    {index + 1}
                                  </div>
                                  <Avatar className="h-10 w-10 border shrink-0">
                                    <AvatarImage src={`https://picsum.photos/seed/${item.id}/40/40`} />
                                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                                    {item.id === user?.uid && <span className="text-[10px] text-accent font-bold uppercase tracking-wider">You</span>}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-bold">{Math.floor(item.totalMinutes / 60)}h {item.totalMinutes % 60}min</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">This week</span>
                                </div>
                              </div>
                            ))}
                            {leaderboard.length === 0 && (
                              <div className="text-center py-20 opacity-50">
                                <Trophy className="h-10 w-10 mx-auto mb-2" />
                                <p>No focus sessions recorded yet.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card rounded-3xl border-2 border-dashed border-muted min-h-[500px]">
              <div className="bg-muted p-6 rounded-full mb-6">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold">Select a group or join one</h3>
              <p className="text-muted-foreground max-w-sm mt-3">
                Join a group using an ID from a classmate, or create your own to start collaborating and competing.
              </p>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="rounded-full px-8" onClick={() => setIsJoinDialogOpen(true)}>Join Group</Button>
                <Button className="bg-accent text-accent-foreground rounded-full px-8" onClick={() => setIsCreateDialogOpen(true)}>Create New</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
