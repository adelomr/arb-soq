/**
 * WhatsApp Gateway Client
 * يدعم الربط المباشر مع تطبيق بوابة الهاتف للأندرويد (My-otp على المنفذ 8088)
 * بالإضافة إلى خادم بوابة واتساب المستقل (المنفذ 5005)
 */

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

function getWhatsAppGatewayCandidates(): string[] {
  const customUrl =
    process.env.WHATSAPP_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_GATEWAY_URL ||
    process.env.SMS_GATEWAY_URL;

  const list = [
    customUrl,
    'http://192.168.1.4:8088',
    'http://127.0.0.1:8088',
    'http://localhost:8088',
    'http://127.0.0.1:5005',
    'http://localhost:5005',
  ]
    .filter(Boolean)
    .map((u) => (u as string).replace(/\/+$/, ''));

  return Array.from(new Set(list));
}

const AUTH_TOKEN = process.env.SMS_GATEWAY_TOKEN || 'SECRET123';

/**
 * فحص هل خدمة بوابة واتساب متصلة وجاهزة للإرسال
 */
export async function checkWhatsAppGatewayStatus(): Promise<{
  connected: boolean;
  phone?: string;
  status: string;
  error?: string;
}> {
  const candidateUrls = getWhatsAppGatewayCandidates();

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // فحص /status أو /health
      const res = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.connected || data.status === 'ok' || data.status === 'up') {
          return {
            connected: true,
            status: 'connected',
            phone: data.phone,
          };
        }
      }
    } catch {
      // تجربة العنوان التالي
    }
  }

  return {
    connected: false,
    status: 'offline',
    error: 'تعذر الاتصال بتطبيق بوابة واتساب على الهاتف (192.168.1.4:8088). يرجى التأكد من تشغيل البوابة على الهاتف.',
  };
}

/**
 * إرسال كود التحقق (OTP) حصرياً عبر بوابة واتساب
 */
export async function sendWhatsAppOTP(
  phone: string,
  code: string,
  appName = 'سوق العرب'
): Promise<WhatsAppSendResult> {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const candidateUrls = getWhatsAppGatewayCandidates();

  let lastError = 'تعذر الاتصال بتطبيق بوابة واتساب على الهاتف. تأكد من تشغيل التطبيق على الهاتف.';

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      // 1. تجربة تطبيق الأندرويد (My-otp) عبر مسار /send-whatsapp أو /send
      const androidPayload = {
        phone: cleanPhone,
        code: String(code).trim(),
        message: `رمز تفعيل ${appName} الخاص بك هو: ${code}`,
        token: AUTH_TOKEN,
        channel: 'whatsapp',
        idempotencyKey: `wa_${cleanPhone.replace(/[^\d]/g, '')}_${Date.now()}`,
      };

      const res = await fetch(`${baseUrl}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify(androidPayload),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.status === 'ok' || data.success || data.channel === 'whatsapp' || data.status === 'duplicate')) {
        console.log(`[WhatsApp Client] OTP sent successfully to ${cleanPhone} via Android Gateway at ${baseUrl}`);
        return {
          success: true,
          messageId: data.messageId || 'android_sent',
          status: 'sent',
        };
      }

      // 2. إذا لم يكن مسار /send-whatsapp، تجربة مسار /send-otp الخاص بخادم Node.js
      if (res.status === 404) {
        const nodeController = new AbortController();
        const nodeTimeout = setTimeout(() => nodeController.abort(), 5000);

        const nodeRes = await fetch(`${baseUrl}/send-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phone: cleanPhone,
            code: String(code).trim(),
            appName: appName,
          }),
          cache: 'no-store',
          signal: nodeController.signal,
        });
        clearTimeout(nodeTimeout);

        const nodeData = await nodeRes.json().catch(() => ({}));
        if (nodeRes.ok && nodeData.success) {
          return {
            success: true,
            messageId: nodeData.messageId,
            status: 'sent',
          };
        }
      }

      if (data.message || data.error) {
        lastError = data.message || data.error;
      }
    } catch (err: any) {
      console.warn(`[WhatsApp Client] Connection attempt to ${baseUrl} failed:`, err?.message);
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

/**
 * إرسال رسالة نصية عامة عبر بوابة واتساب
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  return sendWhatsAppOTP(phone, message);
}
