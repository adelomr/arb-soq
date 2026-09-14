/**
 * نظام التدوير الزمني العادل (Fair Round-Robin) وتيمر الأولوية للباقات
 * يضمن توزيع صدارة الظهور بالتساوي بين جميع مشتركي الباقة الواحدة (الذهبية / الفضية)
 */

/**
 * تدوير مصفوفة الإعلانات بناءً على نافذة زمنية موحدة
 * يضمن أن يبدأ كل إعلان في قمة القائمة لفترة محددة (مثل كل 10 دقائق)
 * دون التسبب في أي قفزات غير متوقعة للزائر أثناء التصفح.
 * 
 * @param ads مصفوفة الإعلانات
 * @param intervalMinutes مدة النافذة الزمنية بالدقائق (افتراضياً 10 دقائق)
 * @returns مصفوفة الإعلانات بعد إزاحتها بالترتيب العادل
 */
export function getFairRotatedAds<T>(ads: T[], intervalMinutes: number = 10): T[] {
  if (!ads || ads.length <= 1) return ads || [];
  
  const now = Date.now();
  const windowIndex = Math.floor(now / (intervalMinutes * 60 * 1000));
  const offset = windowIndex % ads.length;
  
  if (offset === 0) return ads;
  return [...ads.slice(offset), ...ads.slice(0, offset)];
}

/**
 * حساب النسبة المئوية المتبقية لوقت النافذة الزمنية الحالية
 */
export function getCurrentWindowRemainingSeconds(intervalMinutes: number = 10): number {
  const now = Date.now();
  const windowMs = intervalMinutes * 60 * 1000;
  const elapsed = now % windowMs;
  return Math.ceil((windowMs - elapsed) / 1000);
}
