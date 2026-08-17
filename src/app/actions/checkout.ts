'use server';

import axios from 'axios';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getPaymobSettings } from '@/lib/paymob-service';

const CreateDirectBoostSchema = z.object({
  adId: z.string(),
  userId: z.string(),
  planId: z.enum(['silver', 'gold']),
  country: z.string().default('eg'),
  userEmail: z.string().email(),
  userName: z.string(),
  userPhone: z.string().optional(),
});

// مصفوفة الأسعار والعملات للدول المختلفة
export const PLAN_PRICES: Record<'silver' | 'gold', Record<string, { amountCents: number; displayPrice: string; currency: string; durationDays: number }>> = {
  silver: {
    eg: { amountCents: 25000, displayPrice: '250', currency: 'EGP', durationDays: 7 },
    sa: { amountCents: 2000, displayPrice: '20', currency: 'SAR', durationDays: 7 },
    ae: { amountCents: 2000, displayPrice: '20', currency: 'AED', durationDays: 7 },
    kw: { amountCents: 200, displayPrice: '2', currency: 'KWD', durationDays: 7 },
    default: { amountCents: 500, displayPrice: '5', currency: 'USD', durationDays: 7 }
  },
  gold: {
    eg: { amountCents: 75000, displayPrice: '750', currency: 'EGP', durationDays: 30 },
    sa: { amountCents: 6000, displayPrice: '60', currency: 'SAR', durationDays: 30 },
    ae: { amountCents: 6000, displayPrice: '60', currency: 'AED', durationDays: 30 },
    kw: { amountCents: 500, displayPrice: '5', currency: 'KWD', durationDays: 30 },
    default: { amountCents: 1500, displayPrice: '15', currency: 'USD', durationDays: 30 }
  }
};

export async function createDirectBoostSession(input: z.infer<typeof CreateDirectBoostSchema>) {
  const data = CreateDirectBoostSchema.parse(input);
  const settings = await getPaymobSettings();

  if (!settings.isEnabled || !settings.apiKey || !settings.integrationId || !settings.iframeId) {
    return { 
      success: false, 
      error: 'بوابة الدفع غير مهيأة حالياً. يرجى إدخال مفاتيح Paymob في لوحة التحكم.' 
    };
  }

  const countryKey = (data.country || 'eg').toLowerCase();
  const pricing = PLAN_PRICES[data.planId][countryKey] || PLAN_PRICES[data.planId]['default'];
  const amountCents = Number(pricing.amountCents);
  const currency = pricing.currency;
  const merchantOrderId = `BOOST_${data.adId}_${data.userId}_${data.planId}_${Date.now()}`;

  const nameParts = data.userName.trim().split(' ');
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'ArbSoq';
  const phone = data.userPhone || '+201000000000';

  try {
    let paymentToken = '';
    let orderId = '';

    // إذا كان المفتاح هو المفتاح الموحد الجديد (egy_sk_...) نستخدم Intention API
    if (settings.apiKey.startsWith('egy_sk_')) {
      const paymentMethods: number[] = [];
      if (settings.integrationId) paymentMethods.push(Number(settings.integrationId));
      if (settings.walletIntegrationId) paymentMethods.push(Number(settings.walletIntegrationId));
      if (settings.kioskIntegrationId) paymentMethods.push(Number(settings.kioskIntegrationId));
      if (paymentMethods.length === 0 && settings.integrationId) {
        paymentMethods.push(Number(settings.integrationId));
      }

      const res = await axios.post('https://accept.paymob.com/v1/intention/', {
        amount: amountCents,
        currency: currency,
        payment_methods: paymentMethods,
        special_reference: merchantOrderId,
        items: [{
          name: `Boost ${data.planId.toUpperCase()} for Ad #${data.adId}`,
          amount: amountCents,
          description: `ترقية إعلان إلى ${data.planId === 'gold' ? 'الباقة الذهبية (30 يوماً)' : 'الباقة الفضية (7 أيام)'}`,
          quantity: 1
        }],
        billing_data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          email: data.userEmail,
        }
      }, {
        headers: {
          'Authorization': `Token ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const intentionData = res.data;
      orderId = String(intentionData.intention_order_id || intentionData.id || Date.now());
      paymentToken = intentionData.payment_keys?.[0]?.key || intentionData.client_secret;
    } else {
      // الطريقة التقليدية (Auth Token Flow)
      const authRes = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: settings.apiKey,
      });
      const authToken = authRes.data.token;

      const orderRes = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: String(amountCents),
        currency: currency,
        merchant_order_id: merchantOrderId,
        items: [{
          name: `Boost ${data.planId.toUpperCase()} for Ad #${data.adId}`,
          amount_cents: String(amountCents),
          description: `ترقية إعلان إلى ${data.planId === 'gold' ? 'الباقة الذهبية' : 'الباقة الفضية'}`,
          quantity: '1'
        }]
      });
      orderId = String(orderRes.data.id);

      const paymentKeyRes = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
        auth_token: authToken,
        amount_cents: String(amountCents),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA', email: data.userEmail, floor: 'NA', first_name: firstName,
          last_name: lastName, street: 'NA', building: 'NA', phone_number: phone,
          shipping_method: 'NA', postal_code: 'NA', city: 'Cairo', country: countryKey === 'eg' ? 'EGY' : countryKey.toUpperCase(), state: 'NA'
        },
        currency: currency,
        integration_id: Number(settings.integrationId),
      });
      paymentToken = paymentKeyRes.data.token;
    }

    // حفظ سجل المعاملة في Firestore
    await setDoc(doc(firestore, 'payments', orderId), {
      orderId,
      merchantOrderId,
      adId: data.adId,
      userId: data.userId,
      planId: data.planId,
      amountCents: amountCents,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${settings.iframeId}?payment_token=${paymentToken}`;
    return { success: true, url: checkoutUrl, orderId };
  } catch (err: any) {
    console.error('Paymob Session Error:', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.message || 'تعذر إنشاء جلسة الدفع في Paymob.' };
  }
}
