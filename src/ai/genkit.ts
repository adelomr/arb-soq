if (typeof process !== 'undefined' && process.env) {
  process.env.GENKIT_TELEMETRY_DISABLED = 'true';
  process.env.OTEL_SDK_DISABLED = 'true';
}

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
});
