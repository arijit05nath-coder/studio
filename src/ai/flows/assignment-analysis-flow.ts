'use server';
/**
 * @fileOverview A Genkit flow for analyzing student assignments with a conversational mentor persona.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssignmentAnalysisInputSchema = z.object({
  assignmentText: z.string().describe('The content of the assignment to be analyzed.'),
  rubric: z.string().optional().describe('Specific rubric criteria provided by the teacher or student.'),
  subject: z.string().describe('The subject of the assignment.'),
});

export type AssignmentAnalysisInput = z.infer<typeof AssignmentAnalysisInputSchema>;

const AssignmentAnalysisOutputSchema = z.object({
  rubricScores: z.array(z.object({
    criterion: z.string().describe('The rubric criterion name.'),
    score: z.number().describe('Score from 1 to 5.'),
    feedback: z.string().describe('Detailed feedback for this specific criterion, spoken directly to the student.'),
  })),
  overallFeedback: z.string().describe('My general thoughts on your work, spoken directly to you.'),
  strengths: z.array(z.string()).describe('What I think you did exceptionally well.'),
  areasForImprovement: z.array(z.string()).describe('Where I think we can push your work further.'),
  suggestedRevisionSteps: z.array(z.string()).describe('My step-by-step roadmap for you to improve this assignment.'),
});

export type AssignmentAnalysisOutput = z.infer<typeof AssignmentAnalysisOutputSchema>;

const assignmentAnalysisPrompt = ai.definePrompt({
  name: 'assignmentAnalysisPrompt',
  input: { schema: AssignmentAnalysisInputSchema },
  output: { schema: AssignmentAnalysisOutputSchema },
  prompt: `I am your AI Study Mentor. I've taken a close look at the work you've shared for {{{subject}}}. 

I'm evaluating your progress based on: {{#if rubric}}{{{rubric}}}{{else}}Standard Academic Excellence{{/if}}.

Here is the work you've submitted:
{{{assignmentText}}}

**My Mentor Instructions:**
1. I will evaluate your work against each criterion.
2. I'll give you a score from 1-5 (1: We need more focus here, 5: You've mastered this!).
3. I'll speak directly to you in my feedback—no third-person academic jargon.
4. I'll highlight your biggest wins and where I see your next growth opportunity.
5. I'll lay out a clear, actionable revision roadmap just for you.

Speak directly to the student. Use a supportive, conversational, and mentorship-oriented tone. Use "I" when referring to myself and "you" when referring to the student. My goal is to make you feel empowered to improve.`,
});

const assignmentAnalysisFlow = ai.defineFlow(
  {
    name: 'assignmentAnalysisFlow',
    inputSchema: AssignmentAnalysisInputSchema,
    outputSchema: AssignmentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await assignmentAnalysisPrompt(input);
    return output!;
  }
);

export async function analyzeAssignment(input: AssignmentAnalysisInput): Promise<AssignmentAnalysisOutput> {
  return assignmentAnalysisFlow(input);
}
