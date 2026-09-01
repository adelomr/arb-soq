/**
 * WhatsApp Gateway Client
 * مخصص حصرياً لسيرفر واتساب السحابي الدائم على Google Cloud Run (100%)
 */

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
  provider?: 'cloud_run';
  technicalDetails?: {
    httpStatus?: number;
    gatewayStatus?: string;
    rawError?: string;
    targetPhone?: string;
    endpoint?: string;
    errorType?: string;
    timestamp?: string;
  };
}

export const CLOUD_RUN_GATEWAY_URL = 'https://whatsapp-gateway-264703833176.europe-west1.run.app';

/**
 * فحص هل خدمة بوابة واتساب السحابية متصلة وجاهزة للإرسال
 */
export async function checkWhatsAppGatewayStatus(): Promise<{
  connected: boolean;
  phone?: string;
  status: string;
  serverUrl: string;
  error?: string;
  technicalDetails?: any;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${CLOUD_RUN_GATEWAY_URL}/status`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.connected || data.status === 'connected') {
        return {
          connected: true,
          status: 'connected',
          phone: data.phone,
          serverUrl: CLOUD_RUN_GATEWAY_URL,
        };
      }
      return {
        connected: false,
        status: data.status || 'disconnected',
        serverUrl: CLOUD_RUN_GATEWAY_URL,
        error: 'سيرفر واتساب السحابي مستيقظ ولكنه يحتاج لمسح رمز QR لربط الحساب.',
        technicalDetails: { data, httpStatus: res.status },
      };
    }
    return {
      connected: false,
      status: `HTTP_${res.status}`,
      serverUrl: CLOUD_RUN_GATEWAY_URL,
      error: `استجاب السيرفر برمز خطأ HTTP ${res.status}`,
      technicalDetails: { httpStatus: res.status },
    };
  } catch (err: any) {
    console.warn('[WhatsApp Client] Cloud Run status check error:', err?.message);
    return {
      connected: false,
      status: 'offline',
      serverUrl: CLOUD_RUN_GATEWAY_URL,
      error: 'تعذر الاتصال بسيرفر واتساب السحابي. يرجى التأكد من تشغيل السيرفر أو مسح رمز QR.',
      technicalDetails: { message: err?.message, name: err?.name },
    };
  }
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
 * إرسال كود التحقق (OTP) حصرياً عبر سيرفر واتساب السحابي على Google Cloud Run
 */
export async function sendWhatsAppOTP(
  phone: string,
  code: string,
  appName = 'سوق العرب'
): Promise<WhatsAppSendResult> {
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const cloudRes = await fetch(`${CLOUD_RUN_GATEWAY_URL}/send-otp`, {
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
    clearTimeout(timeoutId);

    const cloudData = await cloudRes.json().catch(() => ({}));

    if (cloudRes.ok && cloudData.success) {
      console.log(`[WhatsApp Client] ✅ OTP sent successfully to ${cleanPhone} via Cloud Run`);
      return {
        success: true,
        messageId: cloudData.messageId || 'cloud_sent',
        status: 'sent',
        provider: 'cloud_run',
      };
    }

    const errorMessage =
      cloudData.error ||
      (cloudData.status === 'qr_ready' || cloudData.status === 'disconnected'
        ? 'سيرفر واتساب السحابي غير مرتبط حالياً. يرجى مسح رمز QR لربط الحساب.'
        : 'تعذر إرسال كود التفعيل عبر واتساب السحابي.');

    console.error(`[WhatsApp Client] ❌ Cloud Run send error:`, {
      httpStatus: cloudRes.status,
      cloudData,
      cleanPhone,
    });

    return {
      success: false,
      error: errorMessage,
      status: cloudData.status || `HTTP_${cloudRes.status}`,
      technicalDetails: {
        httpStatus: cloudRes.status,
        gatewayStatus: cloudData.status,
        rawError: cloudData.error || JSON.stringify(cloudData),
        targetPhone: cleanPhone,
        endpoint: `${CLOUD_RUN_GATEWAY_URL}/send-otp`,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error(`[WhatsApp Client] 💥 Cloud Run fetch exception:`, {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      cleanPhone,
    });
    let errMsg = 'تعذر الاتصال بسيرفر واتساب السحابي على Google Cloud.';
    if (err.name === 'AbortError') {
      errMsg = 'استغرقت عملية الإرسال السحابية وقتاً طويلاً (Timeout 15s).';
    }
    return {
      success: false,
      error: errMsg,
      technicalDetails: {
        errorType: err?.name || 'FetchError',
        rawError: err?.message,
        targetPhone: cleanPhone,
        endpoint: `${CLOUD_RUN_GATEWAY_URL}/send-otp`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * إرسال رسالة نصية عامة عبر سيرفر واتساب السحابي
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${CLOUD_RUN_GATEWAY_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      return {
        success: true,
        messageId: data.messageId,
        status: 'sent',
        provider: 'cloud_run',
      };
    }

    return {
      success: false,
      error: data.error || 'فشل إرسال الرسالة عبر سيرفر واتساب السحابي.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'تعذر الاتصال بسيرفر واتساب السحابي.',
    };
  }
}
