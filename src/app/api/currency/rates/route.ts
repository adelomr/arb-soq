import { NextResponse } from 'next/server';
import { FALLBACK_EGP_RATES } from '@/lib/currency-service';

export const revalidate = 43200; // كاشينج تلقائي لمدة 12 ساعة على السيرفر

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EGP', {
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        return NextResponse.json({
          success: true,
          base: 'EGP',
          updatedAt: data.time_last_update_utc || new Date().toISOString(),
          rates: data.rates,
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
          },
        });
      }
    }
  } catch (error) {
    console.error('[API /api/currency/rates] External fetch failed, using fallback:', error);
  }

  // في حال تعذر الاتصال بمزود الـ API الخارجي
  return NextResponse.json({
    success: true,
    base: 'EGP',
    fallback: true,
    updatedAt: new Date().toISOString(),
    rates: FALLBACK_EGP_RATES,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
