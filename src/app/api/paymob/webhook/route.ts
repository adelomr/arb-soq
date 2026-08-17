import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { activateUserPlan, getPaymobSettings } from '@/lib/paymob-service';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';

function verifyPaymobHMAC(obj: any, receivedHmac: string, hmacSecret: string): boolean {
  if (!hmacSecret) return true;
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id || obj.order,
    obj.owner,
    obj.pending,
    obj.source_data?.pan || '',
    obj.source_data?.sub_type || '',
    obj.source_data?.type || '',
    obj.success
  ];

  const concatenatedString = fields.join('');
  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedString)
    .digest('hex');

  return calculatedHmac.toLowerCase() === receivedHmac.toLowerCase();
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryHmac = url.searchParams.get('hmac') || request.headers.get('x-paymob-hmac');
    const body = await request.json();
    console.log("[Paymob Webhook] Received event:", JSON.stringify(body).slice(0, 300));

    const obj = body.obj || body;
    const settings = await getPaymobSettings();

    // فحص HMAC
    if (settings.hmacSecret && queryHmac) {
      const isValid = verifyPaymobHMAC(obj, queryHmac, settings.hmacSecret);
      if (!isValid) {
        console.error('[Paymob Webhook] Security Alert: Invalid HMAC Signature');
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const isSuccess = obj.success === true || obj.success === "true";
    const orderId = String(obj.order?.id || obj.order_id || obj.order);
    const transactionId = String(obj.id);
    const merchantOrderId = String(obj.order?.merchant_order_id || obj.merchant_order_id || '');

    if (!isSuccess) {
      console.log(`[Paymob Webhook] Transaction failed for order ${orderId}`);
      if (orderId) {
        try {
          await updateDoc(doc(firestore, 'payments', String(orderId)), {
            status: 'failed',
            transactionId,
            updatedAt: new Date().toISOString(),
          });
        } catch {}
      }
      return NextResponse.json({ success: true, message: 'Failure acknowledged' });
    }

    let userId: string | null = null;
    let planId: string | null = null;
    let adId: string | null = null;
    let isDirectAdBoost = false;

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

    if ((!userId || !planId) && orderId) {
      const paymentDoc = await getDoc(doc(firestore, 'payments', String(orderId)));
      if (paymentDoc.exists()) {
        const pData = paymentDoc.data();
        userId = pData.userId;
        planId = pData.planId;
        adId = pData.adId || null;
        if (adId) isDirectAdBoost = true;
      }
    }

    // ترقية إعلان محدد
    if (isDirectAdBoost && adId) {
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
        if (planId === 'gold' && !adData.aiEnhanced) {
          import('@/lib/ai-enhancer').then(({ optimizeAdWithAI }) => {
            optimizeAdWithAI(adId!, adData.title || '', adData.description || '').catch(console.error);
          });
        }

        // إشعار المستخدم
        if (userId) {
          await setDoc(doc(collection(firestore, 'notifications')), {
            userId,
            title: 'تم تمييز إعلانك بنجاح! 🚀',
            message: `تهانينا! أصبح إعلانك "${adData.title}" مميزاً ضمن (${planId === 'gold' ? 'الباقة الذهبية لمدة 30 يوماً' : 'الباقة الفضية لمدة 7 أيام'}).`,
            link: `/ad/${userId}/${adId}`,
            isRead: false,
            createdAt: now,
          });
        }
      }
    } else if (userId && planId) {
      // اشتراك باقة حساب عامة
      console.log(`[Paymob Webhook] Activating plan ${planId} for user ${userId}`);
      await activateUserPlan(userId, planId, transactionId);
    }

    if (orderId) {
      try {
        await updateDoc(doc(firestore, 'payments', String(orderId)), {
          status: 'completed',
          transactionId,
          completedAt: new Date().toISOString(),
          hmacVerified: true,
        });
      } catch (dbErr) {
        console.warn("Could not update payment doc status in webhook:", dbErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Processed successfully' });
  } catch (error: any) {
    console.error("[Paymob Webhook] Error processing webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
