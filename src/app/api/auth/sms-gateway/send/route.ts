import { NextRequest, NextResponse } from 'next/server';
import { sendSmsGatewayOTP } from '@/lib/sms-gateway-client';
import { saveOTP } from '@/lib/otp-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // توليد كود 6 أرقام عشوائي
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ كود التحقق في الذاكرة السريعة
    saveOTP(cleanPhone, code, userId);

    // إرسال كود التحقق عبر بوابة الأندرويد SMS
    const sendRes = await sendSmsGatewayOTP(cleanPhone, code);

    if (!sendRes.success) {
      console.warn('[sms-gateway/send] Gateway response:', sendRes);
      return NextResponse.json(
        {
          success: false,
          error:
            sendRes.error ||
            'بوابة رسائل SMS غير متصلة حالياً. يرجى التأكد من تشغيل تطبيق بوابة الرسائل على الهاتف.',
          gatewayOffline: sendRes.gatewayOffline,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق في رسالة نصية قصيرة SMS بنجاح.',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('[sms-gateway/send] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء إرسال الكود.' },
      { status: 500 }
    );
  }
}
