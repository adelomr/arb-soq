import { firestore } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { activateUserPlan } from './paymob-service';

// ─── رقم فودافون كاش الثابت الخاص بالمشروع ───
export const VODAFONE_CASH_NUMBER = '01003975823';
export const ADMIN_WHATSAPP = '201127556848'; // بصيغة دولية بدون +

// ─── أنواع البيانات ────────────────────────────
export type VodafoneCashStatus = 'pending' | 'approved' | 'rejected';

export interface VodafoneCashPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  transferPhone: string;     // رقم هاتف المُحوِّل
  transactionRef: string;    // رقم مرجع عملية التحويل من رسالة فودافون
  amount: number;            // المبلغ بالجنيه
  currency: string;          // EGP
  planId: 'premium' | 'gold';
  planName: string;          // اسم الباقة بالعربية
  receiptUrl?: string;       // رابط صورة إيصال التحويل
  status: VodafoneCashStatus;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;       // اسم الأدمن الذي راجع الطلب
  rejectionNote?: string;    // سبب الرفض
}

const COLLECTION = 'vodafone_payments';

// ─── 1. إرسال طلب دفع جديد ────────────────────
export async function submitVodafoneCashPayment(
  payment: Omit<VodafoneCashPayment, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(firestore, COLLECTION), {
    ...payment,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── 2. جلب الطلبات حسب الحالة (بدون الحاجة لـ Composite Index) ───
export async function getVodafoneCashPayments(
  status?: VodafoneCashStatus
): Promise<VodafoneCashPayment[]> {
  try {
    const colRef = collection(firestore, COLLECTION);
    const snapshot = await getDocs(colRef);
    
    let list = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
      } as VodafoneCashPayment;
    });

    // التصفية بالحالة
    if (status && status !== ('all' as any)) {
      list = list.filter((p) => p.status === status);
    }

    // الترتيب حسب الأحدث في الذاكرة (لتجنب متطلبات Composite Index في Firebase)
    list.sort((a, b) => {
      const getMillis = (ts: any) => {
        if (!ts) return 0;
        if (typeof ts.toMillis === 'function') return ts.toMillis();
        if (ts.seconds) return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        return new Date(ts).getTime() || 0;
      };
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });

    return list;
  } catch (error: any) {
    console.error('[getVodafoneCashPayments] Error:', error);
    throw error;
  }
}

// ─── 3. جلب طلبات مستخدم معين ────────────────
export async function getUserVodafoneCashPayments(
  userId: string
): Promise<VodafoneCashPayment[]> {
  try {
    const all = await getVodafoneCashPayments();
    return all.filter((p) => p.userId === userId);
  } catch (error: any) {
    console.error('[getUserVodafoneCashPayments] Error:', error);
    return [];
  }
}

// ─── 4. الموافقة وتفعيل الباقة ───────────────
export async function approveVodafoneCashPayment(
  paymentId: string,
  adminName: string
): Promise<boolean> {
  const docRef = doc(firestore, COLLECTION, paymentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return false;

  const payment = snap.data() as VodafoneCashPayment;

  // تفعيل الباقة للمستخدم
  const activated = await activateUserPlan(
    payment.userId,
    payment.planId,
    paymentId
  );

  if (!activated) return false;

  // تحديث حالة الطلب
  await updateDoc(docRef, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminName,
  });

  // إشعار للمستخدم
  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId: payment.userId,
      message: `✅ تم تفعيل ${payment.planName} بنجاح! شكراً لثقتك في سوق العرب. يمكنك الآن نشر إعلاناتك والاستمتاع بجميع المزايا.`,
      type: 'general',
      isRead: false,
      createdAt: serverTimestamp(),
      link: '/submit',
    });
  } catch (e) {
    console.warn('Failed to create user notification:', e);
  }

  return true;
}

// ─── 5. رفض الطلب ───────────────────────────
export async function rejectVodafoneCashPayment(
  paymentId: string,
  adminName: string,
  note: string
): Promise<void> {
  const docRef = doc(firestore, COLLECTION, paymentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const payment = snap.data() as VodafoneCashPayment;

  await updateDoc(docRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminName,
    rejectionNote: note,
  });

  // إشعار رفض للمستخدم
  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId: payment.userId,
      message: `❌ عذراً، لم يتم التحقق من طلب الدفع الخاص بـ ${payment.planName}. السبب: ${note || 'لم يتم التحقق من التحويل'}. يرجى التواصل معنا على واتساب لمزيد من المعلومات.`,
      type: 'general',
      isRead: false,
      createdAt: serverTimestamp(),
      link: '/pricing',
    });
  } catch (e) {
    console.warn('Failed to create rejection notification:', e);
  }
}

// ─── 6. عدد الطلبات المعلقة ──────────────────
export async function getPendingVodafoneCashCount(): Promise<number> {
  try {
    const list = await getVodafoneCashPayments('pending');
    return list.length;
  } catch {
    return 0;
  }
}
