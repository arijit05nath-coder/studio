"use client"

import { useState } from "react"
import { Sparkles, BrainCircuit, Loader2, CheckCircle2, ChevronRight, Target, Book, Clock, Calendar, GraduationCap, Youtube, ExternalLink, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { generatePersonalizedStudyPlan, type PersonalizedStudyPlanOutput } from "@/ai/flows/personalized-study-recommendations"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { cn } from "@/lib/utils"

type Step = 'intro' | 'subjects' | 'ratings' | 'preferences' | 'generating' | 'result';

export default function AICoachPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [step, setStep] = useState<Step>('intro')
  const [loading, setLoading] = useState(false)
  const [useFocusData, setUseFocusData] = useState(false)
  const [plan, setPlan] = useState<PersonalizedStudyPlanOutput | null>(null)

  const [assessment, setAssessment] = useState({
    subjects: [] as string[],
    topics: "",
    ratings: {
      conceptClarity: 3,
      problemSolving: 3,
      examReadiness: 3
    },
    learningStyle: "mixed",
    studyTime: {
      hoursPerDay: 2,
      preferredTime: "evening"
    },
    deadlines: ""
  })

  const fetchFocusMetrics = async () => {
    if (!user || !db) return null;
    const q = query(collection(db, "userProfiles", user.uid, "focusSessions"), where("status", "==", "Completed"));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docs = snap.docs.map(d => d.data());
    const total = docs.length;
    const avg = docs.reduce((acc, curr) => acc + (curr.actualDurationMinutes || 0), 0) / total;
    return { avgSessionDuration: Math.round(avg), totalSessions: total };
  }

  const handleSubmit = async () => {
    if (!user || !db) return;
    setStep('generating');
    setLoading(true);

    try {
      let focusMetrics = null;
      if (useFocusData) {
        focusMetrics = await fetchFocusMetrics();
      }

      const input: any = {
        userId: user.uid,
        subjects: assessment.subjects,
        topics: assessment.topics,
        ratings: assessment.ratings,
        learningStyle: assessment.learningStyle,
        studyTime: assessment.studyTime,
        deadlines: assessment.deadlines || ""
      };

      if (focusMetrics) {
        input.focusMetrics = focusMetrics;
      }

      addDocumentNonBlocking(collection(db, "userProfiles", user.uid, "coachProfiles"), {
        ...input,
        createdAt: new Date().toISOString()
      });

      const result = await generatePersonalizedStudyPlan(input);
      setPlan(result);

      addDocumentNonBlocking(collection(db, "userProfiles", user.uid, "studyPlans"), {
        userId: user.uid,
        planContent: result,
        createdAt: new Date().toISOString()
      });

      setStep('result');
    } catch (error) {
      setStep('preferences');
    } finally {
      setLoading(false);
    }
  }

  const toggleSubject = (subj: string) => {
    setAssessment(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj) 
        ? prev.subjects.filter(s => s !== subj)
        : [...prev.subjects, subj]
    }))
  }

  const commonSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "Business"];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 bg-accent/10 p-6 rounded-3xl border border-accent/20">
        <div className="bg-accent p-3 rounded-2xl shadow-sm">
          <BrainCircuit className="h-8 w-8 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Study Coach</h1>
          <p className="text-muted-foreground text-sm">Let's build your personalized roadmap.</p>
        </div>
      </div>

      {step === 'intro' && (
        <Card className="border-none shadow-xl p-10 text-center space-y-6 bg-card">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-accent-foreground">Ready to level up?</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              I'll analyze your goals and learning style to create a plan that actually works for you.
            </p>
          </div>
          <Button onClick={() => setStep('subjects')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 h-auto text-lg gap-2 shadow-lg">
            Let's build your plan <ChevronRight className="h-5 w-5" />
          </Button>
        </Card>
      )}

      {step === 'subjects' && (
        <Card className="border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">What are we focusing on?</CardTitle>
            <CardDescription>Select your subjects and specific topics you're struggling with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {commonSubjects.map(subj => (
                <Button
                  key={subj}
                  variant={assessment.subjects.includes(subj) ? "default" : "outline"}
                  className={cn(
                    "rounded-xl justify-start gap-2",
                    assessment.subjects.includes(subj) ? "bg-accent text-accent-foreground" : ""
                  )}
                  onClick={() => toggleSubject(subj)}
                >
                  <Book className="h-4 w-4" />
                  {subj}
                </Button>
              ))}
            </div>
            
            <div className="space-y-3">
              <Label className="text-lg font-bold">Specific Topics</Label>
              <Textarea 
                placeholder="e.g. Integration techniques, Thermodynamics laws, Cell division..."
                value={assessment.topics}
                onChange={e => setAssessment({...assessment, topics: e.target.value})}
                className="min-h-[120px] rounded-2xl"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep('intro')}>Back</Button>
              <Button 
                disabled={assessment.subjects.length === 0} 
                onClick={() => setStep('ratings')}
                className="bg-accent text-accent-foreground"
              >
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'ratings' && (
        <Card className="border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">How are you feeling about these?</CardTitle>
            <CardDescription>Rate your current status on a scale of 1 to 5.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {[
              { id: 'conceptClarity', label: 'Concept Clarity', desc: 'How well do you understand the theory?' },
              { id: 'problemSolving', label: 'Problem Solving', desc: 'How confident are you in applying knowledge?' },
              { id: 'examReadiness', label: 'Exam Readiness', desc: 'How prepared do you feel for a test right now?' }
            ].map((rating) => (
              <div key={rating.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <Label className="text-lg font-bold">{rating.label}</Label>
                    <p className="text-xs text-muted-foreground">{rating.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {assessment.ratings[rating.id as keyof typeof assessment.ratings]}/5
                  </Badge>
                </div>
                <Slider 
                  value={[assessment.ratings[rating.id as keyof typeof assessment.ratings]]}
                  min={1} max={5} step={1}
                  onValueChange={([val]) => setAssessment({
                    ...assessment, 
                    ratings: { ...assessment.ratings, [rating.id]: val }
                  })}
                />
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep('subjects')}>Back</Button>
              <Button onClick={() => setStep('preferences')} className="bg-accent text-accent-foreground">Next Step</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preferences' && (
        <Card className="border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Preferences & Schedule</CardTitle>
            <CardDescription>Help me tailor the plan to your daily life.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Learning Style</Label>
                <Select value={assessment.learningStyle} onValueChange={v => setAssessment({...assessment, learningStyle: v})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual (Videos, Charts)</SelectItem>
                    <SelectItem value="practice">Practice-based (Exercises)</SelectItem>
                    <SelectItem value="theory">Theory-heavy (Reading, Notes)</SelectItem>
                    <SelectItem value="discussion">Discussion (Study Groups)</SelectItem>
                    <SelectItem value="mixed">Mixed Approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Preferred Study Time</Label>
                <Select value={assessment.studyTime.preferredTime} onValueChange={v => setAssessment({...assessment, studyTime: {...assessment.studyTime, preferredTime: v}})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Late Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="font-bold">Available Study Time</Label>
                <Badge variant="outline">{assessment.studyTime.hoursPerDay} hours/day</Badge>
              </div>
              <Slider 
                value={[assessment.studyTime.hoursPerDay]}
                min={1} max={12} step={1}
                onValueChange={([val]) => setAssessment({...assessment, studyTime: {...assessment.studyTime, hoursPerDay: val}})}
              />
            </div>

            <div className="space-y-3">
              <Label>Upcoming Deadlines (Optional)</Label>
              <Input 
                placeholder="e.g. Midterms in 2 weeks, Math quiz Friday..." 
                value={assessment.deadlines}
                onChange={e => setAssessment({...assessment, deadlines: e.target.value})}
                className="rounded-xl"
              />
            </div>

            <div className="bg-primary/20 p-4 rounded-2xl flex items-center justify-between border border-primary/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent-foreground" />
                <div className="text-sm text-foreground">
                  <p className="font-bold">Use Focus Mode Data?</p>
                  <p className="text-muted-foreground text-xs">Adapt study load to your real focus consistency.</p>
                </div>
              </div>
              <Button 
                variant={useFocusData ? "default" : "outline"} 
                size="sm" 
                onClick={() => setUseFocusData(!useFocusData)}
                className={useFocusData ? "bg-accent text-accent-foreground" : ""}
              >
                {useFocusData ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep('ratings')}>Back</Button>
              <Button onClick={handleSubmit} className="bg-accent text-accent-foreground px-8">Generate My Plan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-accent animate-spin" />
            <Sparkles className="h-6 w-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-current" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Crafting your roadmap...</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Analyzing your weaknesses and balancing your schedule for maximum efficiency.
            </p>
          </div>
        </div>
      )}

      {step === 'result' && plan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Your Personalized Plan</h2>
            <Button variant="outline" onClick={() => setStep('subjects')} className="rounded-full">
              Edit Assessment
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="bg-accent/5 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    Priority Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {plan.priorityTopics.map((topic, i) => (
                      <Badge key={i} className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1 px-3">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Concept Breakdowns */}
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="bg-yellow-500/10 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Study Aid: Concept Breakdowns
                  </CardTitle>
                  <CardDescription>Key principles to help you study the topics you're weak in.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {plan.conceptBreakdowns.map((item, i) => (
                    <div key={i} className="space-y-2 border-l-4 border-yellow-500/30 pl-4 py-1">
                      <h4 className="font-bold text-foreground">{item.topic}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="bg-primary/5 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 prose prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-accent-foreground prose-strong:text-foreground">
                  <div dangerouslySetInnerHTML={{ __html: plan.weeklyPlan.replace(/\n/g, '<br/>') }} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="bg-accent/5 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-accent" />
                    Study Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.strategy}
                  </p>
                </CardContent>
              </Card>

              {/* Visual Resources */}
              {plan.visualResources && plan.visualResources.length > 0 && (
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="bg-red-500/5 rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <Youtube className="h-5 w-5 text-red-600" />
                      Visual Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {plan.visualResources.map((res, i) => (
                      <Button key={i} variant="outline" className="w-full justify-between h-auto py-3 px-4 rounded-xl group" asChild>
                        <a href={res.url} target="_blank" rel="noopener noreferrer">
                          <div className="flex flex-col items-start gap-1 overflow-hidden">
                            <span className="text-sm font-bold group-hover:text-red-600 truncate w-full">{res.title}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{res.platform}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-red-600 shrink-0" />
                        </a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.actionableSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full bg-accent text-accent-foreground py-6 rounded-2xl gap-2 font-bold shadow-lg"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Regenerate Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
