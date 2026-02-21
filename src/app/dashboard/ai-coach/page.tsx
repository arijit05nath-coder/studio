
"use client"

import { useState } from "react"
import { Sparkles, ArrowRight, BrainCircuit, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { personalizedStudyRecommendations, type PersonalizedStudyRecommendationsOutput } from "@/ai/flows/personalized-study-recommendations"
import { useAuth } from "@/lib/auth-store"

export default function AICoachPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<PersonalizedStudyRecommendationsOutput | null>(null)

  const generateRecommendations = async () => {
    setLoading(true)
    try {
      // Mock performance data for the demo
      const result = await personalizedStudyRecommendations({
        userId: user?.id || "demo-user",
        completedSessions: [
          { sessionId: "1", topic: "Calculus: Derivatives", durationMinutes: 45, focusScore: 4, notesTaken: true, quizScore: 85 },
          { sessionId: "2", topic: "Physics: Thermodynamics", durationMinutes: 30, focusScore: 2, notesTaken: false, quizScore: 40 },
          { sessionId: "3", topic: "Physics: Mechanics", durationMinutes: 60, focusScore: 5, notesTaken: true, quizScore: 92 },
        ],
        performanceSummary: {
          overallGrade: "B+",
          weakTopics: ["Thermodynamics", "French Grammar"],
          strongTopics: ["Calculus", "Classical Mechanics"],
          recentQuizScores: [
            { topic: "Calculus", score: 88 },
            { topic: "Physics", score: 65 },
          ],
        },
        userPreferences: {
          learningStyle: "Visual",
          preferredStudyTimes: "Morning",
          goals: "Improve Physics grade and master advanced calculus concepts.",
        }
      })
      setRecommendations(result)
    } catch (error) {
      console.error("Failed to fetch recommendations", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-accent/10 p-8 rounded-3xl border border-accent/20">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="bg-accent p-4 rounded-2xl shadow-lg">
            <BrainCircuit className="h-10 w-10 text-accent-foreground" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">AI Study Coach</h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              I analyze your study sessions and performance to create a personalized roadmap just for you.
            </p>
          </div>
          <Button 
            onClick={generateRecommendations} 
            disabled={loading}
            className="bg-accent text-accent-foreground hover:bg-accent/80 rounded-full px-8 py-6 h-auto text-lg font-bold gap-3 shadow-md"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-current" />}
            {recommendations ? "Refresh Plan" : "Generate Plan"}
          </Button>
        </div>
      </div>

      {!recommendations && !loading && (
        <div className="grid md:grid-cols-3 gap-6 opacity-60">
          {[
            { title: "Analyze Habits", desc: "We track how long and how focused you stay." },
            { title: "Spot Weaknesses", desc: "Identify topics where you struggle the most." },
            { title: "Personalized Steps", desc: "Get concrete actions to improve your grades." },
          ].map((item, i) => (
            <Card key={i} className="bg-white border-dashed border-2">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
          <p className="text-muted-foreground animate-pulse">Consulting your study data...</p>
        </div>
      )}

      {recommendations && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {recommendations.personalizedRecommendations.map((rec, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden bg-white">
              <div className={cn(
                "h-2 w-full",
                rec.priorityLevel === 'High' ? "bg-destructive" : rec.priorityLevel === 'Medium' ? "bg-accent" : "bg-primary"
              )} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px]">
                      {rec.priorityLevel} Priority
                    </Badge>
                    <CardTitle className="text-2xl text-accent-foreground">{rec.topic}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base text-foreground/80 mt-2">
                  {rec.reasoning}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-xl border">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent fill-current" />
                    Suggested Approach
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.suggestedApproach}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-sm mb-3">Your Next Steps</h4>
                  <div className="grid gap-2">
                    {rec.nextSteps.map((step, si) => (
                      <div key={si} className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
