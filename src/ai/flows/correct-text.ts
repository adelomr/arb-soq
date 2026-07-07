// This is an AI flow to check and correct spelling and grammar in Arabic and English text.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectTextInputSchema = z.object({
  text: z.string().describe('The Arabic or English text to be checked and corrected.'),
});

export type CorrectTextInput = z.infer<typeof CorrectTextInputSchema>;

const CorrectTextOutputSchema = z.object({
  errors: z.array(
    z.object({
      word: z.string().describe('The exact substring in the input text that is incorrect.'),
      message: z.string().describe('A brief explanation of the spelling or grammar mistake in Arabic.'),
      replacements: z.array(z.string()).describe('An array of one or more correct spelling/grammar suggestions.'),
    })
  ).describe('List of detected spelling and grammar errors.'),
});

export type CorrectTextOutput = z.infer<typeof CorrectTextOutputSchema>;

export async function correctText(
  input: CorrectTextInput
): Promise<CorrectTextOutput> {
  return correctTextFlow(input);
}

const correctTextPrompt = ai.definePrompt({
  name: 'correctTextPrompt',
  input: {schema: CorrectTextInputSchema},
  output: {schema: CorrectTextOutputSchema},
  prompt: `You are an expert Arabic and English linguist and proofreader.
  Your task is to detect spelling, grammar, punctuation, and stylistic errors in the provided text (which may contain Arabic, English, or a mix of both).
  
  Instructions:
  1. Carefully read the input text: "{{text}}".
  2. Identify all errors in both languages:
     - For Arabic text: check for common typos (e.g., "اتمنا" -> "أتمنى", "هذة" -> "هذه"), Hamza placement errors (e.g., "الالكتروني" -> "الإلكتروني", "اريد" -> "أريد"), spacing errors (e.g., "انشاء الله" -> "إن شاء الله"), and grammar/spelling errors.
     - For English text: check for spelling mistakes, capitalization errors (e.g., starting sentences with lowercase), grammatical issues (e.g., subject-verb agreement), and punctuation.
  3. For each error found, provide:
     - "word": The EXACT substring in the input text that has the error. It must be a literal match from the input.
     - "message": A short, friendly explanation of the error WRITTEN IN ARABIC (even for English errors, e.g. "خطأ إملائي في الكلمة الإنجليزية" or "يجب بدء الجملة بحرف كبير Capital Letter").
     - "replacements": An array of correct suggestions (usually 1-3 options, with the best option first).
  4. Only include real errors. Do not flag correct words. If there are no errors, return an empty array for "errors".
  
  Output ONLY a JSON object that conforms to the schema. Do not include any other text.`,
});

const correctTextFlow = ai.defineFlow(
  {
    name: 'correctTextFlow',
    inputSchema: CorrectTextInputSchema,
    outputSchema: CorrectTextOutputSchema,
  },
  async input => {
    const {output} = await correctTextPrompt(input);
    return output!;
  }
);
