import { config } from 'dotenv';
config();

import '@/ai/flows/image-content-moderation.ts';
import '@/ai/flows/suggest-ad-content.ts';
import '@/ai/flows/semantic-search.ts';
