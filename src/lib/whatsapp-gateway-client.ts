/**
 * WhatsApp Gateway Client
 * يدعم الربط المباشر مع سيرفر واتساب السحابي الدائم على Google Cloud Run
 * بالإضافة إلى بوابة هاتف الأندرويد المحلية كـ Fallback
 */

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
  provider?: 'cloud_run' | 'android_gateway' | 'meta_api';
}

export const CLOUD_RUN_GATEWAY_URL = 'https://whatsapp-gateway-264703833176.europe-west1.run.app';

function getWhatsAppGatewayCandidates(): string[] {
  const customUrl =
    process.env.WHATSAPP_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_GATEWAY_URL ||
    process.env.SMS_GATEWAY_URL;

  const list = [
    CLOUD_RUN_GATEWAY_URL,
    customUrl,
    'http://192.168.1.4:8088',
    'https://bailey-population-cattle-median.trycloudflare.com',
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
  serverUrl?: string;
  error?: string;
}> {
  const candidateUrls = getWhatsAppGatewayCandidates();

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.connected || data.status === 'connected' || data.status === 'ok' || data.status === 'up') {
          return {
            connected: true,
            status: data.status || 'connected',
            phone: data.phone,
            serverUrl: baseUrl,
          };
        }
      }
    } catch {
      // تجربة العنوان التالي
    }
  }

  return {
    connected: false,
    status: 'disconnected',
    error: 'سيرفر واتساب غير متصل حالياً. يرجى مسح رمز QR لربط واتساب.',
  };
}

/**
 * نبضة تنشيط سحابية دورية لإبقاء سيرفر جوجل كلاود مستيقظاً 24/7 دون خمول
 */
export async function pingWhatsAppGatewayKeepAlive(): Promise<{
  success: boolean;
  latencyMs: number;
  status: string;
  url: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${CLOUD_RUN_GATEWAY_URL}/status`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsed = Date.now() - start;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        latencyMs: elapsed,
        status: data.status || 'ok',
        url: CLOUD_RUN_GATEWAY_URL,
      };
    }
    return {
      success: false,
      latencyMs: elapsed,
      status: `HTTP_${res.status}`,
      url: CLOUD_RUN_GATEWAY_URL,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      status: err?.message || 'timeout',
      url: CLOUD_RUN_GATEWAY_URL,
    };
  }
}

/**
 * إرسال كود التحقق (OTP) عبر بوابة واتساب
 */
export async function sendWhatsAppOTP(
  phone: string,
  code: string,
  appName = 'سوق العرب'
): Promise<WhatsAppSendResult> {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const candidateUrls = getWhatsAppGatewayCandidates();

  let lastError = 'تعذر الاتصال ببوابة واتساب. يرجى التأكد من تشغيل السيرفر أو مسح رمز QR.';

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // 1. أولاً: تجربة سيرفر Google Cloud Run / Node.js عبر مسار /send-otp
      const isCloudOrNode = baseUrl.includes('run.app') || baseUrl.includes('5005');
      if (isCloudOrNode) {
        try {
          const cloudRes = await fetch(`${baseUrl}/send-otp`, {
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
            signal: controller.signal,
          });

          const cloudData = await cloudRes.json().catch(() => ({}));
          if (cloudRes.ok && cloudData.success) {
            console.log(`[WhatsApp Client] OTP sent successfully to ${cleanPhone} via Cloud Run at ${baseUrl}`);
            return {
              success: true,
              messageId: cloudData.messageId || 'cloud_sent',
              status: 'sent',
              provider: 'cloud_run',
            };
          }
          if (cloudData.error) {
            lastError = cloudData.error;
          }
        } catch (e: any) {
          console.warn(`[WhatsApp Client] Cloud Run send error at ${baseUrl}:`, e?.message);
        }
      }

      // 2. ثانياً: تجربة تطبيق الأندرويد (My-otp) عبر مسار /send-whatsapp
      const androidPayload = {
        phone: cleanPhone,
        code: String(code).trim(),
        message: `رمز تفعيل ${appName} الخاص بك هو: \`\`\`${code}\`\`\``,
        token: AUTH_TOKEN,
        channel: 'whatsapp',
        idempotencyKey: `wa_${cleanPhone.replace(/[^\d]/g, '')}_${code}_${Math.floor(Date.now() / 60000)}`,
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
          provider: 'android_gateway',
        };
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
