/**
 * In-memory OTP store for WhatsApp verification
 * يوفر تخزين سريع وآمن ومؤقت لأكواد التفعيل بدون الاعتماد على قواعد أمان السيرفر
 */

interface OTPRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  userId?: string;
}

// استخدام Global لمنع إعادة التعيين أثناء Hot Reload في بيئة التطوير
const globalForOTP = globalThis as unknown as {
  otpCache: Map<string, OTPRecord> | undefined;
};

export const otpStore = globalForOTP.otpCache ?? new Map<string, OTPRecord>();

if (process.env.NODE_ENV !== 'production') {
  globalForOTP.otpCache = otpStore;
}

/**
 * حفظ كود التفعيل لمدة 5 دقائق
 */
export function saveOTP(phone: string, code: string, userId?: string): void {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  otpStore.set(cleanPhone, {
    code: String(code).trim(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 دقائق
    attempts: 0,
    userId,
  });
}

/**
 * التحقق من كود التفعيل
 */
export function verifyStoredOTP(
  phone: string,
  inputCode: string
): { valid: boolean; error?: string } {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const record = otpStore.get(cleanPhone);

  if (!record) {
    return {
      valid: false,
      error: 'لم يتم العثور على طلب تفعيل لهذا الرقم، أو انتهت صلاحيته. يرجى طلب كود جديد.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return {
      valid: false,
      error: 'انتهت صلاحية كود التفعيل (5 دقائق). يرجى طلب كود جديد.',
    };
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanPhone);
    return {
      valid: false,
      error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب كود جديد.',
    };
  }

  if (record.code !== String(inputCode).trim()) {
    record.attempts += 1;
    return {
      valid: false,
      error: 'كود التفعيل غير صحيح. يرجى التأكد وإعادة المحاولة.',
    };
  }

  // نجاح التحقق -> حذف الكود حتى لا يُستخدم مرة أخرى
  otpStore.delete(cleanPhone);
  return { valid: true };
}
