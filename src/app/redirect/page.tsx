'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExternalLink, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getPageBySlug, incrementPageViews } from '@/lib/page-service';
import { useAuth } from '@/context/AuthContext';


function RedirectContent() {
  const { adSenseSettings } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [countdown, setCountdown] = useState(20);
  const [initialCountdown, setInitialCountdown] = useState(20);
  const [isReady, setIsReady] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>('أنت تغادر سوق العرب الآن');
  const [pageContent, setPageContent] = useState<string>('رابط التوجيه آمن وجاهز. يرجى الانتظار قليلاً ليتم تجهيز رابط التحويل الخارجي.');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPageConfig = async () => {
      try {
        const data = await getPageBySlug('redirect');
        if (data) {
          if (data.title) setPageTitle(data.title);
          if (data.content) setPageContent(data.content);
          if (typeof data.countdown === 'number') {
            setCountdown(data.countdown);
            setInitialCountdown(data.countdown);
          }
          if (data.id) {
            await incrementPageViews(data.id);
          }
        }
      } catch (err) {
        console.error('Error fetching redirect page configuration:', err);
      }
    };
    fetchPageConfig();
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;

    // If ads are disabled, remove all ad elements
    if (adSenseSettings && !adSenseSettings.adsEnabled) {
      const ads = contentRef.current.querySelectorAll('amp-ad, ins.adsbygoogle');
      ads.forEach(ad => ad.remove());
      return;
    }

    // 1. Process legacy <amp-ad> tags by converting them to standard <ins> tags
    const ampAds = contentRef.current.querySelectorAll('amp-ad');
    ampAds.forEach((ampAd) => {
      const client = ampAd.getAttribute('data-ad-client') || 'ca-pub-4808414573627321';
      const slot = ampAd.getAttribute('data-ad-slot');

      if (!slot) return;

      // Prevent double replacement
      if (ampAd.getAttribute('data-replaced') === 'true') return;
      ampAd.setAttribute('data-replaced', 'true');

      // Create a standard <ins> element for AdSense
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.style.width = '100%';
      ins.style.minHeight = '90px';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      ampAd.parentNode?.replaceChild(ins, ampAd);

      try {
        const windowWithAds = window as any;
        if (windowWithAds.adsbygoogle) {
          windowWithAds.adsbygoogle.push({});
        } else {
          windowWithAds.adsbygoogle = [];
          windowWithAds.adsbygoogle.push({});
        }
      } catch (err) {
        console.error('Error pushing adsbygoogle for amp-ad replacement:', err);
      }
    });

    // 2. Process standard <ins class="adsbygoogle"> tags
    const insAds = contentRef.current.querySelectorAll('ins.adsbygoogle');
    insAds.forEach((insAd) => {
      // Prevent double initialization
      if (insAd.getAttribute('data-ad-status') === 'filled' || insAd.getAttribute('data-initialized') === 'true') return;
      insAd.setAttribute('data-initialized', 'true');

      try {
        const windowWithAds = window as any;
        if (windowWithAds.adsbygoogle) {
          windowWithAds.adsbygoogle.push({});
        } else {
          windowWithAds.adsbygoogle = [];
          windowWithAds.adsbygoogle.push({});
        }
      } catch (err) {
        console.error('Error pushing adsbygoogle for ins-ad:', err);
      }
    });
  }, [pageContent, adSenseSettings]);



  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      // NOTE: useSearchParams already decodes query params once.
      // Do NOT call decodeURIComponent again — it would break Firebase Storage URLs
      // by converting %2F (path separator) into a literal slash, causing HTTP 400 errors.

      // ── Instant bypass for contact & social media links ──
      // These don't need a countdown — redirect immediately.
      const isDirectContact =
        urlParam.startsWith('tel:') ||
        urlParam.startsWith('mailto:') ||
        urlParam.startsWith('sms:') ||
        urlParam.includes('arb-soq.com') ||
        urlParam.includes('arab-store.allqaqasyana.com') ||
        urlParam.includes('allqaqasyana.com') ||
        urlParam.includes('wa.me') ||
        urlParam.includes('whatsapp.com') ||
        urlParam.includes('facebook.com') ||
        urlParam.includes('fb.com') ||
        urlParam.includes('instagram.com') ||
        urlParam.includes('twitter.com') ||
        urlParam.includes('x.com') ||
        urlParam.includes('t.me') ||
        urlParam.includes('youtube.com') ||
        urlParam.includes('youtu.be') ||
        urlParam.includes('tiktok.com') ||
        urlParam.includes('snapchat.com') ||
        urlParam.includes('linkedin.com');

      if (isDirectContact) {
        window.location.href = urlParam;
        return; // Don't set the countdown at all
      }

      setTargetUrl(urlParam);
    } else {
      // If no URL, redirect to home page after 3 seconds
      setCountdown(3);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      if (targetUrl) {
        setIsReady(true);
      } else {
        router.push('/');
      }
    }
  }, [countdown, targetUrl, router]);

  const handleGoToLink = () => {
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  // Calculate circular progress path (circumference = 2 * PI * r)
  const radius = 45;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = initialCountdown > 0 
    ? circumference - (countdown / initialCountdown) * circumference 
    : circumference;



  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between" dir="rtl">
      {/* Top Bar / Navigation */}
      <header className="p-4 border-b border-slate-900 bg-slate-905/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            سوق العرب
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center gap-8">
        


        {/* Redirect Card */}
        <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur-lg">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl mb-4 border border-amber-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{pageTitle}</h2>
          <div 
            ref={contentRef}
            className="text-sm text-slate-400 mb-6 rich-content w-full"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />

          {/* Circular Countdown Progress */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Foreground animated progress circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-emerald-500 transition-all duration-1000 ease-linear"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{countdown}</span>
              <span className="text-[10px] text-slate-400 font-medium">ثانية</span>
            </div>
          </div>



          {/* Action Button */}
          {isReady ? (
            <Button
              onClick={handleGoToLink}
              className="w-full py-6 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-950/40 border border-emerald-400/20 animate-pulse transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-5 w-5" />
              اضغط هنا للانتقال إلى الرابط
            </Button>
          ) : (
            <Button
              disabled
              className="w-full py-6 text-base font-medium bg-slate-800 text-slate-500 rounded-2xl border border-slate-750 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              يرجى الانتظار لتجهيز الرابط...
            </Button>
          )}

          {targetUrl && (
            <div className="mt-6 w-full">
              <p className="text-[11px] text-slate-500 truncate" dir="ltr">
                {targetUrl}
              </p>
            </div>
          )}
        </div>



      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900/50 bg-slate-950 text-center text-xs text-slate-600">
        <p>حقوق الطبع والنشر © {new Date().getFullYear()} سوق العرب. جميع الحقوق محفوظة.</p>
      </footer>

      <style>{`
        .rich-content p {
          margin-bottom: 0.5rem;
        }
        .rich-content h1, .rich-content h2, .rich-content h3 {
          font-weight: bold;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: white;
        }
        .rich-content a {
          color: #34d399;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
