import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://www.arb-soq.com';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const INDEXNOW_KEY = 'arbsoq2026indexnow';

/**
 * محرك استدعاء فوري لمحركات البحث (جوجل، بينغ، إندكس ناو)
 * لإشعارها بإضافة إعلان أو تحديث خريطة الموقع فورياً
 */
export async function POST(req: NextRequest) {
  try {
    let body: { url?: string; urls?: string[] } = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty, proceed with sitemap ping
    }

    const targetUrl = body.url;
    const urlList = body.urls && body.urls.length > 0
      ? body.urls
      : targetUrl
      ? [targetUrl, SITEMAP_URL]
      : [SITEMAP_URL];

    const results: Record<string, any> = {};

    // 1. Google Sitemap Ping
    try {
      const googlePingRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: 'GET', headers: { 'User-Agent': 'ArbSoq-SEOBot/1.0' }, cache: 'no-store' }
      );
      results.google = {
        status: googlePingRes.status,
        ok: googlePingRes.ok,
      };
    } catch (err: any) {
      results.google = { status: 'error', message: err?.message };
    }

    // 2. Bing Sitemap Ping
    try {
      const bingPingRes = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: 'GET', headers: { 'User-Agent': 'ArbSoq-SEOBot/1.0' }, cache: 'no-store' }
      );
      results.bing = {
        status: bingPingRes.status,
        ok: bingPingRes.ok,
      };
    } catch (err: any) {
      results.bing = { status: 'error', message: err?.message };
    }

    // 3. IndexNow Submission (Google-alternative standard for Instant Indexing on Bing & Yandex)
    try {
      const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          host: 'www.arb-soq.com',
          key: INDEXNOW_KEY,
          keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urlList,
        }),
        cache: 'no-store',
      });
      results.indexNow = {
        status: indexNowRes.status,
        ok: indexNowRes.ok || indexNowRes.status === 200 || indexNowRes.status === 202,
      };
    } catch (err: any) {
      results.indexNow = { status: 'error', message: err?.message };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      submittedUrls: urlList,
      pingResults: results,
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to ping search engines',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow manual browser test or cron trigger
  return POST(new NextRequest(new URL('/api/seo/ping', 'https://www.arb-soq.com')));
}
