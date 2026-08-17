import { NextRequest, NextResponse } from 'next/server';
import { activateUserPlan } from '@/lib/paymob-service';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const success = searchParams.get('success');
  const isSuccess = success === 'true' || success === '1';
  const orderId = searchParams.get('order') || searchParams.get('order_id');
  const transactionId = searchParams.get('id') || searchParams.get('txn_response_code');
  const merchantOrderId = searchParams.get('merchant_order_id');

  console.log(`[Paymob Callback] Success: ${success}, Order: ${orderId}, Txn: ${transactionId}, MerchantOrder: ${merchantOrderId}`);

  let userId: string | null = null;
  let planId: string | null = null;
  let adId: string | null = null;
  let isDirectAdBoost = false;

  // فحص ما إذا كان الطلب ترقية مباشرة لإعلان: BOOST_{adId}_{userId}_{planId}_{timestamp}
  if (merchantOrderId && merchantOrderId.startsWith('BOOST_')) {
    const parts = merchantOrderId.split('_');
    if (parts.length >= 4) {
      isDirectAdBoost = true;
      adId = parts[1];
      userId = parts[2];
      planId = parts[3];
    }
  } else if (merchantOrderId) {
    const parts = merchantOrderId.split('_');
    if (parts.length >= 3) {
      userId = parts[0];
      planId = parts[1];
    }
  }

  // إذا لم نجدها، نبحث في سجل الطلبات في Firestore
  if ((!userId || !planId) && orderId) {
    try {
      const paymentDoc = await getDoc(doc(firestore, 'payments', String(orderId)));
      if (paymentDoc.exists()) {
        const pData = paymentDoc.data();
        userId = pData.userId;
        planId = pData.planId;
        adId = pData.adId || null;
        if (adId) isDirectAdBoost = true;
      }
    } catch (e) {
      console.error("Error looking up payment doc:", e);
    }
  }

  const baseUrl = request.nextUrl.origin || 'https://www.arb-soq.com';

  if (isSuccess && isDirectAdBoost && adId) {
    try {
      const now = new Date();
      const durationDays = planId === 'gold' ? 30 : 7;
      const featuredUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const adRef = doc(firestore, 'ads', adId);
      const adSnap = await getDoc(adRef);
      if (adSnap.exists()) {
        const adData = adSnap.data();
        await updateDoc(adRef, {
          isFeatured: true,
          featuredTier: planId,
          featuredAt: now.toISOString(),
          featuredUntil: featuredUntil.toISOString(),
          updatedAt: now.toISOString(),
        });

        // إذا كانت الباقة ذهبية، تشغيل تحسين الذكاء الاصطناعي
        if (planId === 'gold') {
          import('@/lib/ai-enhancer').then(({ optimizeAdWithAI }) => {
            optimizeAdWithAI(adId!, adData.title || '', adData.description || '').catch(console.error);
          });
        }
      }

      if (orderId) {
        try {
          await updateDoc(doc(firestore, 'payments', String(orderId)), {
            status: 'completed',
            transactionId: transactionId || null,
            completedAt: now.toISOString(),
          });
        } catch {}
      }

      const redirectPath = userId ? `/ad/${userId}/${adId}?boost=success&tier=${planId}` : `/submit?boost=success`;
      return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    } catch (err) {
      console.error("Failed to boost ad on callback:", err);
      return NextResponse.redirect(`${baseUrl}/ad/${userId || ''}/${adId}?boost=success`);
    }
  } else if (isSuccess && userId && planId) {
    try {
      // تفعيل الباقة للمستخدم وتحديث حسابه
      await activateUserPlan(userId, planId, transactionId || orderId || undefined);

      // تحديث حالة الطلب
      if (orderId) {
        try {
          await updateDoc(doc(firestore, 'payments', String(orderId)), {
            status: 'completed',
            transactionId: transactionId || null,
            completedAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Could not update payment doc status:", dbErr);
        }
      }

      return NextResponse.redirect(`${baseUrl}/pricing?payment=success&plan=${planId}`);
    } catch (actErr) {
      console.error("Failed to activate user plan on callback:", actErr);
      return NextResponse.redirect(`${baseUrl}/pricing?payment=success&plan=${planId}&pending=true`);
    }
  } else if (isSuccess) {
    return NextResponse.redirect(`${baseUrl}/pricing?payment=success`);
  } else {
    return NextResponse.redirect(`${baseUrl}/pricing?payment=failed`);
  }
}

export async function POST(request: NextRequest) {
  // بعض عمليات Paymob ترسل استجابة POST إلى رابط التوجيه
  return GET(request);
}
