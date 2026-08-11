'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToNewsletter, unsubscribeFromNewsletter, getNewsletterSubscribers, Subscriber } from '@/lib/newsletter-service';
import { Mail, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FooterNewsletterDrawer() {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'subscribe' | 'unsubscribe'>('subscribe');

  useEffect(() => {
    getNewsletterSubscribers().then(setSubscribers).catch(() => {});
  }, []);

  useEffect(() => {
    if (userProfile?.email) {
      setEmail(userProfile.email);
    } else {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('newsletter_email') : '';
      if (savedEmail) setEmail(savedEmail);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('الرجاء إدخال بريد إلكتروني صالح.');
      }

      if (mode === 'subscribe') {
        const profileForSub = userProfile
          ? { uid: userProfile.id, name: userProfile.name, avatarUrl: userProfile.avatarUrl }
          : null;

        await subscribeToNewsletter(email.trim(), profileForSub);
        setStatus('success');
        setMessage('تم الاشتراك بنجاح! شكراً لانضمامك للنشرة البريدية.');
        if (email.trim()) localStorage.setItem('newsletter_email', email.trim());
        const updated = await getNewsletterSubscribers();
        setSubscribers(updated);
      } else {
        await unsubscribeFromNewsletter(email.trim());
        setStatus('success');
        setMessage('تم إلغاء الاشتراك بنجاح.');
        localStorage.removeItem('newsletter_email');
        const updated = await getNewsletterSubscribers();
        setSubscribers(updated);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'حدث خطأ أثناء تنفيذ الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-card border-t border-border shadow-lg" dir="rtl">
      {/* Drawer Header Toggle Bar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-foreground font-headline flex items-center gap-2">
              <span>درج القائمة البريدية لسوق العرب</span>
              {subscribers.length > 0 && (
                <span className="text-[11px] font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  +{subscribers.length} مشترك
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground hidden sm:block">
              تابع أحدث الصفقات والإعلانات فور نشرها عبر بريدك الإلكتروني.
            </p>
          </div>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <span>{isOpen ? 'إغلاق الدرج' : 'افتح الدرج للاشتراك'}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Drawer Content */}
      <div
        className={`overflow-hidden transition-all duration-300 bg-secondary/30 ${
          isOpen ? 'max-h-96 py-6 border-t' : 'max-h-0 py-0'
        }`}
      >
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {mode === 'subscribe'
              ? 'أدخل بريدك الإلكتروني لتصلك أحدث العروض والفرص الحصرية في سوق العرب'
              : 'أدخل بريدك الإلكتروني لإلغاء الاشتراك من النشرة البريدية'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-right bg-background border-border text-foreground"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'subscribe' ? (
                <>
                  <Send className="h-4 w-4" />
                  <span>اشترك الآن</span>
                </>
              ) : (
                <span>إلغاء الاشتراك</span>
              )}
            </Button>
          </form>

          {/* Toggle Subscribe / Unsubscribe mode */}
          <div className="flex justify-center items-center gap-4 text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'subscribe' ? 'unsubscribe' : 'subscribe');
                setStatus('idle');
                setMessage('');
              }}
              className="text-muted-foreground hover:text-primary underline transition-colors"
            >
              {mode === 'subscribe' ? 'هل ترغب في إلغاء الاشتراك؟' : 'العودة للاشتراك'}
            </button>
          </div>

          {/* Status Alert */}
          {status !== 'idle' && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 max-w-md mx-auto ${
                status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
