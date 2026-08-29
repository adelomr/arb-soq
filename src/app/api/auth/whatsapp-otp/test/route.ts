import { NextRequest, NextResponse } from 'next/server';
import { checkWhatsAppGatewayStatus, sendWhatsAppOTP } from '@/lib/whatsapp-gateway-client';

export const dynamic = 'force-dynamic';

/**
 * Endpoint لفحص واختبار اتصال بوابة واتساب
 * GET /api/auth/whatsapp-otp/test -> فحص حالة الاتصال بالسيرفر/الهاتف
 * POST /api/auth/whatsapp-otp/test -> إرسال رسالة كود تجريبية لرقم معين
 */
export async function GET() {
  try {
    const health = await checkWhatsAppGatewayStatus();
    return NextResponse.json({
      success: health.connected,
      health,
      info: {
        status: health.status,
        message: health.connected
          ? 'بوابة واتساب متصلة وتعمل بنجاح.'
          : health.error || 'بوابة واتساب غير متصلة.',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'خطأ في فحص بوابة واتساب',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'يرجى إرسال رقم الهاتف phone في body.' },
        { status: 400 }
      );
    }

    const testCode = '123456';
    const result = await sendWhatsAppOTP(phone, testCode, 'سوق العرب (تجريبي)');

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال كود التحقق التجريبي (${testCode}) إلى الرقم ${phone} بنجاح عبر بوابة واتساب.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'فشل إرسال الرسالة التجريبية.',
      },
      { status: 500 }
    );
  }
}

