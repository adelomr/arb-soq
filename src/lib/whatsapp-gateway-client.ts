/**
 * WhatsApp Gateway Client
 * يوفر دوال مساعدة للاتصال بسيرفر بوابة واتساب المحلي أو السحابي
 */

const GATEWAY_URL =
  process.env.WHATSAPP_GATEWAY_URL ||
  'https://whatsapp-gateway-264703833176.europe-west1.run.app';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

/**
 * فحص هل بوابة واتساب متصلة وجاهزة
 */
export async function checkWhatsAppGatewayStatus(): Promise<{
  connected: boolean;
  phone?: string;
  status: string;
}> {
  try {
    const res = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { connected: false, status: 'offline' };
    const data = await res.json();
    return {
      connected: !!data.connected,
      phone: data.phone,
      status: data.status || 'unknown',
    };
  } catch {
    return { connected: false, status: 'offline' };
  }
}

/**
 * إرسال رسالة نصية عامة عبر واتساب
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
      cache: 'no-store',
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn('[WhatsApp Gateway Client] Send error:', error?.message);
    const isConnError = error?.message?.includes('fetch failed') || error?.code === 'ECONNREFUSED';
    return {
      success: false,
      error: isConnError
        ? 'تعذر الاتصال بسيرفر بوابة واتساب (تأكد من تشغيل خادم البوابة على المنفذ 5005 ومسح رمز الـ QR).'
        : (error?.message || 'Gateway connection failed')
    };
  }
}

/**
 * إرسال رمز تفعيل (OTP) منسق باحترافية
 */
export async function sendWhatsAppOTP(
  phone: string,
  code: string,
  appName = 'سوق العرب'
): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, appName }),
      cache: 'no-store',
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn('[WhatsApp Gateway Client] Send OTP error:', error?.message);
    const isConnError = error?.message?.includes('fetch failed') || error?.code === 'ECONNREFUSED';
    return {
      success: false,
      error: isConnError
        ? 'تعذر الاتصال بسيرفر بوابة واتساب (تأكد من تشغيل خادم البوابة على المنفذ 5005 ومسح رمز الـ QR).'
        : (error?.message || 'Gateway connection failed')
    };
  }
}
