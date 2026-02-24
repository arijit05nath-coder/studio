'use server';
/**
 * @fileOverview A Genkit flow for generating personalized study plans with a conversational coach persona.
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
  priorityTopics: z.array(z.string()).describe('The topics I want you to focus on first.'),
  strategy: z.string().describe('My personalized strategy for how you should approach your studies.'),
  weeklyPlan: z.string().describe('A structured weekly plan I created for you in Markdown format.'),
  actionableSteps: z.array(z.string()).describe('Specific tasks I want you to complete.'),
  conceptBreakdowns: z.array(z.object({
    topic: z.string(),
    explanation: z.string().describe('My simple, helpful explanation of the core concept just for you.'),
  })).describe('My brief explanations for the topics you mentioned struggling with.'),
  visualResources: z.array(z.object({
    title: z.string(),
    url: z.string().describe('A direct link I found for you.'),
    platform: z.string().default('YouTube'),
  })).optional().describe('Suggested visual resources I picked for you.'),
});

export type PersonalizedStudyPlanOutput = z.infer<typeof PersonalizedStudyPlanOutputSchema>;

const personalizedStudyPlanPrompt = ai.definePrompt({
  name: 'personalizedStudyPlanPrompt',
  input: { schema: PersonalizedStudyPlanInputSchema },
  output: { schema: PersonalizedStudyPlanOutputSchema },
  prompt: `I am your AI Study Coach. I've been looking over your profile, and I'm ready to help you build a plan that truly clicks for you.

**What I know about you:**
- You're balancing: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- You've mentioned these are tricky: {{{topics}}}
- Your current confidence levels:
  - Concept Clarity: {{{ratings.conceptClarity}}}/5
  - Problem Solving: {{{ratings.problemSolving}}}/5
  - Exam Readiness: {{{ratings.examReadiness}}}/5
- You learn best through: {{{learningStyle}}}
- You have {{{studyTime.hoursPerDay}}} hours/day during the {{{studyTime.preferredTime}}}
{{#if deadlines}}- And we have these deadlines to meet: {{{deadlines}}}{{/if}}

{{#if focusMetrics}}
**What I see from your actual focus sessions:**
- You usually stay in the zone for {{{focusMetrics.avgSessionDuration}}} minutes.
- You've already completed {{{focusMetrics.totalSessions}}} sessions—great job!
{{/if}}

**My Plan for You:**
1. **Your Priorities**: I'll identify exactly which topics we should tackle first.
2. **Our Strategy**: I'll tailor my advice to your {{{learningStyle}}} learning style.
3. **Breaking it Down**: I'll explain those difficult concepts to you simply.
4. **Resources**: If you need visuals, I'll find specific YouTube guides for you.
5. **Your Schedule**: I'll build a weekly Markdown plan that fits your focus patterns.
6. **Next Steps**: I'll give you clear tasks to start Focus Mode right now.

Speak directly to the student as their mentor and coach. Use "I" and "you" to create a partnership. Keep the tone encouraging, high-energy, and focused on growth.`,
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
