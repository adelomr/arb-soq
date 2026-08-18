
'use server';

import { moderateImageContent } from '@/ai/flows/image-content-moderation';
import { suggestAdContent } from '@/ai/flows/suggest-ad-content';
import { findRelevantAds } from '@/ai/flows/semantic-search';
import { correctText } from '@/ai/flows/correct-text';
import { firestore } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import axios from 'axios';
import { z } from 'zod';
import { incrementPageViews } from '@/lib/page-service';


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
  userId: z.string().optional(),
  planId: z.string().optional(),
});

export async function createPaymobPayment(input: z.infer<typeof PaymobPaymentInputSchema>) {
    const { amount_cents, email, first_name, last_name, phone_number, userId, planId } = PaymobPaymentInputSchema.parse(input);

    const { getPaymobSettings } = await import('@/lib/paymob-service');
    const settings = await getPaymobSettings();

    const PAYMOB_API_KEY = settings.apiKey;
    const INTEGRATION_ID = settings.integrationId;
    const IFRAME_ID = settings.iframeId;

    if (!settings.isEnabled) {
        return { success: false, error: "بوابة الدفع غير مفعلة حالياً." };
    }

    if (!PAYMOB_API_KEY || !INTEGRATION_ID || !IFRAME_ID || PAYMOB_API_KEY === "YOUR_PAYMOB_API_KEY") {
        console.error("Paymob settings are not configured properly.");
        return { success: false, error: "بوابة الدفع (Paymob) غير مهيأة بعد. يرجى من المسؤول ضبط المفاتيح في لوحة التحكم." };
    }

    try {
        const merchantOrderId = userId && planId ? `${userId}_${planId}_${Date.now()}` : undefined;
        let paymentToken = '';
        let orderId = '';

        if (PAYMOB_API_KEY.startsWith('egy_sk_')) {
            const paymentMethods: number[] = [];
            if (INTEGRATION_ID) paymentMethods.push(Number(INTEGRATION_ID));
            if (settings.walletIntegrationId) paymentMethods.push(Number(settings.walletIntegrationId));
            if (settings.kioskIntegrationId) paymentMethods.push(Number(settings.kioskIntegrationId));
            if (paymentMethods.length === 0 && INTEGRATION_ID) {
                paymentMethods.push(Number(INTEGRATION_ID));
            }

            const cleanPhone = (phone_number || '+201003975823').replace(/[^\d+]/g, '') || '+201003975823';
            const cleanEmail = (email && email.includes('@')) ? email : 'customer@arb-soq.com';

            const res = await axios.post('https://accept.paymob.com/v1/intention/', {
                amount: Number(amount_cents),
                currency: settings.currency || "EGP",
                payment_methods: paymentMethods,
                special_reference: merchantOrderId,
                items: planId ? [{
                    name: `Plan ${planId}`,
                    amount: Number(amount_cents),
                    description: `اشتراك في ${planId === 'gold' ? 'الباقة الذهبية' : 'الباقة المميزة'}`,
                    quantity: 1
                }] : [],
                billing_data: {
                    first_name: (first_name || "عميل").slice(0, 50),
                    last_name: (last_name || "سوق العرب").slice(0, 50),
                    phone_number: cleanPhone,
                    email: cleanEmail,
                }
            }, {
                headers: {
                    'Authorization': `Token ${PAYMOB_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const intentionData = res.data;
            orderId = String(intentionData.intention_order_id || intentionData.id || Date.now());
            paymentToken = intentionData.payment_keys?.[0]?.key || intentionData.client_secret;
        } else {
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
                currency: settings.currency || "EGP",
                merchant_order_id: merchantOrderId,
                items: planId ? [{
                    name: `Plan ${planId}`,
                    amount_cents: amount_cents,
                    description: `اشتراك في ${planId === 'gold' ? 'الباقة الذهبية' : 'الباقة المميزة'}`,
                    quantity: "1"
                }] : [],
            });
            orderId = String(order.data.id);

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
                    first_name: first_name || "عميل",
                    last_name: last_name || "سوق العرب",
                    street: "NA",
                    building: "NA",
                    phone_number: phone_number || "+201000000000",
                    shipping_method: "NA",
                    postal_code: "NA",
                    city: "Cairo",
                    country: "EGY",
                    state: "NA"
                },
                currency: settings.currency || "EGP",
                integration_id: Number(INTEGRATION_ID),
            });
            paymentToken = paymentKey.data.token;
        }

        // حفظ سجل الطلب في Firestore
        try {
            const { firestore } = await import('@/lib/firebase');
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(firestore, 'payments', String(orderId)), {
                orderId: String(orderId),
                userId: userId || null,
                planId: planId || null,
                amount_cents: amount_cents,
                currency: settings.currency || "EGP",
                status: 'pending',
                merchantOrderId: merchantOrderId || null,
                createdAt: new Date().toISOString(),
            });
        } catch (dbErr) {
            console.warn("Could not record payment order in Firestore:", dbErr);
        }

        const redirectUrl = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`;
        return { success: true, url: redirectUrl, orderId };

    } catch (error: any) {
        console.error("Paymob Error:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || "حدث خطأ في إنشاء جلسة الدفع في Paymob." };
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

import { revalidatePath } from 'next/cache';

export async function handleIncrementPageViews(id: string) {
    try {
        await incrementPageViews(id);
        return { success: true };
    } catch (error) {
        console.error('Error in handleIncrementPageViews:', error);
        return { success: false, error: 'Failed to increment page views' };
    }
}

export async function handleRevalidatePage(slug?: string) {
    try {
        if (slug) {
            revalidatePath(`/p/${slug}`);
        }
        revalidatePath('/p/[slug]', 'page');
        revalidatePath('/landing-sections');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error revalidating page cache:', error);
        return { success: false, error: 'فشل إخلاء ذاكرة التخزين المؤقت' };
    }
}

