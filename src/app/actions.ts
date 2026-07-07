
'use server';

import { moderateImageContent } from '@/ai/flows/image-content-moderation';
import { suggestAdContent } from '@/ai/flows/suggest-ad-content';
import { findRelevantAds } from '@/ai/flows/semantic-search';
import { correctText } from '@/ai/flows/correct-text';
import { firestore } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import axios from 'axios';
import { z } from 'zod';


const DataUriSchema = z.string().refine(val => val.startsWith('data:image/'), {
  message: 'Must be a data URI for an image.',
});

const AdSuggestionInputSchema = z.object({
    photoDataUri: DataUriSchema,
    category: z.string(),
});

export async function handleImageModeration(imageDataUri: string) {
  try {
    const validatedDataUri = DataUriSchema.parse(imageDataUri);
    const result = await moderateImageContent({ photoDataUri: validatedDataUri });
    return { success: true, data: result };
  } catch (error) {
    console.error('Image moderation failed:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: 'تنسيق بيانات الصورة غير صالح.' };
    }
    return { success: false, error: 'حدث خطأ غير متوقع أثناء الإشراف.' };
  }
}

export async function handleAdSuggestion(input: { photoDataUri: string; category: string }) {
    try {
        const validatedInput = AdSuggestionInputSchema.parse({ ...input });
        const result = await suggestAdContent({ ...validatedInput, language: 'ar' });
        return { success: true, data: result };
    } catch (error) {
        console.error('Ad suggestion failed:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'مدخلات غير صالحة لاقتراح الإعلان.' };
        }
        return { success: false, error: 'حدث خطأ غير متوقع أثناء إنشاء الاقتراحات.' };
    }
}

const PaymobPaymentInputSchema = z.object({
  amount_cents: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
});

export async function createPaymobPayment(input: z.infer<typeof PaymobPaymentInputSchema>) {
    const { amount_cents, email, first_name, last_name, phone_number } = PaymobPaymentInputSchema.parse(input);

    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
    const IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

    if (!PAYMOB_API_KEY || !INTEGRATION_ID || !IFRAME_ID || PAYMOB_API_KEY === "YOUR_PAYMOB_API_KEY") {
        console.error("Paymob environment variables are not set or are default.");
        return { success: false, error: "بوابة الدفع غير مهيأة بشكل صحيح." };
    }

    try {
        // 1. Authentication
        const auth = await axios.post("https://accept.paymob.com/api/auth/tokens", {
            api_key: PAYMOB_API_KEY,
        });
        const authToken = auth.data.token;

        // 2. Create Order
        const order = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amount_cents,
            currency: "EGP", // This should be dynamic based on market later
            items: [],
        });
        const orderId = order.data.id;

        // 3. Create Payment Key
        const paymentKey = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
            auth_token: authToken,
            amount_cents: amount_cents,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                apartment: "NA",
                email: email,
                floor: "NA",
                first_name: first_name,
                last_name: last_name,
                street: "NA",
                building: "NA",
                phone_number: phone_number,
                shipping_method: "NA",
                postal_code: "NA",
                city: "NA",
                country: "NA",
                state: "NA"
            },
            currency: "EGP",
            integration_id: Number(INTEGRATION_ID),
        });

        const paymentToken = paymentKey.data.token;
        const redirectUrl = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`;

        return { success: true, url: redirectUrl };

    } catch (error: any) {
        console.error("Paymob Error:", error.response?.data || error.message);
        return { success: false, error: "خطأ في إنشاء عملية الدفع" };
    }
}

export async function fetchYouTubePlaylistItems(playlistUrl: string) {
    const playlistIdMatch = playlistUrl.match(/[&?]list=([^&]+)/);
    if (!playlistIdMatch) {
        return { success: false, error: "رابط قائمة تشغيل غير صالح." };
    }
    const playlistId = playlistIdMatch[1];

    try {
        // Warning: This is a best-effort approach without a dedicated API key.
        // For production, a Google Cloud Project with YouTube Data API v3 is recommended.
        const response = await axios.get(`https://www.youtube.com/playlist?list=${playlistId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = response.data;
        // Search for videoIds in the page source (ytInitialData)
        const videoIds = [...new Set([...html.matchAll(/"videoId":"([^"]+)"/g)].map(m => m[1]))];
        
        if (videoIds.length === 0) {
            return { success: false, error: "لم يتم العثور على فيديوهات في القائمة." };
        }

        // Limit to first 20 for safety/performance
        return { success: true, videos: videoIds.slice(0, 20) };
    } catch (error) {
        console.error("YouTube parse error:", error);
        return { success: false, error: "فشل جلب فيديوهات قائمة التشغيل." };
    }
}

export async function handleTextCorrection(text: string) {
    try {
        const result = await correctText({ text });
        return { success: true, data: result.errors };
    } catch (error) {
        console.error('Text correction failed:', error);
        return { success: false, error: 'حدث خطأ أثناء تصحيح النص من جوجل.' };
    }
}
