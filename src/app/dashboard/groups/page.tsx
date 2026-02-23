
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Users, Plus, MessageSquare, Send, Loader2, Trophy, Hash, Copy, Check, LogIn, Clock, Medal, LogOut, Trash2, AlertTriangle, Info } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { collection, query, where, serverTimestamp, orderBy, getDoc, doc, or, updateDoc, arrayUnion, arrayRemove, getDocs, setDoc } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-store"

export default function GroupsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { t } = useI18n()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [joinId, setJoinId] = useState("")
  const [newGroup, setNewGroup] = useState({ name: "", description: "" })
  const [copied, setCopied] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const groupsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "studyGroups"),
      or(
        where("memberIds", "array-contains", user.uid),
        where("teacherId", "==", user.uid)
      )
    );
  }, [user, db]);

  const { data: groups, isLoading: groupsLoading } = useCollection(groupsQuery);
  const selectedGroup = groups?.find(g => g.id === selectedGroupId);

  const messagesQuery = useMemoFirebase(() => {
    if (!selectedGroupId || !db || !user || !selectedGroup) return null;
    return query(
      collection(db, "studyGroups", selectedGroupId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [selectedGroupId, db, user, selectedGroup]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedGroup || !db) return;
      setLoadingLeaderboard(true);
      try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDate() % 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const memberStats = await Promise.all(
          (selectedGroup.memberIds || []).map(async (memberId: string) => {
            const profileSnap = await getDoc(doc(db, "userProfiles", memberId));
            const profile = profileSnap.data();
            
            const sessionsQuery = query(
              collection(db, "userProfiles", memberId, "focusSessions"),
              where("status", "==", "Completed"),
              where("startTime", ">=", startOfWeek.toISOString())
            );
            const sessionsSnap = await getDocs(sessionsQuery);
            const totalMinutes = sessionsSnap.docs.reduce((acc, d) => acc + (d.data().actualDurationMinutes || 0), 0);
            
            return {
              id: memberId,
              name: profile ? `${profile.firstName} ${profile.lastName}` : t('scholar'),
              firstName: profile?.firstName || "",
              lastName: profile?.lastName || "",
              photoUrl: profile?.photoUrl || "",
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

    if (selectedGroupId && selectedGroup) {
      fetchLeaderboard();
    }
  }, [selectedGroupId, selectedGroup, db, t]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedGroupId || !user || !selectedGroup || !db) return;

    addDocumentNonBlocking(collection(db, "studyGroups", selectedGroupId, "messages"), {
      senderId: user.uid,
      senderName: user.email?.split('@')[0] || t('student'),
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
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
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
      
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to join", description: error.message });
    }
  }

  const copyGroupId = () => {
    if (selectedGroupId) {
      navigator.clipboard.writeText(selectedGroupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('copyId') });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('groups')}</h1>
          <p className="text-muted-foreground">{t('collaborateDesc')}</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2">
                <LogIn className="h-4 w-4" />
                {t('joinGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('joinGroup')}</DialogTitle>
                <DialogDescription>Enter the 6-character Group ID to join your peers.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="joinId">{t('groupId')}</Label>
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
                  {t('joinGroup')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                {t('createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('createGroup')}</DialogTitle>
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
                  <Label htmlFor="description">Description</Label>
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
                  {t('createGroup')}
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
            {t('yourGroups')}
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
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-3xl opacity-50">
              <p className="text-sm">{t('noGroupsYet')}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-2xl truncate">{selectedGroup.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {selectedGroup.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('groupId')}</span>
                      <div className="flex items-center gap-1">
                        <code className="text-[14px] bg-muted px-3 py-1 rounded font-mono font-bold tracking-wider">{selectedGroupId}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={copyGroupId}>
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="bg-card rounded-full p-1 border">
                  <TabsTrigger value="chat" className="rounded-full gap-2 px-6">
                    <MessageSquare className="h-4 w-4" /> {t('chat')}
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="rounded-full gap-2 px-6">
                    <Medal className="h-4 w-4" /> {t('leaderboard')}
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
                              <p className="text-sm italic">{t('startConversation')}</p>
                            </div>
                          )}
                          <div ref={scrollRef} />
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t bg-muted/10 flex gap-2">
                        <Input 
                          placeholder={t('typeMessage')} 
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
                        {t('weeklyRankings')}
                      </CardTitle>
                      <CardDescription>{t('healthyCompetition')}</CardDescription>
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
                                    index === 0 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
                                  )}>
                                    {index + 1}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-bold">{Math.floor(item.totalMinutes / 60)}h {item.totalMinutes % 60}m</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{t('thisWeek')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card rounded-3xl border border-muted/50 min-h-[500px] opacity-40">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold">{t('selectGroupPrompt')}</h3>
            </div>
          ) : !groupsLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card rounded-3xl border-2 border-dashed border-muted min-h-[500px]">
              <Users className="h-16 w-16 text-muted-foreground mb-6" />
              <h3 className="text-2xl font-bold">{t('noGroupsYet')}</h3>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="rounded-full px-8" onClick={() => setIsJoinDialogOpen(true)}>{t('joinGroup')}</Button>
                <Button className="bg-accent text-accent-foreground rounded-full px-8" onClick={() => setIsCreateDialogOpen(true)}>{t('createGroup')}</Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
