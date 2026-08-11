import { MetadataRoute } from 'next';

/**
 * robots.ts — ملف توجيه عناكب البحث (Googlebot & Search Engines)
 * مصمم للفهرسة السريعة وتوفير أقصى صلاحية للزواحف لزيارة وتكشيف الصفحات والإعلانات والصور
 */

const BASE_URL = 'https://www.arb-soq.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 1. سماح كامل لبوت إعلانات جوجل من أجل فحص صفحات الهبوط بدون أي معوقات
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
      {
        userAgent: 'AdsBot-Google-Mobile',
        allow: '/',
      },
      // 2. سماح كامل لأداة فحص العناوين Google InspectionTool
      {
        userAgent: 'Google-Inspectiontool',
        allow: '/',
      },
      // 3. سماح كامل لبوت صور جوجل لفهرسة جميع الصور والتصاميم
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      // 4. قواعد محرك بحث جوجل (Googlebot)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/profile',
          '/submit',
          '/cart',
          '/wallet',
        ],
      },
      // 5. القواعد العامة لجميع محركات البحث الأخرى (Bing, Yahoo, DuckDuckGo)
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/profile',
          '/submit',
          '/cart',
          '/wallet',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
