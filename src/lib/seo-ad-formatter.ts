/**
 * إرشادات ومساعد لتنسيق عناوين ووصف الإعلانات لتحقيق أسرع فهرسة وظهور في محركات بحث جوجل (SEO)
 */

export interface SeoAdAnalysis {
  score: number; // من 100
  recommendations: string[];
  optimizedTitle?: string;
  hasPrice: boolean;
  hasLocation: boolean;
  hasCondition: boolean;
  isLengthOptimal: boolean;
}

/**
 * فحص عنوان الإعلان وتقديم نصائح لتحسين فهرسته
 * جوجل يفضل العناوين بصيغة: [نوع السلعة / الموديل] + [الحالة] + [المدينة / الحي]
 * مثال: "تويوتا كامري 2022 فل كامل وكالة - الرياض"
 */
export function analyzeAdSeo(title: string, description: string, city?: string, category?: string): SeoAdAnalysis {
  const recommendations: string[] = [];
  let score = 100;

  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();

  // فحص طول العنوان
  if (trimmedTitle.length < 10) {
    score -= 25;
    recommendations.push('العنوان قصير جداً. يفضل كتابة اسم السلعة والموديل بوضوح ليتعرف عليها جوجل.');
  } else if (trimmedTitle.length > 70) {
    score -= 10;
    recommendations.push('العنوان طويل جداً وقد يتم قصه في نتائج بحث جوجل (المثالي 20-60 حرفاً).');
  }

  // فحص وجود المدينة
  const hasLocation = Boolean(city && city.trim().length > 1) || /الرياض|جدة|مكة|الدمام|القاهرة|الإسكندرية|دبي|أبوظبي|عمان|الكويت|الدوحة|المنامة|مسقط/.test(trimmedTitle + ' ' + trimmedDesc);
  if (!hasLocation) {
    score -= 15;
    recommendations.push('إضافة اسم المدينة أو الحي في العنوان أو الوصف يعزز ظهور الإعلان في نتائج البحث المحلية للباحثين القريبين منك.');
  }

  // فحص طول الوصف
  if (trimmedDesc.length < 50) {
    score -= 25;
    recommendations.push('الوصف قصير جداً. أضف تفاصيل المواصفات، الحالة، والمميزات لتوفير كلمات مفتاحية يبحث عنها المشترون.');
  }

  // فحص الحالة (جديد / مستعمل)
  const hasCondition = /جديد|مستعمل|وكالة|نظيف|أصلي|كسر زيرو|بحالة ممتازة/.test(trimmedTitle + ' ' + trimmedDesc);
  if (!hasCondition) {
    score -= 10;
    recommendations.push('تحديد حالة السلعة (جديد أو مستعمل) يزيد من فرصة النقر على إعلانك في محرك بحث جوجل.');
  }

  // الكلمات الممنوعة أو الضعيفة
  if (/للبيع فقط|فرصة لن تعوض|عاجل|لقطة/.test(trimmedTitle) && trimmedTitle.length < 25) {
    score -= 15;
    recommendations.push('تجنب حشو العنوان بكلمات مثل "فرصة" أو "عاجل" دون ذكر الموديل والنوع بدقة.');
  }

  const isLengthOptimal = trimmedTitle.length >= 15 && trimmedTitle.length <= 65 && trimmedDesc.length >= 70;

  return {
    score: Math.max(20, Math.min(100, score)),
    recommendations,
    hasPrice: true,
    hasLocation,
    hasCondition,
    isLengthOptimal,
  };
}

/**
 * تنسيق عنوان مثالي لسيو جوجل عند الاقتراح
 */
export function generateSuggestedSeoTitle(brandOrModel: string, subCategory: string, condition?: string, city?: string): string {
  const parts = [
    brandOrModel || subCategory,
    condition ? (condition === 'new' ? 'جديد' : 'مستعمل') : '',
    city ? `في ${city}` : '',
  ].filter(Boolean);

  return parts.join(' - ');
}
