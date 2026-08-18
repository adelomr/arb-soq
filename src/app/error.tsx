'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy, Check, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  const errorText = `${error?.name || 'Error'}: ${error?.message || 'Unknown error'}\nDigest: ${error?.digest || 'N/A'}\nStack:\n${error?.stack || 'No stack trace'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-background" dir="rtl">
      <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-destructive/30 bg-destructive/5 text-foreground space-y-6 shadow-lg text-right select-text">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-headline text-foreground">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              نعتذر عن هذا الخطأ. يمكنك نسخ تفاصيل الخطأ وإرسالها لنا لحلها فوراً.
            </p>
          </div>
        </div>

        {/* Error Details Box */}
        <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2 select-text">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-2 border-b border-border/50">
            <span>تفاصيل الخطأ التقنية:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>تم نسخ الخطأ بنجاح! ✅</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>نسخ تفاصيل الخطأ 📋</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs text-destructive font-mono overflow-x-auto p-2 bg-background/80 rounded-xl max-h-48 whitespace-pre-wrap select-text leading-relaxed dir-ltr text-left">
            {error?.message || 'Unknown application error'}
            {error?.digest ? `\n(Digest: ${error.digest})` : ''}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="gap-2 rounded-2xl font-bold flex-1 sm:flex-initial"
          >
            <RotateCcw className="h-4 w-4" />
            <span>إعادة المحاولة 🔄</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-2xl font-bold flex-1 sm:flex-initial"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>العودة للرئيسية 🏠</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
