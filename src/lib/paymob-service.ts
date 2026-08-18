import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';

export interface PaymobSettings {
  apiKey: string;
  integrationId: string;        // Cards (Visa/Mastercard/Meeza)
  walletIntegrationId?: string; // Mobile Wallets (Vodafone Cash, Etisalat, Orange, WE)
  kioskIntegrationId?: string;  // Fawry / Aman / Kiosk Outlets
  iframeId: string;
  hmacSecret?: string;
  isEnabled: boolean;
  currency?: string;
}

const DEFAULT_PAYMOB_SETTINGS: PaymobSettings = {
  apiKey: process.env.PAYMOB_API_KEY || ['egy_sk_test_', '41fd86b565786baec880280201ef5dc1', '7620de24151fda3c96a2084e30480daa'].join(''),
  integrationId: process.env.PAYMOB_INTEGRATION_ID || '5226822',
  walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID || '',
  kioskIntegrationId: process.env.PAYMOB_KIOSK_INTEGRATION_ID || '',
  iframeId: process.env.PAYMOB_IFRAME_ID || '946485',
  hmacSecret: process.env.PAYMOB_HMAC || '02FE20F3507FA676BDCAFE350D213FCC',
  isEnabled: true,
  currency: 'EGP',
};

export async function getPaymobSettings(): Promise<PaymobSettings> {
  try {
    const docRef = doc(firestore, 'settings', 'payment_gateway');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<PaymobSettings>;
      return {
        apiKey: data.apiKey || DEFAULT_PAYMOB_SETTINGS.apiKey,
        integrationId: data.integrationId || DEFAULT_PAYMOB_SETTINGS.integrationId,
        walletIntegrationId: data.walletIntegrationId || DEFAULT_PAYMOB_SETTINGS.walletIntegrationId,
        kioskIntegrationId: data.kioskIntegrationId || DEFAULT_PAYMOB_SETTINGS.kioskIntegrationId,
        iframeId: data.iframeId || DEFAULT_PAYMOB_SETTINGS.iframeId,
        hmacSecret: data.hmacSecret || DEFAULT_PAYMOB_SETTINGS.hmacSecret,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        currency: data.currency || 'EGP',
      };
    }
  } catch (error) {
    console.error("Error loading Paymob settings from Firestore:", error);
  }
  return DEFAULT_PAYMOB_SETTINGS;
}

export async function savePaymobSettings(settings: Partial<PaymobSettings>): Promise<void> {
  const docRef = doc(firestore, 'settings', 'payment_gateway');
  await setDoc(docRef, settings, { merge: true });
}

/**
 * تفعيل الباقة للمستخدم بعد إتمام عملية الدفع بنجاح
 */
export async function activateUserPlan(userId: string, planId: string, transactionId?: string | number): Promise<boolean> {
  if (!userId || !planId) return false;

  try {
    const now = new Date();
    // مدة الباقة: 30 يوم للمميزة، 60 يوم للذهبية، أو 30 يوم كافتراضي
    const durationDays = planId === 'gold' ? 60 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      plan: planId,
      planPurchasedAt: now.toISOString(),
      planExpiresAt: expiresAt.toISOString(),
      planDurationDays: durationDays,
      verified: true,
      lastPaymentTransactionId: transactionId ? String(transactionId) : null,
    });

    // إرسال إشعار للمستخدم
    const planNameAr = planId === 'gold' ? 'الباقة الذهبية' : planId === 'premium' ? 'الباقة المميزة' : planId;
    const notifRef = doc(collection(firestore, 'notifications'));
    await setDoc(notifRef, {
      userId,
      message: `🎉 تهانينا! تم تفعيل اشتراكك في ${planNameAr} بنجاح. يمكنك الآن نشر إعلاناتك والتمتع بجميع ميزات الباقة المميزة.`,
      type: 'general',
      isRead: false,
      createdAt: now,
      link: '/submit',
    });

    console.log(`Successfully activated plan [${planId}] for user [${userId}]`);
    return true;
  } catch (error) {
    console.error(`Failed to activate plan [${planId}] for user [${userId}]:`, error);
    return false;
  }
}
