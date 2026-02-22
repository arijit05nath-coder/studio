
"use client"

import { useState } from "react"
import { Sparkles, BrainCircuit, Loader2, CheckCircle2, ChevronRight, Target, Book, Clock, Calendar, GraduationCap, Youtube, ExternalLink, Lightbulb, Plus, Save, FileText, ClipboardCheck, BarChart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generatePersonalizedStudyPlan, type PersonalizedStudyPlanOutput } from "@/ai/flows/personalized-study-recommendations"
import { analyzeAssignment, type AssignmentAnalysisOutput } from "@/ai/flows/assignment-analysis-flow"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-store"

type Step = 'intro' | 'subjects' | 'ratings' | 'preferences' | 'generating' | 'result';

export default function AICoachPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { t } = useI18n()
  
  // Study Plan State
  const [step, setStep] = useState<Step>('intro')
  const [loading, setLoading] = useState(false)
  const [useFocusData, setUseFocusData] = useState(false)
  const [plan, setPlan] = useState<PersonalizedStudyPlanOutput | null>(null)
  const [customSubject, setCustomSubject] = useState("")
  const [isSaving, setIsSaving] = useState(false)
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

  // Assignment Analysis State
  const [assignmentText, setAssignmentText] = useState("")
  const [assignmentSubject, setAssignmentSubject] = useState("")
  const [customRubric, setCustomRubric] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AssignmentAnalysisOutput | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

  const handleGeneratePlan = async () => {
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

      const result = await generatePersonalizedStudyPlan(input);
      setPlan(result);
      setStep('result');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Could not generate your plan. Please try again."
      })
      setStep('preferences');
    } finally {
      setLoading(false);
    }
  }

  const handleAnalyzeAssignment = async () => {
    if (!assignmentText.trim() || !assignmentSubject.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both the assignment text and subject."
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeAssignment({
        assignmentText,
        subject: assignmentSubject,
        rubric: customRubric
      });
      setAnalysisResult(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "Could not analyze your assignment. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleSavePlan = () => {
    if (!user || !db || !plan) return;
    setIsSaving(true);

    addDocumentNonBlocking(collection(db, "userProfiles", user.uid, "studyPlans"), {
      userId: user.uid,
      planContent: plan,
      createdAt: new Date().toISOString(),
      assessment: assessment
    });

    setTimeout(() => {
      setIsSavingCourse(false);
      toast({
        title: "Plan Saved!",
        description: "You can view your saved study plans in your dashboard."
      });
    }, 500);
  }

  const toggleSubject = (subj: string) => {
    setAssessment(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj) 
        ? prev.subjects.filter(s => s !== subj)
        : [...prev.subjects, subj]
    }))
  }

  const addCustomSubject = () => {
    if (customSubject.trim() && !assessment.subjects.includes(customSubject.trim())) {
      setAssessment(prev => ({
        ...prev,
        subjects: [...prev.subjects, customSubject.trim()]
      }));
      setCustomSubject("");
    }
  }

  const commonSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "Business"];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 bg-accent/10 p-6 rounded-3xl border border-accent/20">
        <div className="bg-accent p-3 rounded-2xl shadow-sm">
          <BrainCircuit className="h-8 w-8 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('aiCoach')}</h1>
          <p className="text-muted-foreground text-sm">{t('aiCoachDesc')}</p>
        </div>
      </div>

      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="bg-muted p-1 rounded-full mb-8">
          <TabsTrigger value="planner" className="rounded-full px-8 gap-2">
            <Calendar className="h-4 w-4" /> {t('studyPlanner')}
          </TabsTrigger>
          <TabsTrigger value="assignment" className="rounded-full px-8 gap-2">
            <FileText className="h-4 w-4" /> {t('assignmentAnalysis')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-8">
          {step === 'intro' && (
            <Card className="border-none shadow-xl p-10 text-center space-y-6 bg-card">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-accent-foreground">{t('readyToLevelUp')}</h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                  {t('readyToLevelUpDesc')}
                </p>
              </div>
              <Button onClick={() => setStep('subjects')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 h-auto text-lg gap-2 shadow-lg">
                {t('letBuildPlan')} <ChevronRight className="h-5 w-5" />
              </Button>
            </Card>
          )}

          {step === 'subjects' && (
            <Card className="border-none shadow-xl bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">{t('whatFocusingOn')}</CardTitle>
                <CardDescription>{t('subjectsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold">{t('subjectsLabel')}</Label>
                    <Badge variant="outline">{assessment.subjects.length} {t('edit')}</Badge>
                  </div>
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
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-bold">{t('addOtherSubjects')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Psychology, Art History..." 
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                      className="rounded-xl"
                    />
                    <Button variant="outline" onClick={addCustomSubject} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-lg font-bold">{t('topicsLabel')}</Label>
                  <Textarea 
                    placeholder={t('topicsPlaceholder')}
                    value={assessment.topics}
                    onChange={e => setAssessment({...assessment, topics: e.target.value})}
                    className="min-h-[120px] rounded-2xl"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep('intro')}>{t('cancel')}</Button>
                  <Button 
                    disabled={assessment.subjects.length === 0} 
                    onClick={() => setStep('ratings')}
                    className="bg-accent text-accent-foreground"
                  >
                    {t('nextSteps')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'ratings' && (
            <Card className="border-none shadow-xl bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">{t('howFeeling')}</CardTitle>
                <CardDescription>{t('rateStatus')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10">
                {[
                  { id: 'conceptClarity', label: t('conceptClarity'), desc: t('conceptClarityDesc') },
                  { id: 'problemSolving', label: t('problemSolving'), desc: t('problemSolvingDesc') },
                  { id: 'examReadiness', label: t('examReadiness'), desc: t('examReadinessDesc') }
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
                  <Button variant="ghost" onClick={() => setStep('subjects')}>{t('edit')}</Button>
                  <Button onClick={() => setStep('preferences')} className="bg-accent text-accent-foreground">{t('nextSteps')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'preferences' && (
            <Card className="border-none shadow-xl bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">{t('preferencesSchedule')}</CardTitle>
                <CardDescription>{t('tailorPlan')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>{t('learningStyle')}</Label>
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
                    <Label>{t('preferredTime')}</Label>
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
                    <Label className="font-bold">{t('availableTime')}</Label>
                    <Badge variant="outline">{assessment.studyTime.hoursPerDay} {t('hours')}/day</Badge>
                  </div>
                  <Slider 
                    value={[assessment.studyTime.hoursPerDay]}
                    min={1} max={12} step={1}
                    onValueChange={([val]) => setAssessment({...assessment, studyTime: {...assessment.studyTime, hoursPerDay: val}})}
                  />
                </div>

                <div className="bg-primary/20 p-4 rounded-2xl flex items-center justify-between border border-primary/30">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                    <div className="text-sm text-foreground">
                      <p className="font-bold">{t('useFocusData')}</p>
                      <p className="text-muted-foreground text-xs">{t('useFocusDataDesc')}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={useFocusData}
                    onCheckedChange={setUseFocusData}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep('ratings')}>{t('edit')}</Button>
                  <Button onClick={handleGeneratePlan} className="bg-accent text-accent-foreground px-8">{t('generatePlan')}</Button>
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
                <h2 className="text-2xl font-bold">{t('craftingRoadmap')}</h2>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {t('analyzingWeaknesses')}
                </p>
              </div>
            </div>
          )}

          {step === 'result' && plan && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">{t('yourPersonalizedPlan')}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('subjects')} className="rounded-full">
                    {t('editAssessment')}
                  </Button>
                  <Button onClick={handleSavePlan} disabled={isSaving} className="bg-accent text-accent-foreground rounded-full gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('savePlan')}
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-sm bg-card">
                    <CardHeader className="bg-accent/5 rounded-t-lg">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Target className="h-5 w-5 text-accent" />
                        {t('priorityTopics')}
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

                  <Card className="border-none shadow-sm bg-card">
                    <CardHeader className="bg-yellow-500/10 rounded-t-lg">
                      <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        {t('studyAid')}: {t('conceptBreakdowns')}
                      </CardTitle>
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
                        {t('weeklySchedule')}
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
                        {t('strategy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {plan.strategy}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">{t('nextStepTasks')}</CardTitle>
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
                    onClick={handleGeneratePlan} 
                    disabled={loading}
                    className="w-full bg-accent text-accent-foreground py-6 rounded-2xl gap-2 font-bold shadow-lg"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {t('regeneratePlan')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignment" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <ClipboardCheck className="h-6 w-6 text-accent" />
                    {t('submitForAnalysis')}
                  </CardTitle>
                  <CardDescription>{t('expertFeedback')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="asSubject">{t('curriculum')}</Label>
                    <Input 
                      id="asSubject"
                      placeholder="e.g. History, Biology..."
                      value={assignmentSubject}
                      onChange={e => setAssignmentSubject(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asText">{t('assignmentContent')}</Label>
                    <Textarea 
                      id="asText"
                      placeholder={t('assignmentContentPlaceholder')}
                      className="min-h-[300px] rounded-2xl"
                      value={assignmentText}
                      onChange={e => setAssignmentText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asRubric">{t('customRubric')}</Label>
                    <Textarea 
                      id="asRubric"
                      placeholder={t('customRubricPlaceholder')}
                      className="min-h-[100px] rounded-2xl"
                      value={customRubric}
                      onChange={e => setCustomRubric(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyzeAssignment} 
                    disabled={isAnalyzing}
                    className="w-full bg-accent text-accent-foreground py-6 rounded-2xl gap-2 font-bold"
                  >
                    {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {t('analyzeAssignment')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                  <Loader2 className="h-12 w-12 text-accent animate-spin" />
                  <p className="font-bold">{t('evaluatingWork')}</p>
                  <p className="text-sm text-muted-foreground">{t('checkingRubric')}</p>
                </div>
              )}

              {analysisResult && !isAnalyzing && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <Card className="border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-primary/10">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        {t('analysisResults')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="bg-muted/30 p-4 rounded-2xl border">
                        <p className="text-sm leading-relaxed italic">"{analysisResult.overallFeedback}"</p>
                      </div>

                      <div className="space-y-4">
                        <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{t('criterionBreakdown')}</Label>
                        {analysisResult.rubricScores.map((item, i) => (
                          <div key={i} className="space-y-2 p-4 rounded-2xl bg-muted/20 border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm">{item.criterion}</span>
                              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">{item.score}/5</Badge>
                            </div>
                            <Progress value={item.score * 20} className="h-1.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.feedback}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-bold text-xs uppercase text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {t('strengths')}
                          </h4>
                          <ul className="space-y-1">
                            {analysisResult.strengths.map((s, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-xs uppercase text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {t('growthAreas')}
                          </h4>
                          <ul className="space-y-1">
                            {analysisResult.areasForImprovement.map((a, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">• {a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-bold text-sm">{t('recommendedRevision')}</h4>
                        <div className="space-y-2">
                          {analysisResult.suggestedRevisionSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
                              <span className="bg-accent text-accent-foreground h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                              <p className="text-xs">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!analysisResult && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card rounded-3xl border-2 border-dashed opacity-40 py-40">
                  <FileText className="h-16 w-16 mb-4" />
                  <p className="font-medium">{t('noAnalysisPerformed')}</p>
                  <p className="text-sm">{t('submitPrompt')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
