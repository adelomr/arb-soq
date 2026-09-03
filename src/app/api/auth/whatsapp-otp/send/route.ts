import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppOTP } from '@/lib/whatsapp-gateway-client';
import { saveOTP } from '@/lib/otp-store';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const PRODUCTION_USER_ERROR_MESSAGE =
  'يرجى الانتظار بعض الوقت ثم إعادة المحاولة، يتم الآن تحديث السيرفر، يرجى المحاولة مرة أخرى بعد قليل.';

/**
 * تسجيل تنبيه للمسؤول في قاعدة البيانات عند فشل إرسال كود التفعيل
 */
async function notifyAdminOfWhatsAppFailure(payload: {
  phone: string;
  userId?: string;
  errorReason: string;
  technicalDetails?: any;
}) {
  try {
    const timestampStr = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
    
    // 1. إضافة إشعار في جدول الإشعارات العام للمسؤول
    await addDoc(collection(firestore, 'notifications'), {
      userId: 'admin',
      actorId: payload.userId || 'system',
      actorName: 'نظام إرسال واتساب',
      type: 'system',
      targetId: 'whatsapp_gateway_failure',
      targetUrl: '/admin',
      message: `⚠️ تنبيه عاجل: فشل إرسال كود تفعيل واتساب للرقم (${payload.phone}) في ${timestampStr}. التفاصيل: ${payload.errorReason}`,
      read: false,
      isRead: false,
      createdAt: serverTimestamp(),
      metadata: {
        phone: payload.phone,
        userId: payload.userId || null,
        error: payload.errorReason,
        technicalDetails: payload.technicalDetails || null,
        timestamp: new Date().toISOString(),
      },
    });

    // 2. تسجيل سجل في تنبيهات النظام للأدمن admin_alerts
    await addDoc(collection(firestore, 'admin_alerts'), {
      type: 'whatsapp_otp_failure',
      severity: 'high',
      phone: payload.phone,
      userId: payload.userId || null,
      errorReason: payload.errorReason,
      technicalDetails: payload.technicalDetails || null,
      status: 'unresolved',
      createdAt: serverTimestamp(),
    });

    console.log(`[WhatsApp Alert] 🔔 Admin notified of OTP failure for ${payload.phone}`);
  } catch (alertErr: any) {
    console.error('[WhatsApp Alert] Failed to record admin notification:', alertErr?.message);
  }
}

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    const body = await request.json();
    const { phone, userId } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مطلوب.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.replace(/[^\d]/g, '').length < 8) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال رقم هاتف صحيح.' },
        { status: 400 }
      );
    }

    // فحص ما إذا كان الرقم مرتبطاً ومؤكداً بالفعل بحساب آخر على سوق العرب
    try {
      const usersQuery = query(collection(firestore, 'users'), where('phoneNumber', '==', cleanPhone));
      const usersSnap = await getDocs(usersQuery);
      const conflictingDoc = usersSnap.docs.find(d => d.id !== userId);
      if (conflictingDoc) {
        const conflictingData = conflictingDoc.data();
        if (conflictingData.phoneVerified !== false) {
          return NextResponse.json(
            {
              success: false,
              error: 'هذا الرقم مرتبط ومؤكد بالفعل بحساب آخر على سوق العرب. يرجى تسجيل الدخول بحسابك السابق أو استخدام رقم هاتف آخر لتأكيد هذا الحساب.',
              isPhoneAlreadyInUse: true,
            },
            { status: 409 }
          );
        }
      }
    } catch (checkErr) {
      console.warn('[whatsapp-otp/send] Error checking phone uniqueness:', checkErr);
    }

    // توليد كود 6 أرقام عشوائي
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ كود التحقق في الذاكرة السريعة الآمنة
    saveOTP(cleanPhone, code, userId);

    // إرسال كود التفعيل عبر بوابة واتساب السحابية
    const sendRes = await sendWhatsAppOTP(cleanPhone, code);

    if (!sendRes.success) {
      const technicalError = sendRes.error || 'تعذر الاتصال ببوابة واتساب السحابية.';

      // طباعة تشخيصية تفصيلية على سيرفر Node المحلي
      console.error('====================================================');
      console.error(`[WhatsApp OTP Error] ❌ Failure for phone: ${cleanPhone}`);
      console.error(`Status: ${sendRes.status}`);
      console.error(`Technical Reason: ${technicalError}`);
      console.error(`Technical Details:`, JSON.stringify(sendRes.technicalDetails || {}, null, 2));
      console.error('====================================================');

      // إرسال إشعار للمسؤول في قاعدة البيانات
      await notifyAdminOfWhatsAppFailure({
        phone: cleanPhone,
        userId,
        errorReason: technicalError,
        technicalDetails: sendRes.technicalDetails,
      });

      // إرجاع رسالة مناسبة: ودية في الإنتاج، وتقنية في بيئة التطوير
      return NextResponse.json(
        {
          success: false,
          error: isDev ? technicalError : PRODUCTION_USER_ERROR_MESSAGE,
          gatewayOffline: true,
          ...(isDev && { technicalDetails: sendRes.technicalDetails }),
        },
        { status: 503 }
      );
    }

    console.log(`[whatsapp-otp/send] ✅ OTP successfully sent to ${cleanPhone}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التفعيل إلى واتساب بنجاح.',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('====================================================');
    console.error('[whatsapp-otp/send] 💥 Exception Error:', error);
    console.error('====================================================');

    return NextResponse.json(
      {
        success: false,
        error: isDev
          ? `[Server Exception]: ${error.message}`
          : PRODUCTION_USER_ERROR_MESSAGE,
        ...(isDev && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
