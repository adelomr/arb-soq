'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToNewsletter, unsubscribeFromNewsletter, getNewsletterSubscribers, Subscriber } from '@/lib/newsletter-service';
import { Mail, Users, CheckCircle, AlertCircle, Loader2, MailMinus, MailPlus } from 'lucide-react';
import Image from 'next/image';

// List of vibrant gradients for subscribers without custom avatars
const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-fuchsia-500 to-purple-600',
];

function getGradientIndex(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_GRADIENTS.length;
}

export default function NewsletterSidebar() {
  const { userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadSubscribers, setLoadSubscribers] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'subscribe' | 'unsubscribe'>('subscribe');

  // Fetch subscribers on load
  useEffect(() => {
    if (loadSubscribers) {
      getNewsletterSubscribers().then((data) => {
        setSubscribers(data);
        setLoadSubscribers(false);
      });
    }
  }, [loadSubscribers]);

  // التعبئة التلقائية للبريد: من بيانات المستخدم إن كان مسجلاً، أو من localStorage للزوار
  useEffect(() => {
    if (userProfile?.email) {
      setEmail(userProfile.email);
    } else {
      // محاولة استعادة آخر بريد أدخله الزائر من التخزين المحلي
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('newsletter_email') : '';
      if (savedEmail) setEmail(savedEmail);
    }
  }, [userProfile]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStatus('idle');

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('الرجاء إدخال بريد إلكتروني صالح.');
      }

      if (mode === 'subscribe') {
        // Map UserProfile to the shape expected by subscribeToNewsletter
        const profileForSubscription = userProfile
          ? { uid: userProfile.id, name: userProfile.name, avatarUrl: userProfile.avatarUrl }
          : null;

        await subscribeToNewsletter(email.trim(), profileForSubscription);
        
        setStatus('success');
        setMessage('تم الاشتراك بنجاح! شكراً لانضمامك إلينا.');
        // إعادة تعبئة بريد المستخدم المسجّل، أو تفريغ الحقل للزوار
        setEmail(userProfile?.email || '');
        if (email.trim()) localStorage.setItem('newsletter_email', email.trim());
        setLoadSubscribers(true); // Trigger list reload
      } else {
        // Unsubscribe mode
        await unsubscribeFromNewsletter(email.trim());
        
        setStatus('success');
        setMessage('تم إلغاء الاشتراك بنجاح.');
        setEmail(userProfile?.email || '');
        localStorage.removeItem('newsletter_email');
        setLoadSubscribers(true); // Trigger list reload
        
        // Auto switch back to subscribe mode after a short delay
        setTimeout(() => {
          setMode('subscribe');
        }, 3000);
      }
      
      // Auto reset success message after 5s
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || (mode === 'subscribe' ? 'حدث خطأ أثناء الاشتراك. يرجى المحاولة لاحقاً.' : 'حدث خطأ أثناء إلغاء الاشتراك. يرجى المحاولة لاحقاً.'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to anonymize guest email for privacy
  const getDisplayName = (sub: Subscriber) => {
    if (sub.displayName) return sub.displayName;
    const parts = sub.email.split('@');
    if (parts[0].length <= 3) return `${parts[0]}***`;
    return `${parts[0].substring(0, 3)}***@${parts[1]}`;
  };

  const getInitials = (sub: Subscriber) => {
    if (sub.displayName) return sub.displayName.charAt(0).toUpperCase();
    return sub.email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-xs w-full mx-auto" dir="rtl">
      {/* 1. Subscription Form Widget */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-md">
                {mode === 'subscribe' ? 'النشرة البريدية' : 'إلغاء الاشتراك'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mode === 'subscribe' ? 'تابع آخر الأخبار والجديد' : 'إلغاء الاشتراك من القائمة'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'subscribe' ? 'unsubscribe' : 'subscribe');
              setStatus('idle');
              setMessage('');
            }}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title={mode === 'subscribe' ? 'إلغاء الاشتراك في النشرة' : 'العودة للاشتراك'}
          >
            {mode === 'subscribe' ? (
              <MailMinus className="w-4.5 h-4.5 text-destructive/70 hover:text-destructive" />
            ) : (
              <MailPlus className="w-4.5 h-4.5 text-primary" />
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed relative z-10">
          {mode === 'subscribe' 
            ? 'اشترك في بريد الموقع وتلقّ رسائل فورية وتنبيهات عند وجود مقالات حديثة أو إعلانات مميزة.'
            : 'أدخل بريدك الإلكتروني أدناه لإلغاء الاشتراك من القائمة البريدية وإيقاف استقبال التنبيهات.'}
        </p>

        <form onSubmit={handleSubscribe} className="space-y-3 relative z-10">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني..."
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-75 disabled:pointer-events-none text-sm ${
              mode === 'subscribe'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'subscribe' ? 'جاري الاشتراك...' : 'جاري إلغاء الاشتراك...'}
              </>
            ) : (
              <>
                {mode === 'subscribe' ? (
                  <>
                    <Mail className="w-4 h-4" />
                    اشتراك في القائمة
                  </>
                ) : (
                  <>
                    <MailMinus className="w-4 h-4" />
                    إلغاء الاشتراك
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {status !== 'idle' && (
          <div className={`mt-4 p-3 rounded-xl flex items-start gap-2.5 text-xs transition-all ${
            status === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' 
              : 'bg-destructive/5 text-destructive border border-destructive/10'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-normal">{message}</span>
          </div>
        )}
      </div>

      {/* 2. Followers Grid Widget */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground text-sm">المشتركون في الموقع</h3>
          </div>
          <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full">
            {subscribers.length} مشترك
          </span>
        </div>

        {subscribers.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">كن أول المشتركين في مدونتنا!</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-6 gap-2">
              {subscribers.slice(0, 24).map((sub, index) => {
                const name = getDisplayName(sub);
                const gradient = AVATAR_GRADIENTS[getGradientIndex(sub.email)];
                
                return (
                  <div key={index} className="group relative flex justify-center">
                    {sub.avatarUrl ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border group-hover:scale-110 transition-transform duration-200 cursor-pointer">
                        <Image
                          src={sub.avatarUrl}
                          alt={name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-110 transition-transform duration-200 cursor-pointer border border-border`}>
                        {getInitials(sub)}
                      </div>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-3xs font-medium px-2 py-1 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {subscribers.length > 24 && (
              <p className="text-3xs text-center text-muted-foreground mt-3 pt-2 border-t border-border/20">
                و {subscribers.length - 24} مشتركين آخرين ينشطون معنا
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
