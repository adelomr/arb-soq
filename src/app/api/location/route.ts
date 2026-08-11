import { NextRequest, NextResponse } from 'next/server';
import { markets } from '@/lib/markets';

export async function GET(request: NextRequest) {
  try {
    // 1. فحص ترويسات الخادم / CDN
    const headers = request.headers;
    const countryCodeHeader =
      headers.get('cf-ipcountry') ||
      headers.get('x-vercel-ip-country') ||
      headers.get('x-country-code') ||
      headers.get('x-geo-country') ||
      headers.get('x-appengine-country');

    if (countryCodeHeader && countryCodeHeader !== 'XX' && countryCodeHeader !== 'T1') {
      const code = countryCodeHeader.toLowerCase();
      const matchedMarket = markets.find(m => m.id === code || m.flagCode.toLowerCase() === code);
      if (matchedMarket) {
        return NextResponse.json({
          success: true,
          countryCode: matchedMarket.flagCode,
          marketId: matchedMarket.id,
          source: 'cdn-header',
        });
      }
    }

    // 2. إذا لم تجد الترويسة، جرب جلب الـ IP من الترويسات والبحث عنه بسيرفر لوك أب سريع
    const clientIp =
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip');

    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        const res = await fetch(`https://ipwho.is/${clientIp}`, {
          signal: AbortSignal.timeout(2000),
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.country_code) {
            const code = data.country_code.toLowerCase();
            const matchedMarket = markets.find(m => m.id === code || m.flagCode.toLowerCase() === code);
            if (matchedMarket) {
              return NextResponse.json({
                success: true,
                countryCode: matchedMarket.flagCode,
                marketId: matchedMarket.id,
                source: 'ip-lookup',
              });
            }
          }
        }
      } catch {
        // تجاهل الخطأ للذهاب للبديل الاحتياطي
      }
    }

    return NextResponse.json({
      success: false,
      countryCode: null,
      marketId: null,
      source: 'none',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
