'use server';
/**
 * @fileOverview A Genkit flow for generating personalized study plans based on student self-assessment.
 *
 * - generatePersonalizedStudyPlan - A function that provides a personalized study roadmap.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedStudyPlanInputSchema = z.object({
  userId: z.string().describe('The ID of the student.'),
  subjects: z.array(z.string()).describe('Subjects selected by the student.'),
  topics: z.string().describe('Specific topics the student is struggling with.'),
  ratings: z.object({
    conceptClarity: z.number().describe('Self-rated clarity of concepts (1-5).'),
    problemSolving: z.number().describe('Self-rated confidence in problem solving (1-5).'),
    examReadiness: z.number().describe('Self-rated readiness for exams (1-5).'),
  }),
  learningStyle: z.string().describe('The student\'s preferred learning style.'),
  studyTime: z.object({
    hoursPerDay: z.number().describe('Available study hours per day.'),
    preferredTime: z.string().describe('Preferred time of day for studying.'),
  }),
  deadlines: z.string().optional().describe('Upcoming academic deadlines.'),
  focusMetrics: z.object({
    avgSessionDuration: z.number().optional().describe('Actual average focus session duration in minutes.'),
    totalSessions: z.number().optional().describe('Total number of focus sessions completed.'),
  }).optional(),
});

export type PersonalizedStudyPlanInput = z.infer<typeof PersonalizedStudyPlanInputSchema>;

const PersonalizedStudyPlanOutputSchema = z.object({
  priorityTopics: z.array(z.string()).describe('Top topics to focus on based on low confidence.'),
  strategy: z.string().describe('Personalized study strategy tailored to learning style.'),
  weeklyPlan: z.string().describe('A structured weekly plan in Markdown format.'),
  actionableSteps: z.array(z.string()).describe('Specific, actionable tasks for the student.'),
  conceptBreakdowns: z.array(z.object({
    topic: z.string(),
    explanation: z.string().describe('A simple, helpful explanation of the core concept.'),
  })).describe('Brief explanations for the topics the student is weak in.'),
  visualResources: z.array(z.object({
    title: z.string(),
    url: z.string().describe('A direct YouTube search link or educational video URL.'),
    platform: z.string().default('YouTube'),
  })).optional().describe('Suggested visual resources, especially for visual or mixed learners.'),
});

export type PersonalizedStudyPlanOutput = z.infer<typeof PersonalizedStudyPlanOutputSchema>;

const personalizedStudyPlanPrompt = ai.definePrompt({
  name: 'personalizedStudyPlanPrompt',
  input: { schema: PersonalizedStudyPlanInputSchema },
  output: { schema: PersonalizedStudyPlanOutputSchema },
  prompt: `You are an expert AI Study Coach. Your goal is to not only plan a routine but also actively help the student understand the concepts they find difficult.

**Student Profile:**
- Subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Weak Topics: {{{topics}}}
- Confidence Ratings (1-5):
  - Concept Clarity: {{{ratings.conceptClarity}}}
  - Problem Solving: {{{ratings.problemSolving}}}
  - Exam Readiness: {{{ratings.examReadiness}}}
- Learning Style: {{{learningStyle}}}
- Availability: {{{studyTime.hoursPerDay}}} hours/day during {{{studyTime.preferredTime}}}
{{#if deadlines}}- Deadlines: {{{deadlines}}}{{/if}}

{{#if focusMetrics}}
**Real Focus Data:**
- Average Focus Duration: {{{focusMetrics.avgSessionDuration}}} minutes
- Total Sessions: {{{focusMetrics.totalSessions}}}
{{/if}}

**Instructions:**
1. **Identify Priority Topics**: Based on the lowest confidence ratings.
2. **Personalized Strategy**: Tailor this to their learning style.
3. **Concept Breakdowns**: For the weak topics mentioned, provide a brief, high-impact explanation of the core principles to help them study immediately.
4. **Visual Resources**: If the learning style is "visual" or "mixed", you MUST provide educational YouTube search links (format: https://www.youtube.com/results?search_query=TOPIC+NAME) or specific reputable channel suggestions (e.g., Khan Academy, Crash Course) related to their weak topics.
5. **Weekly Plan**: A structured weekly plan in Markdown. If focus metrics are available, adapt session lengths to match their average focus duration.
6. **Actionable Steps**: Specific tasks including Focus Mode suggestions.

Ensure the tone is encouraging and focused on helping them bridge their knowledge gaps.`,
});

const personalizedStudyPlanFlow = ai.defineFlow(
  {
    name: 'personalizedStudyPlanFlow',
    inputSchema: PersonalizedStudyPlanInputSchema,
    outputSchema: PersonalizedStudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedStudyPlanPrompt(input);
    return output!;
  }
);

export async function generatePersonalizedStudyPlan(input: PersonalizedStudyPlanInput): Promise<PersonalizedStudyPlanOutput> {
  return personalizedStudyPlanFlow(input);
}
