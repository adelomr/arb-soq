'use server';
/**
 * @fileOverview A Genkit tool for performing web searches.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

// Define the schema for a single search result
const SearchResultSchema = z.object({
  title: z.string().describe("The title of the search result."),
  url: z.string().url().describe("The URL of the search result."),
  content: z.string().describe("A snippet or summary of the content."),
});

export const searchWeb = ai.defineTool(
  {
    name: 'searchWeb',
    description: 'Performs a web search using a search engine to find information on a given topic.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.array(SearchResultSchema).describe('An array of search results.'),
  },
  async (input) => {
    const TAVILY_API_KEY = "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";

    if (!TAVILY_API_KEY) {
      throw new Error('Tavily API key is not set in environment variables.');
    }

    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_API_KEY,
        query: input.query,
        search_depth: 'advanced', // Use advanced for more detailed results
        include_answer: false, // We don't need the summarized answer, we want raw results
        max_results: 5,
      });

      if (response.data && response.data.results) {
         // Map the results to our defined schema
         return response.data.results.map((result: any) => ({
             title: result.title,
             url: result.url,
             content: result.content
         }));
      }

      return [];
    } catch (error: any) {
      console.error('Tavily search failed:', error.response?.data || error.message);
      // Return an empty array on failure
      return [];
    }
  }
);
