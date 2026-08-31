import { NextRequest, NextResponse } from 'next/server';
import { submitVodafoneCashPayment, ADMIN_WHATSAPP } from '@/lib/vodafone-cash-service';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      paymentId: existingPaymentId,
      userId,
      userName,
      userEmail,
      transferPhone,
      transactionRef,
      amount,
      currency,
      planId,
      planName,
      receiptUrl,
    } = body;

    let paymentId = existingPaymentId || '';

    // إذا لم يكن الطلب محفوظاً مسبقاً من المتصفح، نحاول حفظه
    if (!paymentId && userId && transferPhone && transactionRef && amount && planId) {
      try {
        paymentId = await submitVodafoneCashPayment({
          userId,
          userName: userName || 'مجهول',
          userEmail: userEmail || '',
          transferPhone: transferPhone.trim(),
          transactionRef: transactionRef.trim(),
          amount: Number(amount),
          currency: currency || 'EGP',
          planId,
          planName: planName || planId,
          receiptUrl: receiptUrl || undefined,
        });
      } catch (dbErr: any) {
        console.warn('[vodafone-cash/submit] Server Firestore write skipped/restricted:', dbErr?.message);
      }
    }

    // ── إشعار للأدمن داخل الموقع ──
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '';
    if (ADMIN_USER_ID) {
      try {
        await addDoc(collection(firestore, 'notifications'), {
          userId: ADMIN_USER_ID,
          message: `💰 طلب دفع جديد عبر فودافون كاش!\nالعميل: ${userName || 'عميل'}\nالباقة: ${planName || planId}\nالمبلغ: ${amount} ${currency || 'ج.م'}\nرقم العملية: ${transactionRef}\nرقم الهاتف: ${transferPhone}`,
          type: 'payment',
          isRead: false,
          createdAt: serverTimestamp(),
          link: '/admin?tab=vodafone-cash',
          paymentId: paymentId || undefined,
        });
      } catch (notifErr) {
        console.warn('Admin notification create skipped:', notifErr);
      }
    }

    // ── إرسال رسالة واتساب للأدمن عبر بوابة واتساب الخاصة وسيرفر CallMeBot ──
    const planLabel =
      planId === 'gold' ? '👑 الباقة الذهبية VIP' : '⭐ الباقة الفضية المميزة';
    const messageText = `🔔 *طلب دفع جديد - فودافون كاش*\n━━━━━━━━━━━━\n👤 *العميل:* ${userName || 'عميل'}\n📱 *هاتفه:* ${transferPhone}\n📦 *الباقة:* ${planLabel}\n💰 *المبلغ:* ${amount} ${currency || 'ج.م'}\n🔢 *رقم العملية:* ${transactionRef}\n━━━━━━━━━━━━\n✅ *للمراجعة والتفعيل:* arb-soq.com/admin?tab=vodafone-cash`;

    // 1. محاولة الإرسال عبر بوابة واتساب الخاصة أولاً
    try {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp-gateway-client');
      const gwRes = await sendWhatsAppMessage(ADMIN_WHATSAPP, messageText);
      if (gwRes.success) {
        console.log('[vodafone-cash/submit] WhatsApp notification sent via private gateway');
      }
    } catch (gwErr) {
      console.warn('Private WhatsApp gateway notification skipped:', gwErr);
    }

    // 2. محاولة الإرسال عبر CallMeBot كبديل إضافي
    const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || '';
    if (CALLMEBOT_API_KEY) {
      try {
        const encoded = encodeURIComponent(messageText);
        const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encoded}&apikey=${CALLMEBOT_API_KEY}`;
        await fetch(whatsappUrl);
      } catch (e) {
        console.warn('CallMeBot notification failed (non-critical):', e);
      }
    }

    return NextResponse.json({ success: true, paymentId: paymentId || 'OK' });
  } catch (error: any) {
    console.error('[vodafone-cash/submit] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    );
  }
}
