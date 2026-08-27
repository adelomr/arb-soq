import crypto from 'crypto';

interface SendSMSResult {
  success: boolean;
  message?: string;
  error?: string;
  gatewayOffline?: boolean;
}

/**
 * إرسال كود التفعيل عبر تطبيق بوابة الرسائل للأندرويد (My-otp / SMSGatewayApp)
 */
export async function sendSmsGatewayOTP(
  phone: string,
  code: string
): Promise<SendSMSResult> {
  const gatewayUrl = (
    process.env.SMS_GATEWAY_URL || 'http://127.0.0.1:8080'
  ).replace(/\/+$/, '');
  const token = process.env.SMS_GATEWAY_TOKEN || 'SECRET123';
  const hmacSecret = process.env.SMS_GATEWAY_HMAC_SECRET || 'HMACSECRET123';
  const sim = Number(process.env.SMS_GATEWAY_SIM) || 1;

  const cleanPhone = phone.replace(/[^\d+]/g, '');

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyObj = {
      phone: cleanPhone,
      code: String(code).trim(),
      sim: sim,
      token: token,
      idempotencyKey: `otp_${cleanPhone}_${timestamp}`,
    };

    const bodyStr = JSON.stringify(bodyObj);

    // إنشاء توقيع HMAC-SHA256 اختياري إضافي للأمان
    const canonicalString = `${timestamp}\nPOST\n/send\n${bodyStr}`;
    const signature = crypto
      .createHmac('sha256', hmacSecret)
      .update(canonicalString)
      .digest('hex');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // مهلة 10 ثوانٍ

    const response = await fetch(`${gatewayUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'X-Signature-Alg': 'HMAC-SHA256',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.status === 'ok' || data.status === 'duplicate' || data.success)) {
      return {
        success: true,
        message: 'تم إرسال كود التحقق بنجاح عبر بوابة الرسائل SMS.',
      };
    }

    return {
      success: false,
      error:
        data.message ||
        data.error ||
        `تعذر الإرسال من بوابة الرسائل (رمز الاستجابة: ${response.status}).`,
    };
  } catch (error: any) {
    console.error('[sms-gateway-client] Error connecting to Android gateway:', error);

    const isOffline =
      error.name === 'AbortError' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('fetch failed');

    return {
      success: false,
      error: isOffline
        ? 'بوابة رسائل الأندرويد غير متصلة حالياً. يرجى التأكد من تشغيل تطبيق بوابة الرسائل على الهاتف والاتصال بنفس الشبكة.'
        : error.message || 'حدث خطأ أثناء الاتصال ببوابة الرسائل.',
      gatewayOffline: isOffline,
    };
  }
}

/**
 * فحص صحة واتصال بوابة الأندرويد
 */
export async function checkSmsGatewayHealth(): Promise<boolean> {
  const gatewayUrl = (
    process.env.SMS_GATEWAY_URL || 'http://127.0.0.1:8080'
  ).replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${gatewayUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data.status === 'up' || data.status === 'ok';
  } catch {
    return false;
  }
}
