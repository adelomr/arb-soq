import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppOTP } from '@/lib/whatsapp-gateway-client';
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

    // حفظ كود التحقق في الذاكرة السريعة الآمنة
    saveOTP(cleanPhone, code, userId);

    // إرسال كود التفعيل عبر بوابة واتساب
    const sendRes = await sendWhatsAppOTP(cleanPhone, code);

    if (!sendRes.success) {
      console.warn('[whatsapp-otp/send] Gateway response:', sendRes);
      return NextResponse.json(
        {
          success: false,
          error:
            sendRes.error ||
            'بوابة واتساب غير متصلة حالياً. يرجى التأكد من تشغيل السيرفر ومسح الـ QR.',
          gatewayOffline: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التفعيل إلى واتساب بنجاح.',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('[whatsapp-otp/send] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء إرسال الكود.' },
      { status: 500 }
    );
  }
}
