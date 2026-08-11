import { NextRequest, NextResponse } from 'next/server';

/**
 * middleware.ts — حماية من مشكلة CAPTCHA لـ Google Bot
 *
 * المشكلة: Firebase Hosting + Cloud Run أحياناً يعرض CAPTCHA لزاحف جوجل
 * الحل: إضافة headers خاصة تُعرّف الطلب لجوجل وتمنع الـ CAPTCHA
 */

const GOOGLE_BOT_PATTERNS = [
  'googlebot',
  'adsbot-google',
  'mediapartners-google',
  'apis-google',
  'google-inspectiontool',
  'google-read-aloud',
  'storebot-google',
];

function isGoogleBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return GOOGLE_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Robots-Tag', 'index, follow');

  if (isGoogleBot(userAgent)) {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  }

  const pathname = request.nextUrl.pathname;
  if (isGoogleBot(userAgent) && pathname.startsWith('/admin')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
