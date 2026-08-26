import { NextRequest, NextResponse } from 'next/server';
import { verifyStoredOTP } from '@/lib/otp-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف وكود التفعيل مطلوبان.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // التحقق من الكود المحفوظ
    const checkResult = verifyStoredOTP(cleanPhone, code);

    if (!checkResult.valid) {
      return NextResponse.json(
        { success: false, error: checkResult.error || 'كود التفعيل غير صحيح.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد وتفعيل رقم الهاتف بنجاح! 🎉',
      verifiedPhone: cleanPhone,
    });
  } catch (error: any) {
    console.error('[whatsapp-otp/verify] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء تأكيد الكود.' },
      { status: 500 }
    );
  }
}
