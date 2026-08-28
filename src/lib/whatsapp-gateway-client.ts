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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${GATEWAY_URL}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn('[WhatsApp Gateway Client] Send error:', error?.message);
    const isConnError = error?.name === 'AbortError' || error?.message?.includes('fetch failed') || error?.code === 'ECONNREFUSED';
    return {
      success: false,
      error: isConnError
        ? 'تعذر الاتصال بسيرفر بوابة واتساب (يرجى التأكد من تشغيل خادم البوابة ومسح رمز الـ QR أو المحاولة لاحقاً).'
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
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  // 1. Try Primary Cloud/Local Baileys Gateway if reachable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${GATEWAY_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, code, appName }),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return data;
    }
  } catch (cloudErr: any) {
    console.warn('[WhatsApp Client] Cloud/Local gateway unreachable, attempting Android Phone Gateway...');
  }

  // 2. Fallback to Android Phone WhatsApp Business Gateway
  const phoneCandidates = [
    process.env.SMS_GATEWAY_URL || 'http://192.168.1.4:8088',
    'http://192.168.1.4:8765',
    'http://192.168.1.4:8080',
    'http://127.0.0.1:8088',
  ];

  for (const baseUrl of phoneCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const targetUrl = `${baseUrl.replace(/\/$/, '')}/send-whatsapp`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code,
          token: process.env.SMS_GATEWAY_TOKEN || 'SECRET123',
          channel: 'whatsapp',
        }),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.status === 'ok' || json.status === 'success' || json.channel === 'whatsapp') {
          console.log(`[WhatsApp Client] Sent OTP successfully via Android WhatsApp Gateway at ${baseUrl}`);
          return { success: true, status: 'sent_via_phone_whatsapp' };
        }
      }
    } catch (err: any) {
      // Continue to next candidate
    }
  }

  return {
    success: false,
    error: 'تعذر الاتصال ببوابة واتساب. يرجى التأكد من تشغيل تطبيق بوابة الرسائل على الهاتف أو تفعيل خدمة الإرسال التلقائي.',
  };
}
