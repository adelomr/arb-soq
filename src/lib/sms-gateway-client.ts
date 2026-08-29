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
  const token = process.env.SMS_GATEWAY_TOKEN || 'SECRET123';
  const hmacSecret = process.env.SMS_GATEWAY_HMAC_SECRET || 'HMACSECRET123';
  const sim = Number(process.env.SMS_GATEWAY_SIM) || 1;

  const cleanPhone = phone.replace(/[^\d+]/g, '');

  const candidateUrls = [
    process.env.SMS_GATEWAY_URL,
    'http://192.168.1.4:8088',
    'http://192.168.1.4:8765',
    'http://127.0.0.1:8088',
    'http://127.0.0.1:8765',
  ].filter(Boolean).map(u => (u as string).replace(/\/+$/, ''));

  const uniqueUrls = Array.from(new Set(candidateUrls));

  let lastErrorMsg = 'تعذر الاتصال ببوابة الرسائل SMS على الهاتف.';

  for (const gatewayUrl of uniqueUrls) {
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

      const queryParams = new URLSearchParams({
        phone: cleanPhone,
        code: String(code).trim(),
        sim: String(sim),
        token: token,
      }).toString();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const targetUrl = `${gatewayUrl}/send?${queryParams}`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(bodyStr, 'utf-8').toString(),
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature,
          'X-Signature-Alg': 'HMAC-SHA256',
          'Accept': 'application/json',
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

      if (data.message || data.error) {
        lastErrorMsg = data.message || data.error;
      }
    } catch (err: any) {
      console.warn(`[sms-gateway-client] Attempt to connect to ${gatewayUrl} failed:`, err?.message);
    }
  }

  return {
    success: false,
    error: lastErrorMsg,
    gatewayOffline: true,
  };
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
