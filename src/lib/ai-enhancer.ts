import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const OptimizeAdInputSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const OptimizeAdOutputSchema = z.object({
  optimizedTitle: z.string().describe('عنوان احترافي جذاب لا يتجاوز 50 حرفاً'),
  optimizedDescription: z.string().describe('وصف تسويقي منسق ومقنع بنقاط واضحة'),
});

const optimizeAdPrompt = ai.definePrompt({
  name: 'optimizeAdPrompt',
  input: { schema: OptimizeAdInputSchema },
  output: { schema: OptimizeAdOutputSchema },
  prompt: `أنت خبير تسويق إلكتروني وكتابة إعلانات تجارية لمنصة الإعلانات المبوبة "سوق العرب".
المطلوب: تحسين عنوان ووصف الإعلان التالي لجعله احترافياً وجذاباً ومحفزاً للمشترين مع تحسين محركات البحث (SEO).

العنوان الأصلي: "{{title}}"
الوصف الأصلي: "{{description}}"

التعليمات:
1. العنوان: جذاب ومختصر ومباشر بدون كلمات حشو (أقل من 50 حرفاً).
2. الوصف: منسق في نقاط واضحة ومقنعة تبرز أهم المزايا والمواصفات وحالة العنصر.
3. اللغة: عربية فصيحة ومفهومة تناسب جميع الدول العربية.`,
});

export async function optimizeAdWithAI(adId: string, currentTitle: string, currentDescription: string) {
  try {
    const { output } = await optimizeAdPrompt({
      title: currentTitle,
      description: currentDescription,
    });

    if (output && output.optimizedTitle && output.optimizedDescription) {
      const topLevelRef = doc(firestore, 'ads', adId);
      const snap = await getDoc(topLevelRef);
      
      let targetDocRef = topLevelRef;
      if (!snap.exists()) {
        // If not in top-level, check if user ads
        return;
      }

      await updateDoc(targetDocRef, {
        title: output.optimizedTitle,
        description: output.optimizedDescription,
        originalTitle: currentTitle,
        originalDescription: currentDescription,
        aiEnhanced: true,
        aiEnhancedAt: new Date().toISOString(),
      });

      console.log(`[AI Optimization] Successfully enhanced Ad #${adId}`);
      return { success: true, ...output };
    }
  } catch (error) {
    console.error(`[AI Optimization Failed] for Ad #${adId}:`, error);
    return { success: false, error };
  }
}
