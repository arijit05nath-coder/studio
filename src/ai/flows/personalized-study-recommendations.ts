'use server';
/**
 * @fileOverview A Genkit flow for generating personalized study recommendations for students.
 *
 * - personalizedStudyRecommendations - A function that provides study recommendations.
 * - PersonalizedStudyRecommendationsInput - The input type for the function.
 * - PersonalizedStudyRecommendationsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedStudyRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the student.'),
  completedSessions: z.array(
    z.object({
      sessionId: z.string().describe('Unique ID for the study session.'),
      topic: z.string().describe('The topic covered in the study session.'),
      durationMinutes: z.number().describe('Duration of the session in minutes.'),
      focusScore: z.number().min(1).max(5).describe('Focus level during the session (1-5).'),
      notesTaken: z.boolean().describe('Whether notes were taken during the session.'),
      quizScore: z.number().nullable().describe('Score on a quiz taken after the session, if any.'),
    })
  ).describe('A list of completed study sessions.'),
  performanceSummary: z.object({
    overallGrade: z.string().describe('Overall academic performance grade.'),
    weakTopics: z.array(z.string()).describe('Topics where the student has shown weakness.'),
    strongTopics: z.array(z.string()).describe('Topics where the student has performed well.'),
    recentQuizScores: z.array(z.object({ topic: z.string(), score: z.number() })).describe('Recent quiz scores for various topics.'),
  }).describe('A summary of the student\u0027s academic performance.'),
  userPreferences: z.object({
    learningStyle: z.string().nullable().describe('The student\u0027s preferred learning style (e.g., visual, auditory).'),
    preferredStudyTimes: z.string().nullable().describe('Preferred times of day for studying.'),
    goals: z.string().nullable().describe('The student\u0027s academic goals.'),
  }).describe('Student\u0027s personal study preferences and goals.').optional(),
});

export type PersonalizedStudyRecommendationsInput = z.infer<typeof PersonalizedStudyRecommendationsInputSchema>;

const PersonalizedStudyRecommendationsOutputSchema = z.object({
  personalizedRecommendations: z.array(
    z.object({
      topic: z.string().describe('The specific topic recommended for study.'),
      reasoning: z.string().describe('The reason why this topic is recommended based on performance data.'),
      suggestedApproach: z.string().describe('Specific study methods or resources suggested for this topic.'),
      priorityLevel: z.enum(['High', 'Medium', 'Low']).describe('The priority level for this recommendation.'),
      nextSteps: z.array(z.string()).describe('Actionable steps the student can take.'),
    })
  ).describe('A list of personalized study recommendations.'),
});

export type PersonalizedStudyRecommendationsOutput = z.infer<typeof PersonalizedStudyRecommendationsOutputSchema>;

export async function personalizedStudyRecommendations(input: PersonalizedStudyRecommendationsInput): Promise<PersonalizedStudyRecommendationsOutput> {
  return personalizedStudyRecommendationsFlow(input);
}

const personalizedStudyRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedStudyRecommendationsPrompt',
  input: { schema: PersonalizedStudyRecommendationsInputSchema },
  output: { schema: PersonalizedStudyRecommendationsOutputSchema },
  prompt: `You are an AI-powered study coach for a student using the FocusFlow app. Your goal is to analyze the student's past study sessions and performance data to provide personalized, actionable recommendations for optimizing their learning.

Here is the student's data:

**Completed Study Sessions:**
{{#if completedSessions}}
{{#each completedSessions}}
- Session ID: {{{sessionId}}}
  Topic: {{{topic}}}
  Duration: {{{durationMinutes}}} minutes
  Focus Score: {{{focusScore}}} (1-5)
  Notes Taken: {{{notesTaken}}}
  Quiz Score: {{{quizScore}}}
{{/each}}
{{else}}
No completed sessions data available.
{{/if}}

**Performance Summary:**
{{#if performanceSummary}}
  Overall Grade: {{{performanceSummary.overallGrade}}}
  Weak Topics: {{#each performanceSummary.weakTopics}}- {{{this}}}
{{/each}}
  Strong Topics: {{#each performanceSummary.strongTopics}}- {{{this}}}
{{/each}}
  Recent Quiz Scores:
  {{#each performanceSummary.recentQuizScores}}
    - Topic: {{{topic}}}, Score: {{{score}}}
  {{/each}}
{{else}}
No performance summary data available.
{{/if}}

**Student Preferences:**
{{#if userPreferences}}
  Learning Style: {{{userPreferences.learningStyle}}}
  Preferred Study Times: {{{userPreferences.preferredStudyTimes}}}
  Goals: {{{userPreferences.goals}}}
{{else}}
No user preferences available.
{{/if}}

Based on this information, provide up to 3 personalized study recommendations. For each recommendation, identify the `topic`, explain the `reasoning` behind your choice, suggest a `suggestedApproach` considering their learning style and goals, assign a `priorityLevel` (High, Medium, or Low), and list concrete `nextSteps` they can take. Ensure your recommendations are specific and directly address potential areas for improvement or reinforcement.`,
});

const personalizedStudyRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedStudyRecommendationsFlow',
    inputSchema: PersonalizedStudyRecommendationsInputSchema,
    outputSchema: PersonalizedStudyRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedStudyRecommendationsPrompt(input);
    return output!;
  }
);
