'use server';
/**
 * @fileOverview A Genkit flow for analyzing student assignments based on standard or custom rubrics.
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
    feedback: z.string().describe('Detailed feedback for this specific criterion.'),
  })),
  overallFeedback: z.string().describe('General overview of the assignment quality.'),
  strengths: z.array(z.string()).describe('Key strengths of the work.'),
  areasForImprovement: z.array(z.string()).describe('Specific parts that need more work.'),
  suggestedRevisionSteps: z.array(z.string()).describe('Step-by-step plan to improve the grade.'),
});

export type AssignmentAnalysisOutput = z.infer<typeof AssignmentAnalysisOutputSchema>;

const assignmentAnalysisPrompt = ai.definePrompt({
  name: 'assignmentAnalysisPrompt',
  input: { schema: AssignmentAnalysisInputSchema },
  output: { schema: AssignmentAnalysisOutputSchema },
  prompt: `You are an expert academic evaluator. Analyze the following assignment based on the provided rubric. If no rubric is provided, use standard academic criteria for the subject (e.g., clarity, argument strength, evidence, structure, grammar).

**Subject:** {{{subject}}}
**Rubric/Criteria:** {{#if rubric}}{{{rubric}}}{{else}}Standard Academic Quality{{/if}}

**Assignment Text:**
{{{assignmentText}}}

**Instructions:**
1. Evaluate the assignment objectively against each rubric criterion.
2. Provide a score from 1-5 for each (1: Poor, 5: Excellent).
3. Be specific and constructive in your feedback.
4. Identify 2-3 key strengths and 2-3 specific areas for improvement.
5. Provide a step-by-step revision plan.

Maintain a professional, academic, yet encouraging tone.`,
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
